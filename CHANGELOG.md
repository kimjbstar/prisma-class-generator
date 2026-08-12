# Changelog

## 0.7.0

### Minor Changes

- [#108](https://github.com/kimjbstar/prisma-class-generator/pull/108) [`5696c4c`](https://github.com/kimjbstar/prisma-class-generator/commit/5696c4c7dada8c449ef40649b9c16ff9ad974d5e) Thanks [@kimjbstar](https://github.com/kimjbstar)! - Add `makeDtoFiles`, which generates `Create<Model>` and `Update<Model>` classes alongside each
  model class. They're compositions rather than copies — `CreateUser extends OmitType(User, [...] as
const)` and `UpdateUser extends PartialType(CreateUser)` — so a field's type, Swagger metadata and
  validators stay declared in exactly one place, and NestJS's mapped types carry all three through.
  Imported from `@nestjs/swagger` when `useSwagger` is on, `@nestjs/mapped-types` otherwise.

    A field leaves the `Create` DTO only when the schema itself says a client can't supply it: a
    function-based `@default(...)` (`autoincrement()`, `uuid()`, `now()`, `dbgenerated(...)`, …),
    `@updatedAt`, or a relation field. Literal defaults like `@default(0)`, relation foreign-key
    scalars, and an `@id` without a default all stay — nothing is inferred from field names. Off by
    default, so existing output is unchanged.

### Patch Changes

- [#106](https://github.com/kimjbstar/prisma-class-generator/pull/106) [`5be2cb0`](https://github.com/kimjbstar/prisma-class-generator/commit/5be2cb009c4d6253a986279c8077880c0906a33e) Thanks [@kimjbstar](https://github.com/kimjbstar)! - Fix `useNonNullableAssertions` producing TypeScript that doesn't compile. A field with a literal
  `@default(...)` was emitted as `views!: number = 0`, which is TS1263 — "Declarations with
  initializers cannot also have definite assignment assertions". Any model with at least one
  defaulted field made the whole generated file fail to build, and `useUndefinedDefault` hit the
  same thing. The assertion is now omitted whenever the field has an initializer, which is what
  definite assignment already means.

## 0.6.6

### Patch Changes

- [#104](https://github.com/kimjbstar/prisma-class-generator/pull/104) [`3188d7a`](https://github.com/kimjbstar/prisma-class-generator/commit/3188d7aef8cf4105636a89618eeaa3df85e7fca4) Thanks [@kimjbstar](https://github.com/kimjbstar)! - Cut what this package costs to install. `@prisma/internals` moves to devDependencies: the specs
  still use its `getDMMF`, but it installs 28MB, `prisma` itself doesn't depend on it (so it never
  dedupes with a project's existing install), and the generator only needed two things from it —
  `parseEnvValue` and `logger.info` — both now transcribed into `util.ts` with their behaviour and
  output unchanged. Sourcemaps are also no longer published: `files` ships only `dist`, so their
  `sources: ["../src/*.ts"]` pointed at files that were never in the tarball.

    Runtime dependencies are now `@prisma/generator-helper` and `prettier`. The published tarball is
    29% smaller (130.8kB → 93.0kB unpacked), and `@prisma/internals`' 28MB is gone from every install.
    `package.json` also declares `"type": "commonjs"` explicitly so Node doesn't have to detect it.

## 0.6.5

### Patch Changes

- [#102](https://github.com/kimjbstar/prisma-class-generator/pull/102) [`92a7161`](https://github.com/kimjbstar/prisma-class-generator/commit/92a716151bf6168b4e1fa78c9412381a8855797c) Thanks [@kimjbstar](https://github.com/kimjbstar)! - Drop the `change-case` runtime dependency. It was used for exactly one function (`snakeCase`, on
  Prisma model/type names), and pulled in 16 packages transitively; its 5.x line is ESM-only, which
  this CommonJS build can't consume on Node 18. That one function now lives in `util.ts` as
  `toSnakeCase`, transcribed from change-case@4 and verified against it over 150k property-generated
  inputs — Prisma identifiers, messy ASCII and arbitrary unicode — with zero differences, so no
  generated filename or import path changes. Runtime dependencies are down to three:
  `@prisma/generator-helper`, `@prisma/internals` and `prettier`.

## 0.6.4

### Patch Changes

- [#100](https://github.com/kimjbstar/prisma-class-generator/pull/100) [`1dd70f6`](https://github.com/kimjbstar/prisma-class-generator/commit/1dd70f6b6d43ee7d701a395339edee61e81bd41d) Thanks [@kimjbstar](https://github.com/kimjbstar)! - Adopt TypeScript `strict` mode across the generator's own source and specs. This is an internal
  type-safety change with no difference in generated output (the golden fixture snapshots are
  byte-identical), but it did tighten a few types that were previously lying about what they can
  hold at runtime: `getPrimitiveMapTypeFromDMMF()` now declares the `undefined` it already returned
  for non-scalar fields, `ImportComponent#getReplacePath()` declares its `null`, `prettierOptions`
  declares the `null` prettier itself returns when a project has no config file, and
  `handleGenerateError()` accepts `unknown` instead of assuming a `catch` block always yields an
  `Error`.

