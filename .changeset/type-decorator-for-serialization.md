---
"prisma-class-generator": minor
---

`useSerialization` now generates class-transformer's `@Type(() => X)` on relation and
composite-type fields, independently of `useValidation`. Previously `@Type()` was only
generated as a side effect of `validateNestedRelations` (which itself requires
`useValidation`) — so a project using `useSerialization` alone for
`ClassSerializerInterceptor`-based response serialization never got it, and a nested relation
in a response stayed a plain object instead of an instance of the related class, silently
skipping that class's own `@Exclude()`/`@Expose()` decorators.

`@Type()` generation is now a single shared code path: it fires when `useSerialization` is on,
or when `useValidation` + `validateNestedRelations` are both on, and doesn't duplicate the
decorator when more than one of those is true at once.
