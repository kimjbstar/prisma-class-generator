# Changelog

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
