---
"prisma-class-generator": patch
---

Bump `prettier` from 2.5.1 to 3.9.6 (and `@types/prettier` to match) and migrate the generator's
internal formatting calls to prettier 3's async-only API (`resolveConfig`/`format` no longer have
`.sync` variants). No change to generated output. Also runs `jest` with
`NODE_OPTIONS=--experimental-vm-modules` — prettier 3's CJS entry point uses a dynamic `import()`
internally, which Jest's default VM sandbox rejects without that flag.
