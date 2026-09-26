#!/usr/bin/env bash
# Stop hook: Claude cannot finish while typecheck or lint fail.
input=$(cat)
# avoid infinite loops: if we already blocked once, let it stop
[ "$(echo "$input" | jq -r '.stop_hook_active')" = "true" ] && exit 0
cd "$CLAUDE_PROJECT_DIR" || exit 0
# inactive until the monorepo scaffold defines the scripts
jq -e '.scripts.typecheck and .scripts.lint' package.json >/dev/null 2>&1 || exit 0
if ! out=$(pnpm --reporter=silent typecheck 2>&1 && pnpm --reporter=silent lint 2>&1); then
  echo "Typecheck/lint failed. Fix these before finishing:" >&2
  echo "$out" | tail -n 60 >&2
  exit 2
fi
exit 0