---
"prisma-class-generator": patch
---

Bumps `ts-node` to its latest patch (10.9.2, no functional change -- devDependency only,
doesn't ship to consumers). Cherry-picked out of dependabot PR #90 (a grouped
dev-dependencies bump), which also tried to jump `typescript` 5.9.3 -> 7.0.2 and
`@types/node` 18 -> 26 in the same PR and broke `npm test` on every CI leg (`ts-jest`
doesn't expose TypeScript 7's restructured compiler API yet). Added `ignore` rules to
`.github/dependabot.yml` for major-version bumps on both `typescript` (until ts-jest
supports TS7) and `@types/node` (kept tracking this repo's own `engines.node` floor of
18, not a hypothetical future Node major) so this doesn't recur.
