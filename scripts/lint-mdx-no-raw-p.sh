#!/bin/bash
# Lint MDX files for raw <p> tags that cause hydration errors.
# In MDX, raw <p> tags wrapping text will produce <p><p>…</p></p>
# because MDX also wraps paragraph text in <p>. Use a custom component
# (like <Lead>) instead.

EXIT_CODE=0

while IFS= read -r -d '' file; do
  # Match lines starting with <p (with optional attributes)
  matches=$(grep -n '^ *<p[ >]' "$file" || true)
  if [ -n "$matches" ]; then
    echo "ERROR: Raw <p> tag in MDX file (use a component like <Lead> instead):"
    while IFS= read -r line; do
      echo "  $file:$line"
    done <<< "$matches"
    EXIT_CODE=1
  fi
done < <(find src -name '*.mdx' -print0)

if [ $EXIT_CODE -eq 0 ]; then
  echo "No raw <p> tags found in MDX files."
fi

exit $EXIT_CODE
