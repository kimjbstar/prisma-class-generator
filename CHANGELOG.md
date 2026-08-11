# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
uses [Semantic Versioning](https://semver.org/).

Versions before 0.3.0 aren't itemized here — they predate this project's
CI/release automation and test suite, so a reliable per-version record
doesn't exist. See the [releases page](https://github.com/kimjbstar/prisma-class-generator/releases)
for the raw commit history if you need it.

## [Unreleased]

### Added

- `validateNestedRelations` option: opt-in `@ValidateNested()` +
  class-transformer's `@Type(() => X)` on relation/composite-type fields
  when `useValidation` is enabled, so NestJS's `ValidationPipe` can recurse
  into nested payloads.
- `useValidation` now sharpens its class-validator decorators using a
  field's `@db.*` native type on Prisma 6+ (a no-op on Prisma 5, whose DMMF
  doesn't expose native types): `@db.Uuid`/`@db.UniqueIdentifier` and
  MongoDB's `@db.ObjectId` replace the generic string validator with
  `@IsUUID()`/`@IsMongoId()`; `@db.VarChar(n)`/`@db.Char(n)` (and
  sqlserver's N-prefixed variants) add `@MaxLength(n)`; MySQL's unsigned
  integer types add `@Min(0)`.
- `useSerialization` option + `/// @exclude` directive: generates
  class-transformer's `@Exclude()` for fields marked with the directive,
  for use with NestJS's `ClassSerializerInterceptor`.
- `useSwagger` now derives `@ApiProperty`'s `description` from a field's
  `///` doc comment and `example` from a literal `@default(...)` value
  (function-based defaults and BigInt/DateTime are skipped) — no separate
  option, both are schema-derived rather than guessed.
- README FAQ: a `PartialType`/`OmitType` recipe for composing Create/Update
  DTOs from the generated class, without any new generated code.
- `scripts/verify-prisma-compat.sh` now generates a `@db.Uuid` field with
  `useValidation` on and asserts `@IsUUID()` (6+) vs. the `@IsString()`
  fallback (5), against a real `prisma generate` run — the native-type
  validator behavior above was previously only covered by unit tests with
  a hand-constructed DMMF field, not an actual end-to-end generate.
- `SECURITY.md` (private vulnerability reporting) and `CODE_OF_CONDUCT.md`.
- Dependabot dependency updates and CodeQL code scanning.
- `.editorconfig` and CI/downloads/PRs-welcome README badges.

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
