---
"prisma-class-generator": patch
---

Add a `typecheck` script (`tsc --noEmit`) and run it as a fast-failing first step in CI,
before the full build/test cycle. No behavior change to the generator itself.
