---
'prisma-class-generator': patch
---

Cut what this package costs to install. `@prisma/internals` moves to devDependencies: the specs
still use its `getDMMF`, but it installs 28MB, `prisma` itself doesn't depend on it (so it never
dedupes with a project's existing install), and the generator only needed two things from it —
`parseEnvValue` and `logger.info` — both now transcribed into `util.ts` with their behaviour and
output unchanged. Sourcemaps are also no longer published: `files` ships only `dist`, so their
`sources: ["../src/*.ts"]` pointed at files that were never in the tarball.

Runtime dependencies are now `@prisma/generator-helper` and `prettier`. The published tarball is
29% smaller (130.8kB → 93.0kB unpacked), and `@prisma/internals`' 28MB is gone from every install.
`package.json` also declares `"type": "commonjs"` explicitly so Node doesn't have to detect it.
