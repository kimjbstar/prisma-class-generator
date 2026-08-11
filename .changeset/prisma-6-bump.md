---
"prisma-class-generator": patch
---

Bump `@prisma/generator-helper`, `@prisma/internals`, `@prisma/client`, and `prisma` from
5.5.2 to 6.19.3. Deliberately stopping at 6.x rather than 7.x (what dependabot's PR #81
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
