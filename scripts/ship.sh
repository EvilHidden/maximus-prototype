#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  npm run ship -- --check
  npm run ship -- "Short PR title"

What it does:
  1. Verifies you are on a codex/ branch and not on main
  2. Fetches origin/main and checks whether your topic branch is behind it
  3. In --check mode, reports ship readiness and exits
  4. Stages and commits local changes with the provided title if needed
  5. Merges origin/main into your topic branch if needed
  6. Runs npm run check for a fast local gate
  7. Pushes the current branch
  8. Creates or reuses a pull request to main
  9. Enables auto-merge with branch deletion after the full GitHub build passes
  10. Waits for the merge, then switches back to main and deletes the local topic branch

Important:
  - Never reuse a codex/ branch after its PR has been merged or closed.
  - If a branch has already shipped once, start a fresh topic branch before continuing.
EOF
}

check_only=false

if [[ "${1:-}" == "--check" ]]; then
  check_only=true
  shift
fi

if [[ "${1:-}" == "--help" ]] || [[ "${1:-}" == "-h" ]]; then
  usage
  exit 0
fi

if [[ "$check_only" == false && "${1:-}" == "" ]]; then
  usage
  exit 1
fi

title="${1:-}"
base_branch="main"
current_branch="$(git branch --show-current)"
repo_root="$(git rev-parse --show-toplevel)"

print_update_help() {
  cat <<EOF
Update first with:
  git checkout ${base_branch}
  git pull --ff-only origin ${base_branch}
  git checkout ${current_branch}
  git merge ${base_branch}
EOF
}

if git rev-parse -q --verify MERGE_HEAD >/dev/null 2>&1; then
  echo "Refusing to ship while a merge is in progress."
  exit 1
fi

if [[ -d "$(git rev-parse --git-path rebase-merge)" || -d "$(git rev-parse --git-path rebase-apply)" ]]; then
  echo "Refusing to ship while a rebase is in progress."
  exit 1
fi

if [[ "$current_branch" == "$base_branch" ]]; then
  echo "Refusing to ship directly from ${base_branch}. Create a codex/ branch first."
  exit 1
fi

if [[ "$current_branch" != codex/* ]]; then
  echo "Refusing to ship from ${current_branch}. Use a codex/ branch for shippable topic work."
  exit 1
fi

echo "Fetching latest ${base_branch}..."
git fetch origin "$base_branch"

existing_pr_state="$(gh pr view "$current_branch" --json state --jq '.state' 2>/dev/null || true)"
if [[ "$existing_pr_state" == "MERGED" || "$existing_pr_state" == "CLOSED" ]]; then
  echo "Refusing to ship from ${current_branch}. Its previous pull request is already ${existing_pr_state,,}."
  echo "Start a fresh topic branch with: npm run start-topic -- \"short topic name\""
  exit 1
fi

existing_pr_number="$(gh pr view "$current_branch" --json number --jq '.number' 2>/dev/null || true)"
working_tree_status="$(git status --short)"
branch_behind_main=false
branch_has_unpushed_commits=false

if ! git merge-base --is-ancestor "origin/${base_branch}" HEAD; then
  branch_behind_main=true
fi

cd "$repo_root"

if git show-ref --verify --quiet "refs/remotes/origin/${current_branch}"; then
  if ! git merge-base --is-ancestor "origin/${current_branch}" HEAD; then
    branch_has_unpushed_commits=true
  fi
else
  if [[ -n "$(git rev-list --count HEAD 2>/dev/null)" ]]; then
    branch_has_unpushed_commits=true
  fi
fi

if [[ "$check_only" == true ]]; then
  echo "Ship readiness for ${current_branch}:"
  echo "  branch: ${current_branch}"
  echo "  behind origin/${base_branch}: ${branch_behind_main}"
  echo "  local changes present: $([[ -n "$working_tree_status" ]] && echo yes || echo no)"
  echo "  unpushed commits present: $([[ "$branch_has_unpushed_commits" == true ]] && echo yes || echo no)"
  echo "  existing PR: ${existing_pr_number:-none}"
  echo "  existing PR state: ${existing_pr_state:-none}"
  if [[ "$branch_behind_main" == true ]]; then
    print_update_help
    exit 1
  fi
  exit 0
fi

if [[ -n "$working_tree_status" ]]; then
  echo "Staging changes..."
  git add -A

  staged_file_count="$(git diff --cached --name-only | wc -l | tr -d ' ')"
  if [[ "${staged_file_count}" -gt 12 ]]; then
    echo "Warning: ${staged_file_count} files are staged. Double-check that this branch is still one shippable slice."
  fi

  if git diff --cached --quiet; then
    echo "Nothing staged after git add -A."
    exit 1
  fi

  echo "Committing..."
  git commit -m "$title"
fi

if [[ "$branch_behind_main" == true ]]; then
  echo "Merging origin/${base_branch} into ${current_branch}..."
  if ! git merge --no-edit "origin/${base_branch}"; then
    echo "Merge from origin/${base_branch} requires manual conflict resolution."
    echo "Resolve conflicts on ${current_branch}, then rerun the ship command."
    exit 1
  fi
fi

if [[ -z "$(git status --short)" && "$branch_has_unpushed_commits" == false && -z "$existing_pr_number" ]]; then
  echo "Nothing to ship."
  exit 1
fi

echo "Running fast local check..."
npm run check

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

- [x] npm run check
- [ ] Affected UI flow checked in the running app

## Open holes

- Logic holes still open: None noted in ship flow
- Design / hierarchy holes still open: Call out in PR comments if needed

## Merge readiness

- [x] Branch is scoped to one problem
- [x] Dead code removed
- [x] Ready to merge and close branch
EOF

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

echo "Waiting for PR #${pr_number} to merge..."
while true; do
  pr_state="$(gh pr view "$pr_number" --json state --jq '.state')"
  if [[ "$pr_state" == "MERGED" ]]; then
    break
  fi

  sleep 3
done

echo "Returning local repo to ${base_branch}..."
git checkout "$base_branch"
git pull --ff-only origin "$base_branch"
if git show-ref --verify --quiet "refs/heads/${current_branch}"; then
  git branch -d "$current_branch"
fi

echo "Shipped branch ${current_branch} to PR #${pr_number} and returned to ${base_branch}."
