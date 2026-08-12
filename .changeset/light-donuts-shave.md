---
'prisma-class-generator': minor
---

Add `makeDtoFiles`, which generates `Create<Model>` and `Update<Model>` classes alongside each
model class. They're compositions rather than copies — `CreateUser extends OmitType(User, [...] as
const)` and `UpdateUser extends PartialType(CreateUser)` — so a field's type, Swagger metadata and
validators stay declared in exactly one place, and NestJS's mapped types carry all three through.
Imported from `@nestjs/swagger` when `useSwagger` is on, `@nestjs/mapped-types` otherwise.

A field leaves the `Create` DTO only when the schema itself says a client can't supply it: a
function-based `@default(...)` (`autoincrement()`, `uuid()`, `now()`, `dbgenerated(...)`, …),
`@updatedAt`, or a relation field. Literal defaults like `@default(0)`, relation foreign-key
scalars, and an `@id` without a default all stay — nothing is inferred from field names. Off by
default, so existing output is unchanged.
