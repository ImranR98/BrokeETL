#!/bin/bash

set -e

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"

BANK_MODULE_TYPE="$1"
shift

TEMP_FILE="$(mktemp)"
trap "rm '$TEMP_FILE'" EXIT

node "$HERE"/../app.js "$BANK_MODULE_TYPE" "$@" > "$TEMP_FILE"

node "$HERE"/filter.js "$TEMP_FILE"