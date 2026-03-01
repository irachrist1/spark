#!/usr/bin/env bash
set -euo pipefail

if ! command -v op >/dev/null 2>&1; then
  echo "1Password CLI (op) is not installed."
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

VAULT="${OP_VAULT:-Private}"
ITEM_TITLE="${OP_ITEM_TITLE:-spark env backup}"

env_files=()
for file in .env.local .env; do
  if [[ -f "$file" ]]; then
    env_files+=("$file")
  fi
done

if [[ ${#env_files[@]} -eq 0 ]]; then
  echo "No .env files found to back up."
  exit 1
fi

tmp_file="$(mktemp)"
timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

{
  echo "# Spark env backup"
  echo "# Generated (UTC): $timestamp"
  echo
  for file in "${env_files[@]}"; do
    echo "## $file"
    cat "$file"
    echo
  done
} > "$tmp_file"

notes_content="$(cat "$tmp_file")"

if op item get "$ITEM_TITLE" --vault "$VAULT" >/dev/null 2>&1; then
  op item edit "$ITEM_TITLE" --vault "$VAULT" "notesPlain=$notes_content" >/dev/null
  echo "Updated 1Password item '$ITEM_TITLE' in vault '$VAULT'."
else
  op item create --category "Secure Note" --title "$ITEM_TITLE" --vault "$VAULT" "notesPlain=$notes_content" >/dev/null
  echo "Created 1Password item '$ITEM_TITLE' in vault '$VAULT'."
fi

rm -f "$tmp_file"
