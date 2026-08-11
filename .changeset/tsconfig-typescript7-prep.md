---
"prisma-class-generator": patch
---

Modernize tsconfig.json ahead of TypeScript 6/7: replace the removed `baseUrl` /
`moduleResolution: "node"` / `suppressExcessPropertyErrors` / `suppressImplicitAnyIndexErrors` /
`downlevelIteration` options with `module`/`moduleResolution: "node16"` (the two must now match)
and an explicit `rootDir`. Explicitly pin `strict: false` since TypeScript 6+ defaults it to
`true` and this codebase isn't strict-clean yet. No change to generated output.

Note: actually bumping the `typescript` dependency to 7.x is still blocked — TypeScript 7 drops
the JS compiler API that `ts-jest`/`ts-node` need, and neither has shipped compatibility yet
(see kulshekhar/ts-jest#5366). `typescript` stays on the 5.x line for now.
