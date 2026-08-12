---
"prisma-class-generator": patch
---

Bump the *runtime* `dependencies` `@prisma/generator-helper` and `@prisma/internals` from
6.19.3 to 7.9.1. `devDependencies` `prisma` and `@prisma/client` stay on 6.19.3 -- those two
specifically refuse to install on Node < 20.19 (their own `preinstall` script hard-fails), while
`@prisma/generator-helper`/`@prisma/internals` don't carry that restriction and were verified by
hand to install and run correctly on Node 18.20.8 (`getDMMF`, `parseEnvValue`, `logger`,
`generatorHandler` all work). Since this project still supports Node 18, only the two packages
that actually need to move did.

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
