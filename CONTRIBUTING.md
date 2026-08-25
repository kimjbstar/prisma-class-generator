# Contributing

Bug fixes and small, focused PRs are very welcome — including ones written by a coding agent
(Claude Code, etc.) rather than typed by hand. If a generator run failed with an unexpected
error, the CLI output itself links back here.

For architecture, gotchas, and how the codebase fits together, read **[CLAUDE.md](./CLAUDE.md)**
first — this file is just the PR mechanics.

By participating in this project, you're expected to uphold the
[Code of Conduct](./CODE_OF_CONDUCT.md). Found a security issue instead of a bug? See
[SECURITY.md](./SECURITY.md) rather than opening a public issue.

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
   anything `tsc --noEmit` alone might not. While iterating, `npm run typecheck` (`tsc --noEmit`)
   is faster for just checking types without producing `dist/`.
5. If you touched `README.md`'s example output, regenerate it from the actual generator rather
   than hand-editing — stale examples are a real problem this repo has had before.

## Opening the PR

- One logical change per PR. If you're fixing two unrelated things, that's two PRs.
- Describe *why*, not just *what* — the diff already shows what changed.
- Mention which issue it fixes, if any (`Fixes #123`).
- Confirm in the PR description that `npm test` and `npm run build` both pass locally — CI will
  verify this too (including against Prisma 5/6/7 and both the `prisma-client-js`/`prisma-client`
  providers), but saying so up front saves a round trip.
- If the change should ship in the next release (almost everything except docs-only /
  CI-only changes), run `npx changeset` and answer its prompts — it writes a small markdown
  file to `.changeset/` describing the semver bump (patch/minor/major) and a one-line summary.
  Commit that file with your PR. If you're not sure which bump type, `patch` for bug fixes and
  `minor` for new/changed options is the right default (see [Releasing](#releasing) below for
  what happens to it after merge).

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

## Releasing

Releases are automated with [Changesets](https://github.com/changesets/changesets) — you don't
need to be a maintainer to trigger this, just to add a changeset to your PR (see above).

1. Every push to `main` with pending changeset files updates a standing **"Version Packages"**
   pull request — it bumps `package.json`'s version and updates `CHANGELOG.md` based on
   whatever changesets have landed since the last release, and keeps itself up to date as more
   PRs merge.
2. When a maintainer merges that "Version Packages" PR, the same CI job detects there are no
   pending changesets left and instead runs the actual release: `npm publish`, a GitHub
   Release, and a git tag.

   Publishing authenticates with [npm trusted publishing](https://docs.npmjs.com/trusted-publishers)
   over OIDC — there is no npm token in this repository's secrets. npm issues a short-lived
   credential to the release workflow based on the repository and workflow filename registered
   as this package's trusted publisher, and provenance attestations are generated
   automatically. If the workflow file is ever renamed, that registration has to be updated
   to match.
3. There's no manual `npm version` step anymore — the version number is entirely derived from
   the changeset files' bump types (`patch`/`minor`/`major`) accumulated since the last release.

If you're fixing something that shouldn't trigger a release at all (a typo in a comment, CI-only
changes), you can skip the changeset — `changeset status` treats "no changesets" as fine for
non-code changes, it only insists on one when it detects `src/`/`package.json` changed.
