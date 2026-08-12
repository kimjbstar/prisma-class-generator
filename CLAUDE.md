# CLAUDE.md

Guidance for AI coding assistants (and human contributors) working in this repo.
For what this package *does* and how to *use* it, see [README.md](./README.md) — this file
is about working on the generator itself. For the PR mechanics (checklist, what tends to get
merged quickly), see [CONTRIBUTING.md](./CONTRIBUTING.md).

## What this is

A Prisma generator (`prisma-class-generator`) that reads a schema's DMMF and emits one
TypeScript class per model/composite-type, decorated for `@nestjs/swagger` and/or
`@nestjs/graphql`. It runs as a subprocess Prisma's CLI spawns via the JSON-RPC generator
protocol (`@prisma/generator-helper`'s `generatorHandler`), not as a library the user imports.

## Architecture

```
src/
  index.ts          generatorHandler entry point (what Prisma's CLI actually spawns)
  bin.ts             CLI entry point (the "prisma-class-generator" bin)
  generator.ts       PrismaClassGenerator — orchestrates one full run()
  convertor.ts       PrismaConvertor — DMMF.Field -> FieldComponent/ClassComponent
  components/        Class/Field/Decorator/Import/File components (string-template assembly)
  templates/         `#!{PLACEHOLDER}` string templates the components fill in
```

This is deliberately a string-template pipeline, not an AST transform. It's simple to reason
about at this size — don't reach for ts-morph or similar without a concrete reason.

Runtime `dependencies` are deliberately kept to two (`@prisma/generator-helper`, `prettier`) —
everything a user installs to run this generator. `@prisma/internals` is a **devDependency on
purpose**: the specs use its `getDMMF`, but it installs 28MB and `prisma` itself doesn't depend
on it (so it never dedupes), and the only two things the generator needed from it —
`parseEnvValue` and `logger.info` — are transcribed into `util.ts`. Before adding any runtime
import, check whether it's really worth what it costs a user; `npm run verify:packed` is what
catches a runtime import that only resolves because this repo has everything installed.

`util.ts`'s `toSnakeCase` used to be `change-case`'s
`snakeCase`, inlined once that package's only remaining pull was one function and its 5.x line
went ESM-only; its output is a **compatibility contract**, not a style choice — it produces both
the generated filename and the import path other generated files reach it by, so changing it
renames every existing user's generated files. `util.spec.ts` pins the cases that matter.

`PrismaClassGenerator` and `PrismaConvertor` are singletons (`static instance` /
`getInstance()`) — fine for a CLI that runs once per process. `FileComponent`, however, takes
`clientImportPath`/`useGraphQL`/`prettierOptions` as explicit constructor params rather than
reaching for the singleton — keep it that way; it's what makes `FileComponent` testable without
seeding global state in every spec file.

## Commands

```
npm run build          # rm -rf dist && tsc — always clean-builds, never leaves stale output
npm test                # jest
npm run format:check    # what CI enforces — `npm run lint` can't catch formatting, because
                         # eslint-config-prettier *disables* those rules rather than checking them
npm run lint:package    # publint against the packed tarball. `--pack npm` is not optional:
                         # publint mis-parses Yarn Classic's tarballs (bare directory entries)
                         # and reports every entry point as missing from `files`
npm run verify:packed   # pack, install the tarball into an empty project, run a real
                         # `prisma generate` through it by provider name — the only check that
                         # sees a bad files/bin field or a runtime import of a devDependency
npm run generate:*      # regenerate a fixture under prisma/*.prisma (postgresql, mysql,
                         # mongodb, mssql, sqlite, cockroachdb) — useful for manually eyeballing
                         # output, but note prisma-client-js's auto-install can add
                         # `@prisma/client` back into package.json as a side effect; that's
                         # intentionally a devDependency, revert it if it reappears in
                         # `dependencies`.
```

## Testing approach

- `src/**/*.spec.ts` (excluded from `tsc` build via tsconfig, picked up by `jest.config.js`).
- `src/fixtures.spec.ts` is the important one: it runs the *actual* `prisma/*.prisma` files
  (one per supported database) through the real pipeline and snapshots the full output of every
  generated file with `toMatchSnapshot()`. This is the closest thing to a golden/end-to-end test
  in this repo — fragment-level `toContain()` assertions elsewhere are useful for pinpointing
  *why* something changed, but the snapshot is what proves the whole pipeline still produces
  correct code for a real schema.
- When you intentionally change generated output, run `npx jest -u` and **read the diff** before
  committing the updated snapshot — the point of the golden test is that a snapshot diff is a
  decision point, not a checkbox.
- `PrismaConvertor`/`FileComponent` can be tested directly by `new`-ing them (bypass
  `getInstance()`) and feeding them DMMF from `getDMMF({ datamodel: '...' })` — no live database
  needed. See `src/convertor.spec.ts` / `src/components/file.component.spec.ts` for the pattern.
- `PrismaClassGenerator` has some regular prototype methods (`getClientImportPath`,
  `setPrismaClientPath`) and some real constructor-time state (`prettierOptions`, set by
  resolving the *consuming project's* prettier config, not this repo's). To test methods that
  need `this.options` without a full `GeneratorOptions`, `Object.create(PrismaClassGenerator.prototype)`
  works and lets you set just `.options`/`.getConfig` as needed — see `generator.spec.ts`.
- `src/convertor.property.spec.ts` uses [fast-check](https://github.com/dubzzz/fast-check) for
  property-based coverage of the two areas that have actually shipped bugs before: default-value
  formatting (the Date-misdetection/falsy-value-dropped bugs, #34/#56/#76) and native-type
  validator mapping. Reach for a property here — instead of another hand-picked example in
  `convertor.spec.ts` — when the bug class is "some input value triggers wrong behavior" rather
  than "this specific schema shape is unsupported"; fast-check explores the value space a human
  wouldn't think to enumerate by hand. On a failure, fast-check prints a shrunk counterexample
  and a seed/path you can hardcode into `fc.assert(..., { seed, path })` to reproduce it exactly
  while debugging.

## Known DMMF gotchas (learned the hard way)

- `dmmfField.default` is the literal default value for simple defaults, but an
  `{ name, args }` object for function-based defaults (`now()`, `autoincrement()`, `dbgenerated()`,
  `sequence()` on CockroachDB). Check for this shape before treating a default as a literal —
  and never truthiness-check it directly (`0`, `false`, and `''` are all valid, real defaults).
- `Unsupported("...")` fields are dropped from `dmmf.datamodel.models[].fields` entirely —
  Prisma Client doesn't expose them either, so there's nothing for this generator to do there.
- SQL Server and SQLite reject `enum` blocks at the schema-validation stage (before DMMF is even
  produced) — that's a Prisma connector limitation, not something fixable here.
- Composite types (MongoDB `type X { }` blocks) show up in `dmmf.datamodel.types`, are neither
  `relationName` nor `kind === 'enum'`, but still need `type: () => X` in decorators just like
  relations do — see the `kind === 'object'` branches in `convertor.ts`.
- Prisma 7 renamed the default client generator from `prisma-client-js` to `prisma-client`.
  `PRISMA_CLIENT_GENERATOR_PROVIDERS` in `generator.ts` must keep recognizing both. Do **not**
  add both names to `onManifest().requiresGenerators` — Prisma validates that array with AND
  semantics (every listed generator must be present), so listing both would require a schema to
  declare *both* client generators at once.
- A relation field's type annotation (`book: BookAsType`, not `book: Book`) intentionally uses a
  `type`-only import alias registered alongside the value import in
  `FileComponent#resolveImports`. This isn't cosmetic: `emitDecoratorMetadata` (which most NestJS
  projects turn on) emits an eager `__metadata("design:type", Book)` reference, and under ESM's
  live-binding circular-import semantics two files that relate to each other will throw
  `ReferenceError: Cannot access 'Book' before initialization` — reproduced with real
  `tsc --module ES2020 --emitDecoratorMetadata` output run under Node's native ESM loader. A
  `type`-only import has no runtime value, so TS can't emit a reference to it. Keep both the value
  import (the decorator, e.g. `type: () => Book`, still needs it) and the type-only alias.

## Type safety

`tsconfig.json` has `strict: true` and `src/` is clean under it (specs included — ts-jest
type-checks them with the same tsconfig, so a spec that ignores a possibly-`undefined` lookup
fails the test run, not just `npm run typecheck`). Two conventions came out of adopting it, both
deliberate:

- **Definite-assignment (`!`) is reserved for late-injected singleton state** — `PrismaConvertor`'s
  `_dmmf`/`_config` and `PrismaClassGenerator`'s `_options`/`rootPath`/`clientPath`, all of which
  are set through setters right after construction rather than passed in. Don't paper over an
  ordinary "might be undefined" with `!`; either give the field a real default or make the type
  admit `undefined` and handle it.
- **`PrismaClassGeneratorConfig` stays all-optional** so specs can build partial configs, which
  means call sites that need a concrete value supply the same default `PrismaClassGeneratorOptions`
  declares (see `run()`'s `config.dryRun ?? true`). `getConfig()` builds its result through a
  string-keyed record and casts once at the end — indexing the interface with a *union* of keys
  narrows the assignable type to nothing, so a per-key loop can't be written against it directly.

## Style

- Tabs, no semicolons, single quotes — see `.prettierrc.json`, run `npm run format`.
- `REVIEW.md` (if present locally) is gitignored on purpose — it's an internal planning doc, not
  meant for the public repo. `README.md` and this file are the ones meant to be shared.
