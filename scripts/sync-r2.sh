#!/usr/bin/env bash
#
# Upload model and data files to R2, skipping files whose size already
# matches. Uses wrangler r2 object commands.
#
# Usage:
#   pnpm sync-r2          # dry-run (shows what would upload)
#   pnpm sync-r2:apply    # actually upload
#
# Prerequisites:
#   npx wrangler login
#
set -euo pipefail

BUCKET="learnai"
DATA_DIR="public/data"
R2_PREFIX="data"

APPLY=false
if [[ "${1:-}" == "--apply" ]]; then
  APPLY=true
fi

cd "$(dirname "$0")/.."

# Files to sync (relative to DATA_DIR)
FILES=(
  "next-word-model/next-word-ctx2.json"
  "next-word-model/next-word-ctx2.weights.bin"
  "next-word-model/next-word-ctx3.json"
  "next-word-model/next-word-ctx3.weights.bin"
  "next-word-model/next-word-best.json"
  "next-word-model/next-word-best.weights.bin"
)

# Check if an R2 object exists and return its size, or "" if missing.
# wrangler 4.x has no "head" command, so we download to /dev/null and
# parse the output for the size, or detect the "not found" error.
r2_object_size() {
  local key="$1"
  local tmpfile
  tmpfile=$(mktemp)
  # Try to get the object — download to a temp file we immediately discard
  local output
  if output=$(npx wrangler r2 object get "$BUCKET/$key" --file "$tmpfile" --remote 2>&1); then
    # Success — get actual downloaded size
    local size
    size=$(stat -f%z "$tmpfile" 2>/dev/null || stat -c%s "$tmpfile")
    rm -f "$tmpfile"
    echo "$size"
  else
    rm -f "$tmpfile"
    echo ""
  fi
}

uploaded=0
skipped=0
to_upload=0

for file in "${FILES[@]}"; do
  local_path="$DATA_DIR/$file"
  r2_key="$R2_PREFIX/$file"

  if [[ ! -f "$local_path" ]]; then
    echo "SKIP (missing locally): $file"
    continue
  fi

  local_size=$(stat -f%z "$local_path" 2>/dev/null || stat -c%s "$local_path")
  r2_size=$(r2_object_size "$r2_key")

  if [[ -n "$r2_size" && "$r2_size" == "$local_size" ]]; then
    echo "SKIP (up to date, ${local_size} bytes): $file"
    skipped=$((skipped + 1))
    continue
  elif [[ -n "$r2_size" ]]; then
    echo "UPDATE (size changed: R2=${r2_size} local=${local_size}): $file"
  else
    echo "NEW (${local_size} bytes): $file"
  fi

  to_upload=$((to_upload + 1))

  if $APPLY; then
    content_type="application/octet-stream"
    if [[ "$file" == *.json ]]; then
      content_type="application/json"
    fi

    echo "  Uploading $file ..."
    npx wrangler r2 object put "$BUCKET/$r2_key" \
      --file "$local_path" \
      --content-type "$content_type" \
      --remote
    uploaded=$((uploaded + 1))
  fi
done

echo ""
if $APPLY; then
  echo "Done: $uploaded uploaded, $skipped already up to date."
else
  echo "Dry run: $to_upload to upload, $skipped already up to date."
  if [[ $to_upload -gt 0 ]]; then
    echo "Run 'pnpm sync-r2:apply' to upload."
  fi
fi
