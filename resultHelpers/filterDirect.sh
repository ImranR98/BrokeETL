#!/bin/bash

set -e

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"

OUTPUT_DIR="$1"
shift

TEMP_FILE="$(mktemp)"
trap "rm '$TEMP_FILE'" EXIT

if [ -n "$OUTPUT_DIR" ]; then
    node "$HERE"/../app.js -o "$OUTPUT_DIR" "$@" >"$TEMP_FILE"
else
    node "$HERE"/../app.js "$@" >"$TEMP_FILE"
fi

node "$HERE"/filter.js "$TEMP_FILE"
