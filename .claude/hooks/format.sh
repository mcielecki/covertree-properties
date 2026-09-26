#!/usr/bin/env bash
# PostToolUse: format the edited file with Prettier (deterministic, no AI).
f=$(jq -r '.tool_input.file_path // empty')
[ -z "$f" ] && exit 0
case "$f" in *.ts|*.tsx|*.js|*.json|*.md|*.graphql|*.css) ;; *) exit 0 ;; esac
cd "$CLAUDE_PROJECT_DIR" || exit 0
[ -x node_modules/.bin/prettier ] && node_modules/.bin/prettier --write --log-level silent "$f"
exit 0