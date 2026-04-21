#!/bin/bash
# SnapR agent runner.
#
# Usage:
#   ./agents/run.sh pr-review 42
#   ./agents/run.sh bug-fix "TypeError in image processing"
#   ./agents/run.sh nightly-report

set -euo pipefail

PYTHON="${PYTHON:-python3}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$(dirname "$SCRIPT_DIR")"

if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
  echo "⚠  ANTHROPIC_API_KEY not set. Add it to ~/.zshenv or export it in this shell." >&2
  exit 1
fi

case "${1:-}" in
  pr-review)
    shift
    "$PYTHON" agents/pr_reviewer.py "$@"
    ;;
  bug-fix)
    shift
    "$PYTHON" agents/bug_fixer.py "$@"
    ;;
  nightly-report)
    "$PYTHON" agents/nightly_report.py
    ;;
  ""|help|--help|-h)
    cat <<EOF
Usage: ./agents/run.sh <command> [args...]

Commands:
  pr-review <pr-number>           Review a PR and post findings as a comment
  bug-fix "<error description>"   Find root cause, write fix + test, open PR
  nightly-report                  Write reports/daily-YYYY-MM-DD.md + Slack ping

Env:
  ANTHROPIC_API_KEY   required
  PYTHON              override python interpreter (default: python3)
EOF
    ;;
  *)
    echo "Unknown command: $1" >&2
    echo "Run './agents/run.sh help' for usage." >&2
    exit 1
    ;;
esac
