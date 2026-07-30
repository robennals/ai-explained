#!/usr/bin/env bash
# Execute every notebook and fail if any raises.
#
# Notebooks need python packages the site itself doesn't (torch, transformers).
# If a local virtualenv exists at .venv, use it; otherwise fall back to whatever
# jupyter is on PATH. To create one:
#
#   python3.13 -m venv .venv
#   .venv/bin/pip install torch transformers huggingface_hub accelerate \
#       jupyter nbconvert matplotlib numpy tiktoken scikit-learn datasets
#
set -uo pipefail

if [ -x ".venv/bin/jupyter" ]; then
  JUPYTER=".venv/bin/jupyter"
else
  JUPYTER="jupyter"
  echo "note: no .venv found, using system jupyter (see this script's header)"
fi

OUT="${TMPDIR:-/tmp}/notebook-test-output"
mkdir -p "$OUT"
failed=0

for nb in notebooks/*.ipynb; do
  name=$(basename "$nb")
  if "$JUPYTER" nbconvert --to notebook --execute \
       --ExecutePreprocessor.timeout=900 "$nb" --output-dir "$OUT" \
       > "$OUT/$name.log" 2>&1; then
    echo "PASS  $name"
  else
    echo "FAIL  $name"
    grep -oE '^[A-Za-z]+Error.*' "$OUT/$name.log" | tail -2 | sed 's/^/        /'
    failed=1
  fi
done

exit $failed