## 0.6.3

### Patch Changes

- [`ee8e163`](https://github.com/kimjbstar/prisma-class-generator/commit/ee8e1637e48e3dea6ae409ef4fc12486ecbea722) Thanks [@kimjbstar](https://github.com/kimjbstar)! - Removes every remaining `any` in `src/` and turns `@typescript-eslint/no-explicit-any` back
  into a hard error (it was temporarily downgraded to a warning when ESLint first landed).

    - `DecoratorComponent#params` was typed `any[]`, treated as genuinely unshapeable. It isn't:
      every value actually pushed through it across `convertor.ts` is either a ready-to-interpolate
      code fragment (string/number/boolean) or a plain options object rendered via
      `Object.entries()`. Now typed as an exported `DecoratorParam = string | number | boolean |
object` union -- `object` rather than `Record<string, unknown>` on purpose, since the latter
      demands an index signature that a concrete interface like `SwaggerDecoratorParams` doesn't
      (and shouldn't) declare.
    - `ImportComponent#add(item: any)` -- its one real call site (`FileComponent#registerImport`)
      always passes a `string`, matching the class's own `items: string[]` field. Typed as such.
    - `PrismaClassGeneratorConfig` was `Partial<Record<PrismaClassGeneratorOptionsKeys, any>>`.
      Every option is a plain `boolean` except `clientImportPath` (`string | string[]`) -- named
      explicitly as an interface instead of one union covering all of them, so
      `config.dryRun`/`config.useGraphQL`/etc. type as real booleans everywhere they're read,
      no cast needed.

    No behavior change -- `npm run build`/`test` output is identical; this is strictly narrowing
    existing `any` slots to the types the values already had at runtime.

## 0.6.2

### Patch Changes

- [`ae4f87f`](https://github.com/kimjbstar/prisma-class-generator/commit/ae4f87f9e8c9a0c183c5d85750a3248795c89203) Thanks [@kimjbstar](https://github.com/kimjbstar)! - No functional change -- dev-tooling only.

    - Removes `swagger-ui-express` and `ts-toolbelt` from `devDependencies`: neither is imported
      anywhere in `src/`, and `swagger-ui-express` was pulling in a stale peer-dependency warning
      on every install (`unmet peer dependency "express"`).
    - Adds a `test:coverage` script (`jest --coverage`) and scopes `collectCoverageFrom` in
      `jest.config.js` to `src/**/*.ts` (excluding specs, `_gen`, and `bin.ts`). CI now prints a
      coverage summary to the job summary on the node-22 leg (once per run, not once per matrix
      leg -- coverage doesn't vary by Node version).

- [`6f2100f`](https://github.com/kimjbstar/prisma-class-generator/commit/6f2100f0898bd4a3bdcb61ccf312b658d8c75c8a) Thanks [@kimjbstar](https://github.com/kimjbstar)! - Adds ESLint (flat config, `typescript-eslint` + `eslint-config-prettier` so it never fights
  Prettier on style) and a `lint` script, wired into CI right after `typecheck`. Kept to
  `typescript-eslint`'s `recommended` rule set rather than a stricter/type-checked one --
  `tsconfig.json` already documents `strict: false` as a deliberate, separately-scoped decision
  (~60 pre-existing errors), and piling a stricter lint config on top of that today would just
  be the same undertaking wearing a different hat. `@typescript-eslint/no-explicit-any` is a
  warning, not an error: this codebase's `DecoratorComponent`/`ImportComponent` params are
  genuinely heterogeneous template-fill values (see CLAUDE.md's string-template-pipeline
  description) -- forcing a type there wouldn't add real safety.

    Fixed everything the first `eslint src` run actually flagged as an error (not a drive-by
    sweep, just what the tool surfaced):
    - 3 `let` that were never reassigned (`prefer-const`)
    - An unused `pascalCase` import and an unused `options` local
    - Two real `any`-typed values found to always be `string` in practice, now typed as such
      (`ImportComponent#add`)
    - One real bug the loose typing was hiding: `GeneratorFormatNotValidError`'s constructor took
      `config: any` but called `super()` with no arguments, so `.message` was always empty --
      and the two real call sites (`parseBoolean`/`parseNumber` in util.ts) pass a formatted
      string, not the `Dictionary<string>` the class's own field type claimed. Now takes
      `message: string` and calls `super(message)`; `handleGenerateError` logs `e.message`
      instead of `JSON.stringify(e.config)`, which used to just re-quote the same string.

    `eslint`/`typescript-eslint`/`@eslint/js` are pinned carefully for Node 18 (this repo's own
    floor): `eslint@^9.39.5` (not the latest 10.x, which requires Node >=20.19) and
    `typescript-eslint@8.55.0` exactly, no caret -- 8.56.0+ bumps a transitive
    `eslint-visitor-keys` dependency to `^5.0.0`, which also requires Node >=20.19. Verified with
    a clean `yarn install --frozen-lockfile` + typecheck/lint/build/test on real Node 18.20.8.

## 0.6.1

### Patch Changes

- [#91](https://github.com/kimjbstar/prisma-class-generator/pull/91) [`e8cfb37`](https://github.com/kimjbstar/prisma-class-generator/commit/e8cfb3786a7cb475ab0784faf68736c5da9746b2) Thanks [@kimjbstar](https://github.com/kimjbstar)! - Bump the _runtime_ `dependencies` `@prisma/generator-helper` and `@prisma/internals` from
  6.19.3 to 7.9.1. `devDependencies` `prisma` and `@prisma/client` stay on 6.19.3 -- those two
  specifically refuse to install on Node < 20.19 (their own `preinstall` script hard-fails).

    The first attempt at this bump broke `yarn install` on Node 18 in CI: `@prisma/internals@7.9.1`
    pulls in `chokidar@5.0.0` transitively (via `@prisma/config` -> `c12`), and chokidar 5 requires
    Node >= 20.19. Traced it: `c12` only reaches for chokidar via a lazy `await import("chokidar")`
    inside its config-_watch_ feature, which this generator's code (`getDMMF`/`parseEnvValue`/
    `logger` only) never triggers -- so the actual chokidar module is never loaded at runtime here.
    Added a `resolutions` override pinning `chokidar` to `^4.0.3` (the same major that
    `prisma@6.19.3`'s own `c12` dependency already resolves to, so it's a well-exercised version)
    to sidestep the install-time engine check without touching any code path this package uses.
    Verified with a clean `yarn install --frozen-lockfile` + full `typecheck`/`build`/`test` run on
    real Node 18.20.8 (via nvm, with engine-strict actually enforced -- not just locally-lenient
    npm/yarn config).

    This also removes the local `FieldWithNativeType` type augmentation in convertor.ts --
    `nativeType` is now part of the official `DMMF.Field` type as of `@prisma/generator-helper` 7.x,
    so the workaround cast is redundant.

    Prisma 7 also dropped the `url` field from `datasource` blocks entirely (moved to
    `prisma.config.ts`), which broke every test that builds a schema string and feeds it through
    `getDMMF` (now on 7.9.1). Fixed by dropping `url` from the inline schema templates in
    convertor.spec.ts/file.component.spec.ts, and by stripping the `url` line at read-time in
    fixtures.spec.ts before parsing -- the checked-in `prisma/*.prisma` fixture files themselves
    keep `url` untouched, since `npm run generate:*` still drives them through the pinned Prisma 6
    CLI, which still expects it.

    Verified against real `prisma generate` runs for all 6 fixture databases (unaffected -- they go
    through the pinned `prisma` devDependency, not the bumped runtime deps), and confirmed the
    built `dist/index.js` (compiled against 7.9.1 types) still works correctly when invoked by the
    Prisma 6.19.3 CLI, proving the generator-helper JSON-RPC protocol is compatible across that
    version gap.

- [`b1075f8`](https://github.com/kimjbstar/prisma-class-generator/commit/b1075f84094d7b524c756c3e0b1c88be8d4de612) Thanks [@kimjbstar](https://github.com/kimjbstar)! - Bumps `ts-node` to its latest patch (10.9.2, no functional change -- devDependency only,
  doesn't ship to consumers). Cherry-picked out of dependabot PR [#90](https://github.com/kimjbstar/prisma-class-generator/issues/90) (a grouped
  dev-dependencies bump), which also tried to jump `typescript` 5.9.3 -> 7.0.2 and
  `@types/node` 18 -> 26 in the same PR and broke `npm test` on every CI leg (`ts-jest`
  doesn't expose TypeScript 7's restructured compiler API yet). Added `ignore` rules to
  `.github/dependabot.yml` for major-version bumps on both `typescript` (until ts-jest
  supports TS7) and `@types/node` (kept tracking this repo's own `engines.node` floor of
  18, not a hypothetical future Node major) so this doesn't recur.

- [`9752f41`](https://github.com/kimjbstar/prisma-class-generator/commit/9752f41abc974c545216bf112798f452175ba902) Thanks [@kimjbstar](https://github.com/kimjbstar)! - Fixes three Windows-specific bugs found while adding a `windows-latest` leg to CI:

    - `getRelativeTSPath` (used to build every relation/index-barrel import path) fed
      `path.relative()`'s output straight into a generated `import ... from '...'` string.
      On Windows, `path.relative()` returns `\`-separated paths, which produced an invalid
      module specifier like `import ... from '..\foo'`. Now normalized to forward slashes
      unconditionally (a POSIX import specifier is required regardless of host OS).
    - The `test` npm script used bash's `VAR=value command` syntax
      (`NODE_OPTIONS=--experimental-vm-modules jest`), which fails outright under Windows'
      default `cmd.exe` shell. Switched to `cross-env`.
    - The `clean` script used `rm -rf dist`, also bash-only. Switched to `rimraf`.

    Both `cross-env` and `rimraf` are pinned to majors that still support Node 18
    (`cross-env@^7.0.3`, `rimraf@^5.0.10`) -- their latest majors require Node 20+, which would
    have undone the Node 18 support this project maintains.

## 0.6.0

### Minor Changes

- [`da90bb2`](https://github.com/kimjbstar/prisma-class-generator/commit/da90bb29ab503a87b446eff73d6f1c4313682f4d) Thanks [@kimjbstar](https://github.com/kimjbstar)! - Pushes the already-supported class-validator/class-transformer integrations further, verified
  against Prisma's own schema reference docs and (for the class-validator claim below) the
  `typestack/class-validator` source itself:

    - `useValidation`: postgresql/cockroachdb's `@db.Inet` now generates `@IsIP()` (replacing the
      generic `@IsString()`), and cockroachdb's `@db.String(n)` — its own name for what postgresql
      calls `@db.VarChar(n)` — now generates `@MaxLength(n)` like the other length-constrained
      string native types already did.
    - `useSerialization`: a new `/// @expose` per-field directive generates class-transformer's
      `@Expose()`, mirroring the existing `/// @exclude` → `@Exclude()`, for projects that use
      `plainToInstance(cls, data, { excludeExtraneousValues: true })`'s allow-list model instead of
      `@Exclude()`'s deny-list one.

    Deliberately **not** adding MySQL's `@db.UnsignedBigInt` → `@Min(0)`: it maps to Prisma's
    `BigInt` scalar, and class-validator's `Min`/`Max` require `typeof value === 'number'` — a JS
    `BigInt` value's `typeof` is always `'bigint'`, so the decorator would reject every value,
    including valid non-negative ones. Confirmed by reading `Min.ts` in class-validator's own
    source, not guessed.

- [`3d3ca0a`](https://github.com/kimjbstar/prisma-class-generator/commit/3d3ca0a9de20558140097063ce804c3dc70a8d8c) Thanks [@kimjbstar](https://github.com/kimjbstar)! - `useSerialization` now generates class-transformer's `@Type(() => X)` on relation and
  composite-type fields, independently of `useValidation`. Previously `@Type()` was only
  generated as a side effect of `validateNestedRelations` (which itself requires
  `useValidation`) — so a project using `useSerialization` alone for
  `ClassSerializerInterceptor`-based response serialization never got it, and a nested relation
  in a response stayed a plain object instead of an instance of the related class, silently
  skipping that class's own `@Exclude()`/`@Expose()` decorators.

    `@Type()` generation is now a single shared code path: it fires when `useSerialization` is on,
    or when `useValidation` + `validateNestedRelations` are both on, and doesn't duplicate the
    decorator when more than one of those is true at once.

## 0.5.2

### Patch Changes

- [`52bc1ad`](https://github.com/kimjbstar/prisma-class-generator/commit/52bc1ade2ec6853ef6b3284f8037a39a10788821) Thanks [@kimjbstar](https://github.com/kimjbstar)! - Bump `prettier` from 2.5.1 to 3.9.6 (and `@types/prettier` to match) and migrate the generator's
  internal formatting calls to prettier 3's async-only API (`resolveConfig`/`format` no longer have
  `.sync` variants). No change to generated output. Also runs `jest` with
  `NODE_OPTIONS=--experimental-vm-modules` — prettier 3's CJS entry point uses a dynamic `import()`
  internally, which Jest's default VM sandbox rejects without that flag.

- [`a3f573d`](https://github.com/kimjbstar/prisma-class-generator/commit/a3f573d0a3105ecd1d881af6bd79cb3a3b3821e0) Thanks [@kimjbstar](https://github.com/kimjbstar)! - Bump `@prisma/generator-helper`, `@prisma/internals`, `@prisma/client`, and `prisma` from
  5.5.2 to 6.19.3. Deliberately stopping at 6.x rather than 7.x (what dependabot's PR [#81](https://github.com/kimjbstar/prisma-class-generator/issues/81)
  proposed): Prisma 7 requires Node `^20.19 || ^22.12 || >=24.0` and drops Node 18 entirely,
  while this project still supports and tests against Node 18. Prisma 6.19.3 still supports
  Node `>=18.18`.

    Verified against real `prisma generate` runs (postgresql and mongodb fixtures) on both
    Node 18.20.8 and 22.23.1 — the generated output is unchanged.

    Also adds an explicit `DMMF.Document` type annotation to `PrismaConvertor#dmmf`'s
    getter/setter — Prisma 6 restructured DMMF's types across an internal `@prisma/dmmf`
    package boundary that TypeScript's declaration emit can no longer name portably without it
    (TS2742), and enables `isolatedModules` in tsconfig.json to silence a ts-jest warning
    (TS151002) about the `node16` module kind introduced in the prior tsconfig modernization.

- [`f5d5a3b`](https://github.com/kimjbstar/prisma-class-generator/commit/f5d5a3b2dec5acdb2ace8b8267a9ba3ef1e8ea9a) Thanks [@kimjbstar](https://github.com/kimjbstar)! - Modernize tsconfig.json ahead of TypeScript 6/7: replace the removed `baseUrl` /
  `moduleResolution: "node"` / `suppressExcessPropertyErrors` / `suppressImplicitAnyIndexErrors` /
  `downlevelIteration` options with `module`/`moduleResolution: "node16"` (the two must now match)
  and an explicit `rootDir`. Explicitly pin `strict: false` since TypeScript 6+ defaults it to
  `true` and this codebase isn't strict-clean yet. No change to generated output.

    Note: actually bumping the `typescript` dependency to 7.x is still blocked — TypeScript 7 drops
    the JS compiler API that `ts-jest`/`ts-node` need, and neither has shipped compatibility yet
    (see kulshekhar/ts-jest#5366). `typescript` stays on the 5.x line for now.

## 0.5.1

### Patch Changes

- [`76f5de6`](https://github.com/kimjbstar/prisma-class-generator/commit/76f5de606fdcffa56fb507d064ed59a835ee7337) Thanks [@kimjbstar](https://github.com/kimjbstar)! - Add property-based tests (fast-check) for default-value formatting and native-type validator
  mapping — the two areas that have actually shipped bugs before. No behavior change to the
  generator itself.

- [`f096801`](https://github.com/kimjbstar/prisma-class-generator/commit/f096801ab05cc8f2363d3a97744702707aaebd43) Thanks [@kimjbstar](https://github.com/kimjbstar)! - Add a `typecheck` script (`tsc --noEmit`) and run it as a fast-failing first step in CI,
  before the full build/test cycle. No behavior change to the generator itself.

## 0.5.0

### Minor Changes

- [`764dc35`](https://github.com/kimjbstar/prisma-class-generator/commit/764dc356824a7d1e6e680bb9b97ff5d1bc23b9ab) Thanks [@kimjbstar](https://github.com/kimjbstar)! - Add `validateNestedRelations` (opt-in `@ValidateNested()`/`@Type(() => X)` on relation and
  composite-type fields when `useValidation` is on), sharpen `useValidation`'s output using a
  field's `@db.*` native type on Prisma 6+ (`@IsUUID()`, `@IsMongoId()`, `@MaxLength(n)`,
  `@Min(0)`), add `useSerialization` + the `/// @exclude` directive for class-transformer's
  `@Exclude()`, and derive `@ApiProperty`'s `description`/`example` from a field's doc comment
  and literal `@default(...)` value. Also documents a `PartialType`/`OmitType` recipe in the
  README FAQ for composing Create/Update DTOs from the generated class.

### Patch Changes

- [`764dc35`](https://github.com/kimjbstar/prisma-class-generator/commit/764dc356824a7d1e6e680bb9b97ff5d1bc23b9ab) Thanks [@kimjbstar](https://github.com/kimjbstar)! - Add SECURITY.md, CODE_OF_CONDUCT.md, Dependabot updates, CodeQL scanning, .editorconfig,
  README status badges, FUNDING.yml, CHANGELOG.md, and a Discussions pointer for usage
  questions. No behavior change to the generator itself.

All notable changes to this project are documented here. The format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses
[Semantic Versioning](https://semver.org/).

Starting after 0.4.1, releases are cut by [Changesets](https://github.com/changesets/changesets)
— see [CONTRIBUTING.md](./CONTRIBUTING.md#releasing) for how that works. Entries above this
point are generated automatically (`## <version>` with `### Major/Minor/Patch Changes`
subheadings) rather than hand-written, so the format shifts slightly from the entries below.

Versions before 0.3.0 aren't itemized here — they predate this project's CI/release automation
and test suite, so a reliable per-version record doesn't exist. See the
[releases page](https://github.com/kimjbstar/prisma-class-generator/releases) for the raw
commit history if you need it.

## [0.4.1] - 2026-08-11

### Added

- Friendlier dry-run output: explicitly states that nothing was written to
  disk and how to turn `dryRun` off, and unexpected errors now print the
  real stack trace with links to `CLAUDE.md`/`CONTRIBUTING.md`.
- `CONTRIBUTING.md` and structured GitHub issue templates (bug report /
  feature request) with a PR checklist template.

### Changed

- Broader `package.json` keywords/description for npm and GitHub search
  relevance.
- README gained a "Comparison with similar tools" section (vs.
  `prisma-class-validator-generator`, `prisma-generator-nestjs-dto`).
- Added `llms.txt` for AI coding agents.

## [0.4.0] - 2026-08-11

### Added

- `useValidation` option: generates [class-validator](https://github.com/typestack/class-validator)
  decorators (`@IsInt`, `@IsString`, `@IsOptional`, `@IsEnum`, `@IsArray`,
  ...) based on each field's Prisma type, for use with NestJS's
  `ValidationPipe`.

## [0.3.0] - 2026-08-11

Baseline "rescue" release after a period without releases — this establishes
the project's current reliability floor (compatibility, tests, CI/release
automation) rather than shipping a single feature.

### Added

- Prisma 7 compatibility: recognizes both the legacy `prisma-client-js` and
  the new `prisma-client` generator provider.
- `preserveDecimal` option, per-field `/// @skip` and `/// @ApiHideProperty`
  doc-comment directives.
- `clientImportPath` and `useNonNullableAssertions` options.
- MongoDB composite type (`type X { ... }`) support.
- CI workflow (build/test across Node 18/20/22, plus a Prisma 5/6/7
  compatibility matrix) and a tag-triggered npm release workflow.
- Full Jest test suite, including golden snapshot tests across all 6
  supported databases (postgresql, mysql, mongodb, mssql, sqlite,
  cockroachdb).

### Fixed

- Numeric defaults (e.g. `Int @default(1)`) no longer misdetected as `Date`
  values.
- Falsy defaults (`0`, `false`) no longer dropped as if unset.
- ESM circular-import crash on relation fields (#60).
- GraphQL `Int`/`Float` mapping for `Decimal` fields.
- Missing swagger/graphql type info on MongoDB composite type fields.

### Changed

- `FileComponent` now takes its dependencies explicitly instead of reaching
  for a global singleton, making it testable in isolation.
