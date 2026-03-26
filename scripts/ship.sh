#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  npm run ship -- --check
  npm run ship -- --dry-run "Short PR title"
  npm run ship -- --no-auto-merge "Short PR title"
  npm run ship -- "Short PR title"

What it does:
  1. Verifies you are on a codex/ branch and not on main
  2. Fetches origin/main and computes ship readiness
  3. In --check mode, reports readiness and exits
  4. Refuses to ship with untracked files or in-progress git operations
  5. Stages tracked changes only and commits them with the provided title if needed
  6. Merges origin/main into your topic branch if needed and safe
  7. Runs npm run check for a fast local gate
  8. Pushes the current branch
  9. Creates or updates a pull request to main
  10. Enables auto-merge by default, waits for merge, then returns to main and deletes the local topic branch

Important:
  - Never reuse a codex/ branch after its PR has been merged or closed.
  - Untracked files are blocked by default and are never included silently.
  - If your branch is behind origin/main, the script will only auto-merge main when the working tree is clean.
EOF
}

base_branch="main"
wait_timeout_seconds=1200
poll_interval_seconds=5

check_only=false
dry_run=false
auto_merge=true
title=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --check)
      check_only=true
      shift
      ;;
    --dry-run)
      dry_run=true
      shift
      ;;
    --no-auto-merge)
      auto_merge=false
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      if [[ -n "$title" ]]; then
        echo "Unexpected extra argument: $1"
        usage
        exit 1
      fi
      title="$1"
      shift
      ;;
  esac
done

if [[ "$check_only" == false && -z "$title" ]]; then
  usage
  exit 1
fi

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

current_branch="$(git branch --show-current)"

print_update_help() {
  cat <<EOF
Update first with:
  git checkout ${base_branch}
  git pull --ff-only origin ${base_branch}
  git checkout ${current_branch}
  git merge ${base_branch}
EOF
}

print_remote_branch_help() {
  cat <<EOF
Reconcile your topic branch first with:
  git fetch origin ${current_branch}
  git checkout ${current_branch}
  git pull --ff-only origin ${current_branch}
EOF
}

print_untracked_help() {
  cat <<EOF
Untracked files are blocked by default.
Either:
  - add the files intentionally with git add <path>
  - ignore them in .gitignore
  - or remove/move them before shipping
EOF
}

bool_text() {
  if [[ "$1" == "true" ]]; then
    echo "yes"
  else
    echo "no"
  fi
}

