---
"prisma-class-generator": patch
---

Bump the *runtime* `dependencies` `@prisma/generator-helper` and `@prisma/internals` from
6.19.3 to 7.9.1. `devDependencies` `prisma` and `@prisma/client` stay on 6.19.3 -- those two
specifically refuse to install on Node < 20.19 (their own `preinstall` script hard-fails).

The first attempt at this bump broke `yarn install` on Node 18 in CI: `@prisma/internals@7.9.1`
pulls in `chokidar@5.0.0` transitively (via `@prisma/config` -> `c12`), and chokidar 5 requires
Node >= 20.19. Traced it: `c12` only reaches for chokidar via a lazy `await import("chokidar")`
inside its config-*watch* feature, which this generator's code (`getDMMF`/`parseEnvValue`/
`logger` only) never triggers -- so the actual chokidar module is never loaded at runtime here.
Added a `resolutions` override pinning `chokidar` to `^4.0.3` (the same major that
`prisma@6.19.3`'s own `c12` dependency already resolves to, so it's a well-exercised version)
to sidestep the install-time engine check without touching any code path this package uses.
Verified with a clean `yarn install --frozen-lockfile` + full `typecheck`/`build`/`test` run on
real Node 18.20.8 (via nvm, with engine-strict actually enforced -- not just locally-lenient
npm/yarn config).

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
