#!/usr/bin/env bash
# Execute every notebook and fail if any raises.
#
# Four notebooks are skipped by default: post-training, conversations, reasoning
# and agents each
# download a multi-gigabyte language model and generate from it, which takes
# many minutes and several GB of disk. Run them deliberately, not casually:
#
#   pnpm test:notebooks -- --heavy     # everything, including those three
#   pnpm test:notebooks -- --only agents  # just one of them
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

# Notebooks that download and run a language model.
HEAVY="post-training.ipynb conversations.ipynb reasoning.ipynb agents.ipynb"
RUN_HEAVY=0
ONLY=""
while [ $# -gt 0 ]; do
  case "$1" in
    --heavy) RUN_HEAVY=1 ;;
    --only) shift; ONLY="${1:-}" ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
  shift
done

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

  if [ -n "$ONLY" ] && [ "$name" != "$ONLY.ipynb" ] && [ "$name" != "$ONLY" ]; then
    continue
  fi
  if [ -z "$ONLY" ] && [ "$RUN_HEAVY" -eq 0 ] && [[ " $HEAVY " == *" $name "* ]]; then
    echo "SKIP  $name (downloads a language model; pass --heavy to include)"
    continue
  fi

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
