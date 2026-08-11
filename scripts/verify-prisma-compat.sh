#!/usr/bin/env bash
# Smoke-tests the *built* dist/index.js generator against a real `prisma generate` run,
# driven by a specific Prisma CLI version and a specific Prisma Client generator provider
# name (prisma-client-js vs prisma-client). This is the exact manual check that caught the
# Prisma 7 `prisma-client` provider-name regression during development — see CLAUDE.md.
#
# Usage: scripts/verify-prisma-compat.sh <prisma-version> <prisma-client-js|prisma-client>
set -euo pipefail

PRISMA_VERSION="${1:?usage: verify-prisma-compat.sh <prisma-version> <prisma-client-js|prisma-client>}"
CLIENT_PROVIDER="${2:?usage: verify-prisma-compat.sh <prisma-version> <prisma-client-js|prisma-client>}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_ENTRY="$ROOT_DIR/dist/index.js"

if [ ! -f "$DIST_ENTRY" ]; then
	echo "FAIL: $DIST_ENTRY not found — run 'npm run build' first"
	exit 1
fi

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT
cd "$WORK_DIR"

if [ "$CLIENT_PROVIDER" = "prisma-client" ]; then
	CLIENT_BLOCK='generator client {
  provider = "prisma-client"
  output   = "./generated/client"
}'
else
	CLIENT_BLOCK='generator client {
  provider = "prisma-client-js"
}'
fi

# Prisma 7 dropped `url` from the datasource block entirely (regardless of which client
# generator is used) in favor of prisma.config.ts -- this is unrelated to the
# prisma-client-js/prisma-client split above, so it's keyed off the Prisma major version.
PRISMA_MAJOR="${PRISMA_VERSION%%.*}"
if [ "$PRISMA_MAJOR" -ge 7 ] 2>/dev/null; then
	DATASOURCE_BLOCK='datasource db {
  provider = "postgresql"
}'
else
	DATASOURCE_BLOCK='datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}'
fi

cat >schema.prisma <<EOF
$DATASOURCE_BLOCK

$CLIENT_BLOCK

generator prismaClassGenerator {
  provider = "node $DIST_ENTRY"
  output   = "./generated/prisma-class"
  dryRun   = "false"
}

model Foo {
  id    Int  @id
  count Int  @default(1)
  zero  Int  @default(0)
  flag  Boolean @default(false)
}
EOF

# `prisma-client-js` needs @prisma/client physically present -- older Prisma auto-installed
# it on first `generate`, but that convenience isn't reliable across versions, so install it
# explicitly rather than depend on that behavior.
if [ "$CLIENT_PROVIDER" = "prisma-client-js" ]; then
	npm init -y >/dev/null
	npm install --no-save "@prisma/client@$PRISMA_VERSION" >/dev/null
fi

echo "--- prisma@$PRISMA_VERSION generate ($CLIENT_PROVIDER) ---"
DATABASE_URL="postgresql://user:pass@localhost:5432/db" npx --yes "prisma@$PRISMA_VERSION" generate --schema schema.prisma

OUTPUT_FILE="generated/prisma-class/foo.ts"
if [ ! -f "$OUTPUT_FILE" ]; then
	echo "FAIL: $OUTPUT_FILE was not generated"
	exit 1
fi

echo "--- generated output ---"
cat "$OUTPUT_FILE"

# regression guard for #34/#56/#76: a numeric default must never render as a Date
if grep -q "new Date(" "$OUTPUT_FILE"; then
	echo "FAIL: numeric default was wrongly generated as a Date"
	exit 1
fi

for expected in 'count: number = 1' 'zero: number = 0' 'flag: boolean = false'; do
	if ! grep -qF "$expected" "$OUTPUT_FILE"; then
		echo "FAIL: expected to find '$expected' in generated output"
		exit 1
	fi
done

echo "OK: prisma@$PRISMA_VERSION + $CLIENT_PROVIDER generated correctly"
