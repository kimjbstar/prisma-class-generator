---
'prisma-class-generator': patch
---

Drop the `change-case` runtime dependency. It was used for exactly one function (`snakeCase`, on
Prisma model/type names), and pulled in 16 packages transitively; its 5.x line is ESM-only, which
this CommonJS build can't consume on Node 18. That one function now lives in `util.ts` as
`toSnakeCase`, transcribed from change-case@4 and verified against it over 150k property-generated
inputs — Prisma identifiers, messy ASCII and arbitrary unicode — with zero differences, so no
generated filename or import path changes. Runtime dependencies are down to three:
`@prisma/generator-helper`, `@prisma/internals` and `prettier`.
