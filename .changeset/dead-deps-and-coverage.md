---
"prisma-class-generator": patch
---

No functional change -- dev-tooling only.

- Removes `swagger-ui-express` and `ts-toolbelt` from `devDependencies`: neither is imported
  anywhere in `src/`, and `swagger-ui-express` was pulling in a stale peer-dependency warning
  on every install (`unmet peer dependency "express"`).
- Adds a `test:coverage` script (`jest --coverage`) and scopes `collectCoverageFrom` in
  `jest.config.js` to `src/**/*.ts` (excluding specs, `_gen`, and `bin.ts`). CI now prints a
  coverage summary to the job summary on the node-22 leg (once per run, not once per matrix
  leg -- coverage doesn't vary by Node version).
