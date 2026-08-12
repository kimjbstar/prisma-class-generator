---
"prisma-class-generator": patch
---

Adds ESLint (flat config, `typescript-eslint` + `eslint-config-prettier` so it never fights
Prettier on style) and a `lint` script, wired into CI right after `typecheck`. Kept to
`typescript-eslint`'s `recommended` rule set rather than a stricter/type-checked one --
`tsconfig.json` already documents `strict: false` as a deliberate, separately-scoped decision
(~60 pre-existing errors), and piling a stricter lint config on top of that today would just
be the same undertaking wearing a different hat. `@typescript-eslint/no-explicit-any` is a
warning, not an error: this codebase's `DecoratorComponent`/`ImportComponent` params are
genuinely heterogeneous template-fill values (see CLAUDE.md's string-template-pipeline
description) -- forcing a type there wouldn't add real safety.

Fixed everything the first `eslint src` run actually flagged as an error (not a drive-by
sweep, just what the tool surfaced):
- 3 `let` that were never reassigned (`prefer-const`)
- An unused `pascalCase` import and an unused `options` local
- Two real `any`-typed values found to always be `string` in practice, now typed as such
  (`ImportComponent#add`)
- One real bug the loose typing was hiding: `GeneratorFormatNotValidError`'s constructor took
  `config: any` but called `super()` with no arguments, so `.message` was always empty --
  and the two real call sites (`parseBoolean`/`parseNumber` in util.ts) pass a formatted
  string, not the `Dictionary<string>` the class's own field type claimed. Now takes
  `message: string` and calls `super(message)`; `handleGenerateError` logs `e.message`
  instead of `JSON.stringify(e.config)`, which used to just re-quote the same string.

`eslint`/`typescript-eslint`/`@eslint/js` are pinned carefully for Node 18 (this repo's own
floor): `eslint@^9.39.5` (not the latest 10.x, which requires Node >=20.19) and
`typescript-eslint@8.55.0` exactly, no caret -- 8.56.0+ bumps a transitive
`eslint-visitor-keys` dependency to `^5.0.0`, which also requires Node >=20.19. Verified with
a clean `yarn install --frozen-lockfile` + typecheck/lint/build/test on real Node 18.20.8.
