---
"prisma-class-generator": minor
---

Add `validateNestedRelations` (opt-in `@ValidateNested()`/`@Type(() => X)` on relation and
composite-type fields when `useValidation` is on), sharpen `useValidation`'s output using a
field's `@db.*` native type on Prisma 6+ (`@IsUUID()`, `@IsMongoId()`, `@MaxLength(n)`,
`@Min(0)`), add `useSerialization` + the `/// @exclude` directive for class-transformer's
`@Exclude()`, and derive `@ApiProperty`'s `description`/`example` from a field's doc comment
and literal `@default(...)` value. Also documents a `PartialType`/`OmitType` recipe in the
README FAQ for composing Create/Update DTOs from the generated class.
