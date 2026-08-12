---
"prisma-class-generator": patch
---

Fixes three Windows-specific bugs found while adding a `windows-latest` leg to CI:

- `getRelativeTSPath` (used to build every relation/index-barrel import path) fed
  `path.relative()`'s output straight into a generated `import ... from '...'` string.
  On Windows, `path.relative()` returns `\`-separated paths, which produced an invalid
  module specifier like `import ... from '..\foo'`. Now normalized to forward slashes
  unconditionally (a POSIX import specifier is required regardless of host OS).
- The `test` npm script used bash's `VAR=value command` syntax
  (`NODE_OPTIONS=--experimental-vm-modules jest`), which fails outright under Windows'
  default `cmd.exe` shell. Switched to `cross-env`.
- The `clean` script used `rm -rf dist`, also bash-only. Switched to `rimraf`.

Both `cross-env` and `rimraf` are pinned to majors that still support Node 18
(`cross-env@^7.0.3`, `rimraf@^5.0.10`) -- their latest majors require Node 20+, which would
have undone the Node 18 support this project maintains.
