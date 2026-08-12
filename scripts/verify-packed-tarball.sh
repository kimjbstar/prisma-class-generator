#!/usr/bin/env bash
# Smoke-tests the *packed tarball* -- what `npm publish` would actually upload -- rather than
# the repo working tree. verify-prisma-compat.sh runs `dist/index.js` by path straight out of
# the repo, which means it can't see any of these failure modes:
#
#   - a `files` field that omits something dist needs, so the published package is incomplete
#   - a `bin` entry pointing at a path that isn't in the tarball, so `provider =
#     "prisma-class-generator"` can't resolve at all
#   - a runtime import of a package that only exists in devDependencies, which resolves fine
#     in this repo (everything is installed) and explodes in a user's project
#
# That last one is not hypothetical: this package's runtime dependencies were trimmed to
# @prisma/generator-helper + prettier, and the repo's own node_modules would happily hide a
# mistake there forever. This test installs the tarball into a throwaway project with nothing
# else in it and drives it through a real `prisma generate` by provider *name*, so all three
# are covered.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ ! -f "$ROOT_DIR/dist/index.js" ]; then
	echo "FAIL: dist/index.js not found — run 'npm run build' first"
	exit 1
fi

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

echo "--- npm pack ---"
TARBALL_NAME="$(cd "$ROOT_DIR" && npm pack --silent --pack-destination "$WORK_DIR")"
TARBALL="$WORK_DIR/$TARBALL_NAME"
echo "packed: $TARBALL_NAME ($(wc -c <"$TARBALL") bytes)"

PROJECT_DIR="$WORK_DIR/consumer"
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

# A bare project: nothing here but the tarball and the Prisma CLI, so anything the generator
# needs at runtime has to come from its own declared dependencies.
npm init -y >/dev/null
echo "--- npm install <tarball> ---"
npm install --no-audit --no-fund "$TARBALL" prisma@7 >/dev/null

# The generator is referenced by *name*, exactly as a user would write it -- this is what
# exercises the `bin` field and the tarball's file list, rather than a path into the repo.
cat >schema.prisma <<'EOF'
datasource db {
  provider = "postgresql"
}

generator client {
  provider = "prisma-client"
  output   = "./generated/client"
}

generator prismaClassGenerator {
  provider      = "prisma-class-generator"
  output        = "./generated/prisma-class"
  dryRun        = "false"
  useValidation = "true"
}

model Foo {
  id    Int     @id
  count Int     @default(1)
  uuid  String  @db.Uuid
}
EOF

echo "--- prisma generate (provider resolved by name from node_modules) ---"
npx prisma generate --schema schema.prisma

OUTPUT_FILE="generated/prisma-class/foo.ts"
if [ ! -f "$OUTPUT_FILE" ]; then
	echo "FAIL: $OUTPUT_FILE was not generated from the packed tarball"
	exit 1
fi

echo "--- generated output ---"
cat "$OUTPUT_FILE"

for expected in 'count: number = 1' '@IsUUID()'; do
	if ! grep -qF "$expected" "$OUTPUT_FILE"; then
		echo "FAIL: expected to find '$expected' in output generated from the tarball"
		exit 1
	fi
done

# The generator prints its progress through util.ts's log(); a missing runtime dependency
# would have crashed above, but assert the entry point is where package.json says it is too.
INSTALLED_MAIN="node_modules/prisma-class-generator/dist/index.js"
if [ ! -f "$INSTALLED_MAIN" ]; then
	echo "FAIL: package.json main ($INSTALLED_MAIN) is missing from the installed package"
	exit 1
fi

echo "OK: the packed tarball installs and generates correctly in a clean project"
