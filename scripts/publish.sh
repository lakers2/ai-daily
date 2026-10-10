#!/usr/bin/env bash
# Commit data changes (if any) and push to origin main for GitHub Pages.
set -euo pipefail
cd "$(dirname "$0")/.."

MSG="${1:-chore: update AI daily digest $(date +%Y-%m-%d)}"

# Stage tracked/relevant paths; .gitignore excludes preview.png and __pycache__
git add data/ index.html assets/ scripts/ README.md .nojekyll .gitignore

if git diff --cached --quiet; then
  echo "No staged changes to commit."
else
  git commit -m "$MSG"
fi

git push -u origin main
echo "Pushed to origin main. Pages: https://lakers2.github.io/ai-daily/"