collect_check_rollup_summary() {
  local pr_ref="$1"
  gh pr view "$pr_ref" \
    --json statusCheckRollup \
    --jq '
      .statusCheckRollup
      | map(
          if .__typename == "CheckRun" then
            (.name + ": " + (.status // "UNKNOWN") + (if .conclusion then "/" + .conclusion else "" end))
          else
            (.context + ": " + (.state // "UNKNOWN"))
          end
        )
      | join("\n")
    ' 2>/dev/null || true
}

collect_failing_check_summary() {
  local pr_ref="$1"
  gh pr view "$pr_ref" \
    --json statusCheckRollup \
    --jq '
      .statusCheckRollup
      | map(
          if .__typename == "CheckRun" then
            select((.status != "COMPLETED") or (.conclusion != "SUCCESS"))
            | (.name + ": " + (.status // "UNKNOWN") + (if .conclusion then "/" + .conclusion else "" end))
          else
            select(.state != "SUCCESS")
            | (.context + ": " + (.state // "UNKNOWN"))
          end
        )
      | join("\n")
    ' 2>/dev/null || true
}

print_blocker_summary() {
  local pr_ref="$1"
  local pr_url pr_state merge_state review_decision checks

  pr_url="$(gh pr view "$pr_ref" --json url --jq '.url' 2>/dev/null || true)"
  pr_state="$(gh pr view "$pr_ref" --json state --jq '.state' 2>/dev/null || true)"
  merge_state="$(gh pr view "$pr_ref" --json mergeStateStatus --jq '.mergeStateStatus' 2>/dev/null || true)"
  review_decision="$(gh pr view "$pr_ref" --json reviewDecision --jq '.reviewDecision // "NONE"' 2>/dev/null || true)"
  checks="$(collect_failing_check_summary "$pr_ref")"

  echo "PR blocker summary:"
  echo "  url: ${pr_url:-unknown}"
  echo "  state: ${pr_state:-unknown}"
  echo "  merge state: ${merge_state:-unknown}"
  echo "  review decision: ${review_decision:-unknown}"
  if [[ -n "$checks" ]]; then
    echo "  failing or pending checks:"
    while IFS= read -r line; do
      echo "    - $line"
    done <<< "$checks"
  else
    echo "  failing or pending checks: none detected"
  fi
}

ensure_not_in_progress() {
  if git rev-parse -q --verify MERGE_HEAD >/dev/null 2>&1; then
    echo "Refusing to ship while a merge is in progress."
    exit 1
  fi

  if [[ -d "$(git rev-parse --git-path rebase-merge)" || -d "$(git rev-parse --git-path rebase-apply)" ]]; then
    echo "Refusing to ship while a rebase is in progress."
    exit 1
  fi

  if git rev-parse -q --verify CHERRY_PICK_HEAD >/dev/null 2>&1; then
    echo "Refusing to ship while a cherry-pick is in progress."
    exit 1
  fi

  if git rev-parse -q --verify REVERT_HEAD >/dev/null 2>&1; then
    echo "Refusing to ship while a revert is in progress."
    exit 1
  fi

  if ! git symbolic-ref -q HEAD >/dev/null 2>&1; then
    echo "Refusing to ship from detached HEAD."
    exit 1
  fi
}

ensure_branch_allowed() {
  if [[ "$current_branch" == "$base_branch" ]]; then
    echo "Refusing to ship directly from ${base_branch}. Create a codex/ branch first."
    exit 1
  fi

  if [[ "$current_branch" != codex/* ]]; then
    echo "Refusing to ship from ${current_branch}. Use a codex/ branch for shippable topic work."
    exit 1
  fi
}

echo "Fetching latest ${base_branch}..."
git fetch origin "$base_branch"

ensure_not_in_progress
ensure_branch_allowed

existing_pr_state="$(gh pr view "$current_branch" --json state --jq '.state' 2>/dev/null || true)"
if [[ "$existing_pr_state" == "MERGED" || "$existing_pr_state" == "CLOSED" ]]; then
  echo "Refusing to ship from ${current_branch}. Its previous pull request is already ${existing_pr_state,,}."
  echo "Start a fresh topic branch with: npm run start-topic -- \"short topic name\""
  exit 1
fi

existing_pr_number="$(gh pr view "$current_branch" --json number --jq '.number' 2>/dev/null || true)"
existing_pr_url="$(gh pr view "$current_branch" --json url --jq '.url' 2>/dev/null || true)"
existing_pr_merge_state="$(gh pr view "$current_branch" --json mergeStateStatus --jq '.mergeStateStatus // "UNKNOWN"' 2>/dev/null || true)"
existing_pr_review_decision="$(gh pr view "$current_branch" --json reviewDecision --jq '.reviewDecision // "NONE"' 2>/dev/null || true)"
status_rollup_summary=""
if [[ -n "$existing_pr_number" ]]; then
  status_rollup_summary="$(collect_check_rollup_summary "$current_branch")"
fi

tracked_changes="$(git status --short --untracked-files=no)"
untracked_files="$(git ls-files --others --exclude-standard)"
tracked_change_count="$(printf '%s\n' "$tracked_changes" | sed '/^$/d' | wc -l | tr -d ' ')"
untracked_file_count="$(printf '%s\n' "$untracked_files" | sed '/^$/d' | wc -l | tr -d ' ')"

branch_behind_main=false
if ! git merge-base --is-ancestor "origin/${base_branch}" HEAD; then
  branch_behind_main=true
fi

remote_branch_exists=false
branch_remote_state="new"
branch_ahead_count=0
branch_behind_count=0

if git show-ref --verify --quiet "refs/remotes/origin/${current_branch}"; then
  remote_branch_exists=true
  local_remote_only_count=0
  local_local_only_count=0
  read -r local_remote_only_count local_local_only_count < <(git rev-list --left-right --count "origin/${current_branch}...HEAD")
  branch_ahead_count="$local_local_only_count"
  branch_behind_count="$local_remote_only_count"
  if [[ "$branch_ahead_count" -gt 0 && "$branch_behind_count" -gt 0 ]]; then
    branch_remote_state="diverged"
  elif [[ "$branch_ahead_count" -gt 0 ]]; then
    branch_remote_state="ahead"
  elif [[ "$branch_behind_count" -gt 0 ]]; then
    branch_remote_state="behind"
  else
    branch_remote_state="in-sync"
  fi
fi

pr_blocked=false
if [[ -n "$existing_pr_number" ]]; then
  if [[ "$existing_pr_merge_state" != "CLEAN" && "$existing_pr_merge_state" != "UNKNOWN" && "$existing_pr_merge_state" != "HAS_HOOKS" ]]; then
    pr_blocked=true
  fi
  if [[ "$existing_pr_review_decision" == "CHANGES_REQUESTED" || "$existing_pr_review_decision" == "REVIEW_REQUIRED" ]]; then
    pr_blocked=true
  fi
  if [[ -n "$status_rollup_summary" ]]; then
    failing_summary="$(collect_failing_check_summary "$current_branch")"
    if [[ -n "$failing_summary" ]]; then
      pr_blocked=true
    fi
  fi
fi

print_readiness() {
  echo "Ship readiness for ${current_branch}:"
  echo "  branch: ${current_branch}"
  echo "  is codex branch: $(bool_text true)"
  echo "  is main: $(bool_text false)"
  echo "  merge/rebase/cherry-pick/revert in progress: no"
  echo "  tracked changes present: $([[ "$tracked_change_count" -gt 0 ]] && echo yes || echo no)"
  echo "  untracked files present: $([[ "$untracked_file_count" -gt 0 ]] && echo yes || echo no)"
  echo "  behind origin/${base_branch}: ${branch_behind_main}"
  echo "  remote topic branch exists: $(bool_text "$remote_branch_exists")"
  echo "  topic branch remote state: ${branch_remote_state}"
  if [[ "$remote_branch_exists" == true ]]; then
    echo "  topic branch ahead count: ${branch_ahead_count}"
    echo "  topic branch behind count: ${branch_behind_count}"
  fi
  echo "  existing PR: ${existing_pr_number:-none}"
  echo "  existing PR state: ${existing_pr_state:-none}"
  if [[ -n "$existing_pr_number" ]]; then
    echo "  existing PR merge state: ${existing_pr_merge_state}"
    echo "  existing PR review decision: ${existing_pr_review_decision}"
    echo "  existing PR blocked: $(bool_text "$pr_blocked")"
  fi

  if [[ "$tracked_change_count" -gt 0 ]]; then
    echo "  tracked files that would be staged:"
    while IFS= read -r line; do
      [[ -n "$line" ]] && echo "    - $line"
    done <<< "$tracked_changes"
    if [[ "$tracked_change_count" -gt 12 ]]; then
      echo "  warning: large tracked diff (${tracked_change_count} files)"
    fi
  fi

  if [[ "$untracked_file_count" -gt 0 ]]; then
    echo "  untracked files:"
    while IFS= read -r line; do
      [[ -n "$line" ]] && echo "    - $line"
    done <<< "$untracked_files"
  fi

  if [[ -n "$status_rollup_summary" ]]; then
    echo "  PR checks:"
    while IFS= read -r line; do
      [[ -n "$line" ]] && echo "    - $line"
    done <<< "$status_rollup_summary"
  fi
}

if [[ "$check_only" == true ]]; then
  print_readiness

  blocked=false
  if [[ "$branch_behind_main" == true ]]; then
    blocked=true
    print_update_help
  fi
  if [[ "$branch_remote_state" == "behind" || "$branch_remote_state" == "diverged" ]]; then
    blocked=true
    print_remote_branch_help
  fi
  if [[ "$untracked_file_count" -gt 0 ]]; then
    blocked=true
    print_untracked_help
  fi
  if [[ "$pr_blocked" == true ]]; then
    blocked=true
    print_blocker_summary "$current_branch"
  fi

  if [[ "$blocked" == true ]]; then
    exit 1
  fi
  exit 0
fi

if [[ "$dry_run" == true ]]; then
  print_readiness
fi

if [[ "$branch_remote_state" == "behind" || "$branch_remote_state" == "diverged" ]]; then
  echo "Refusing to ship from ${current_branch}. Remote topic branch state is ${branch_remote_state}."
  print_remote_branch_help
  exit 1
fi

if [[ "$untracked_file_count" -gt 0 ]]; then
  echo "Refusing to ship from ${current_branch}. Untracked files are present."
  print_untracked_help
  exit 1
fi

if [[ "$branch_behind_main" == true && "$tracked_change_count" -gt 0 ]]; then
  echo "Refusing to ship from ${current_branch}. It is behind origin/${base_branch} and the working tree is dirty."
  echo "Commit or stash tracked changes first, then rerun ship."
  print_update_help
  exit 1
fi

if [[ "$tracked_change_count" -gt 0 ]]; then
  echo "Tracked files that will be staged:"
  while IFS= read -r line; do
    [[ -n "$line" ]] && echo "  - $line"
  done <<< "$tracked_changes"

  if [[ "$dry_run" == true ]]; then
    echo "[dry-run] Would stage tracked changes with: git add -u"
    echo "[dry-run] Would commit tracked changes with title: ${title}"
  else
    echo "Staging tracked changes..."
    git add -u

    staged_file_count="$(git diff --cached --name-only | wc -l | tr -d ' ')"
    if [[ "${staged_file_count}" -gt 12 ]]; then
      echo "Warning: ${staged_file_count} tracked files are staged. Double-check that this branch is still one shippable slice."
    fi

    if git diff --cached --quiet; then
      echo "Nothing staged after git add -u."
      exit 1
    fi

    echo "Committing..."
    git commit -m "$title"
  fi
fi

if [[ "$branch_behind_main" == true ]]; then
  if [[ "$dry_run" == true ]]; then
    echo "[dry-run] Would merge origin/${base_branch} into ${current_branch}"
  else
    echo "Merging origin/${base_branch} into ${current_branch}..."
    if ! git merge --no-edit "origin/${base_branch}"; then
      echo "Merge from origin/${base_branch} requires manual conflict resolution."
      echo "Resolve conflicts on ${current_branch}, then rerun the ship command."
      exit 1
    fi
  fi
fi

if [[ -z "$(git status --short --untracked-files=no)" && "$branch_remote_state" == "in-sync" && -z "$existing_pr_number" ]]; then
  echo "Nothing to ship."
  exit 1
fi

echo "Running fast local check..."
if [[ "$dry_run" == true ]]; then
  echo "[dry-run] Would run: npm run check"
else
  npm run check
fi

if [[ "$dry_run" == true ]]; then
  echo "[dry-run] Would push branch: ${current_branch}"
else
  echo "Pushing branch..."
  git push -u origin "$current_branch"
fi

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

if [[ "$dry_run" == true ]]; then
  if [[ -z "$existing_pr_number" ]]; then
    echo "[dry-run] Would create PR to ${base_branch} with title: ${title}"
  else
    echo "[dry-run] Would update existing PR #${existing_pr_number} title/body"
  fi
  if [[ "$auto_merge" == true ]]; then
    echo "[dry-run] Would enable auto-merge and wait for merge"
  else
    echo "[dry-run] Would stop after PR update because --no-auto-merge is set"
  fi
  exit 0
fi

if [[ -z "$existing_pr_number" ]]; then
  echo "Creating pull request..."
  gh pr create \
    --base "$base_branch" \
    --head "$current_branch" \
    --title "$title" \
    --body-file "$body_file"
else
  echo "Updating existing pull request #${existing_pr_number}..."
  gh pr edit "$existing_pr_number" --title "$title" --body-file "$body_file"
fi

pr_number="$(gh pr view "$current_branch" --json number --jq '.number')"

if [[ "$auto_merge" == false ]]; then
  echo "PR #${pr_number} is ready. Auto-merge was skipped because --no-auto-merge is set."
  exit 0
fi

echo "Enabling auto-merge..."
if ! gh pr merge "$pr_number" --auto --merge --delete-branch; then
  echo "Unable to enable auto-merge for PR #${pr_number}."
  print_blocker_summary "$pr_number"
  exit 1
fi

echo "Waiting for PR #${pr_number} to merge..."
wait_started_at="$(date +%s)"
while true; do
  pr_state="$(gh pr view "$pr_number" --json state --jq '.state')"
  if [[ "$pr_state" == "MERGED" ]]; then
    break
  fi

  now="$(date +%s)"
  elapsed="$((now - wait_started_at))"
  if [[ "$elapsed" -ge "$wait_timeout_seconds" ]]; then
    echo "Timed out waiting for PR #${pr_number} to merge."
    print_blocker_summary "$pr_number"
    exit 1
  fi

  sleep "$poll_interval_seconds"
done

echo "Returning local repo to ${base_branch}..."
git checkout "$base_branch"
git pull --ff-only origin "$base_branch"
if git show-ref --verify --quiet "refs/heads/${current_branch}"; then
  git branch -d "$current_branch"
fi

echo "Final branch status:"
git status --short --branch
echo "Shipped branch ${current_branch} to PR #${pr_number} and returned to ${base_branch}."
