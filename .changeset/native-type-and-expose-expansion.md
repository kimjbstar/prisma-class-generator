---
"prisma-class-generator": minor
---

Pushes the already-supported class-validator/class-transformer integrations further, verified
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
