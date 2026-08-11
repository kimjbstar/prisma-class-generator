# Contributing

Bug fixes and small, focused PRs are very welcome — including ones written by a coding agent
(Claude Code, etc.) rather than typed by hand. If a generator run failed with an unexpected
error, the CLI output itself links back here.

For architecture, gotchas, and how the codebase fits together, read **[CLAUDE.md](./CLAUDE.md)**
first — this file is just the PR mechanics.

## Getting set up

```
git clone https://github.com/kimjbstar/prisma-class-generator.git
cd prisma-class-generator
yarn install
npm run build
npm test
```

If both of those succeed, you're ready to make a change.

## Making a change

1. **Reproduce first.** If you're fixing a bug, write a failing test for it before touching the
   fix — see `src/convertor.spec.ts` / `src/components/*.spec.ts` for the pattern (construct a
   `PrismaConvertor`/`FileComponent` directly, feed it DMMF from `getDMMF({ datamodel: '...' })`,
   no live database needed).
2. **Fix it.**
3. Run `npm test`. If your change intentionally alters generated output, `src/fixtures.spec.ts`
   will fail with a snapshot diff — run `npx jest -u` and **read the diff** before committing the
   updated snapshot. A snapshot diff you didn't expect is exactly the bug this test caught.
4. Run `npm run build` — this does a clean build (`rm -rf dist && tsc`), which also catches
   anything `tsc --noEmit` alone might not.
5. If you touched `README.md`'s example output, regenerate it from the actual generator rather
   than hand-editing — stale examples are a real problem this repo has had before.

## Opening the PR

- One logical change per PR. If you're fixing two unrelated things, that's two PRs.
- Describe *why*, not just *what* — the diff already shows what changed.
- Mention which issue it fixes, if any (`Fixes #123`).
- Confirm in the PR description that `npm test` and `npm run build` both pass locally — CI will
  verify this too (including against Prisma 5/6/7 and both the `prisma-client-js`/`prisma-client`
  providers), but saying so up front saves a round trip.

## What tends to get merged quickly

- A regression test alongside the fix.
- A change scoped to the actual bug, not a drive-by refactor of nearby code.
- For anything touching `FileComponent`/import resolution: a note on which combination you
  tested (relations, self-relations, `separateRelationFields`, MongoDB composite types) — that
  area has had the most subtle bugs historically.

## What tends to need more discussion first

- New generator options — open an issue first to agree on the name/shape before writing the
  PR. `src/generator.ts`'s `PrismaClassGeneratorOptions` is the config surface, and it's
  easier to agree on a name once than to rename it after someone's already depending on it.
- Anything that changes default behavior for existing options (a real bug fix is fine even if
  it changes output; an intentional behavior change to something that already worked is not).
