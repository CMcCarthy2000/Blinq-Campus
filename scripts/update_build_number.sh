#!/usr/bin/env bash
# Increment build number and update README.md line.
# Usage: ./scripts/update_build_number.sh
# Requires: be in repo root.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

BUILD_FILE="$REPO_ROOT/build_number.txt"
README_FILE="$REPO_ROOT/README.md"

# initialize file if missing
if [ ! -f "$BUILD_FILE" ]; then
  echo "pre-demo 1" > "$BUILD_FILE"
fi

CURRENT=$(cat "$BUILD_FILE" | tr -d '\r')
# expected format: pre-demo N
if [[ ! $CURRENT =~ ^pre-demo[[:space:]]+([0-9]+)$ ]]; then
  echo "Unexpected value in $BUILD_FILE: '$CURRENT'" >&2
  exit 1
fi

NUM=${BASH_REMATCH[1]}
NEXT=$((NUM + 1))
NEXT_VALUE="pre-demo $NEXT"

echo "$NEXT_VALUE" > "$BUILD_FILE"

# update README line that starts with '#### Pre demo'
# after this we include the build line on the same heading

if grep -q '^#### Pre demo' "$README_FILE"; then
  # replace heading line with version heading
  sed -i "s/^#### Pre demo.*/#### Pre demo (build: $NEXT_VALUE)/" "$README_FILE"
else
  # add line directly under title
  sed -i "1a\
#### Pre demo (build: $NEXT_VALUE)\
" "$README_FILE"
fi

echo "Updated build number to: $NEXT_VALUE"
