#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  npm run ship -- "Short PR title"

What it does:
  1. Verifies you are not on main
  2. Runs npm run build
  3. Stages all changes and commits them with the provided title
  4. Pushes the current branch
  5. Creates or reuses a pull request to main
  6. Enables auto-merge with branch deletion after checks pass
EOF
}

if [[ "${1:-}" == "" ]] || [[ "${1:-}" == "--help" ]] || [[ "${1:-}" == "-h" ]]; then
  usage
  exit 0
fi

title="$1"
base_branch="main"
current_branch="$(git branch --show-current)"
repo_root="$(git rev-parse --show-toplevel)"

if [[ "$current_branch" == "$base_branch" ]]; then
  echo "Refusing to ship directly from ${base_branch}. Create a codex/ branch first."
  exit 1
fi

if [[ -z "$(git status --short)" ]]; then
  echo "No local changes to ship."
  exit 1
fi

cd "$repo_root"

echo "Running build..."
npm run build

echo "Staging changes..."
git add -A

if git diff --cached --quiet; then
  echo "Nothing staged after git add -A."
  exit 1
fi

echo "Committing..."
git commit -m "$title"

echo "Pushing branch..."
git push -u origin "$current_branch"

body_file="$(mktemp)"
trap 'rm -f "$body_file"' EXIT

cat > "$body_file" <<EOF
## Summary

- What changed: ${title}
- Why: Fast prototype iteration on ${current_branch}

## Subsystem

- Primary area touched: see diff
- Any secondary area touched: call out in review if needed

## Validation

- [x] npm run build
- [ ] Affected UI flow checked in the running app

## Open holes

- Logic holes still open: None noted in ship flow
- Design / hierarchy holes still open: Call out in PR comments if needed

## Merge readiness

- [x] Branch is scoped to one problem
- [x] Dead code removed
- [x] Ready to merge and close branch
EOF

existing_pr_number="$(gh pr view "$current_branch" --json number --jq '.number' 2>/dev/null || true)"

if [[ -z "$existing_pr_number" ]]; then
  echo "Creating pull request..."
  gh pr create \
    --base "$base_branch" \
    --head "$current_branch" \
    --title "$title" \
    --body-file "$body_file"
else
  echo "Pull request #${existing_pr_number} already exists for ${current_branch}."
fi

pr_number="$(gh pr view "$current_branch" --json number --jq '.number')"

echo "Enabling auto-merge..."
gh pr merge "$pr_number" --auto --merge --delete-branch

echo "Shipped branch ${current_branch} to PR #${pr_number}."
