# Changelog

## 0.5.1

### Patch Changes

-   [`76f5de6`](https://github.com/kimjbstar/prisma-class-generator/commit/76f5de606fdcffa56fb507d064ed59a835ee7337) Thanks [@kimjbstar](https://github.com/kimjbstar)! - Add property-based tests (fast-check) for default-value formatting and native-type validator
    mapping — the two areas that have actually shipped bugs before. No behavior change to the
    generator itself.

-   [`f096801`](https://github.com/kimjbstar/prisma-class-generator/commit/f096801ab05cc8f2363d3a97744702707aaebd43) Thanks [@kimjbstar](https://github.com/kimjbstar)! - Add a `typecheck` script (`tsc --noEmit`) and run it as a fast-failing first step in CI,
    before the full build/test cycle. No behavior change to the generator itself.

## 0.5.0

### Minor Changes

-   [`764dc35`](https://github.com/kimjbstar/prisma-class-generator/commit/764dc356824a7d1e6e680bb9b97ff5d1bc23b9ab) Thanks [@kimjbstar](https://github.com/kimjbstar)! - Add `validateNestedRelations` (opt-in `@ValidateNested()`/`@Type(() => X)` on relation and
    composite-type fields when `useValidation` is on), sharpen `useValidation`'s output using a
    field's `@db.*` native type on Prisma 6+ (`@IsUUID()`, `@IsMongoId()`, `@MaxLength(n)`,
    `@Min(0)`), add `useSerialization` + the `/// @exclude` directive for class-transformer's
    `@Exclude()`, and derive `@ApiProperty`'s `description`/`example` from a field's doc comment
    and literal `@default(...)` value. Also documents a `PartialType`/`OmitType` recipe in the
    README FAQ for composing Create/Update DTOs from the generated class.

### Patch Changes

-   [`764dc35`](https://github.com/kimjbstar/prisma-class-generator/commit/764dc356824a7d1e6e680bb9b97ff5d1bc23b9ab) Thanks [@kimjbstar](https://github.com/kimjbstar)! - Add SECURITY.md, CODE_OF_CONDUCT.md, Dependabot updates, CodeQL scanning, .editorconfig,
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

-   Friendlier dry-run output: explicitly states that nothing was written to
    disk and how to turn `dryRun` off, and unexpected errors now print the
    real stack trace with links to `CLAUDE.md`/`CONTRIBUTING.md`.
-   `CONTRIBUTING.md` and structured GitHub issue templates (bug report /
    feature request) with a PR checklist template.

### Changed

-   Broader `package.json` keywords/description for npm and GitHub search
    relevance.
-   README gained a "Comparison with similar tools" section (vs.
    `prisma-class-validator-generator`, `prisma-generator-nestjs-dto`).
-   Added `llms.txt` for AI coding agents.

## [0.4.0] - 2026-08-11

### Added

-   `useValidation` option: generates [class-validator](https://github.com/typestack/class-validator)
    decorators (`@IsInt`, `@IsString`, `@IsOptional`, `@IsEnum`, `@IsArray`,
    ...) based on each field's Prisma type, for use with NestJS's
    `ValidationPipe`.

## [0.3.0] - 2026-08-11

Baseline "rescue" release after a period without releases — this establishes
the project's current reliability floor (compatibility, tests, CI/release
automation) rather than shipping a single feature.

### Added

-   Prisma 7 compatibility: recognizes both the legacy `prisma-client-js` and
    the new `prisma-client` generator provider.
-   `preserveDecimal` option, per-field `/// @skip` and `/// @ApiHideProperty`
    doc-comment directives.
-   `clientImportPath` and `useNonNullableAssertions` options.
-   MongoDB composite type (`type X { ... }`) support.
-   CI workflow (build/test across Node 18/20/22, plus a Prisma 5/6/7
    compatibility matrix) and a tag-triggered npm release workflow.
-   Full Jest test suite, including golden snapshot tests across all 6
    supported databases (postgresql, mysql, mongodb, mssql, sqlite,
    cockroachdb).

### Fixed

-   Numeric defaults (e.g. `Int @default(1)`) no longer misdetected as `Date`
    values.
-   Falsy defaults (`0`, `false`) no longer dropped as if unset.
-   ESM circular-import crash on relation fields (#60).
-   GraphQL `Int`/`Float` mapping for `Decimal` fields.
-   Missing swagger/graphql type info on MongoDB composite type fields.

### Changed

-   `FileComponent` now takes its dependencies explicitly instead of reaching
    for a global singleton, making it testable in isolation.
