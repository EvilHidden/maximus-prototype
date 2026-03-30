#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  npm run start-topic -- "Short topic name"
  npm run start-topic -- --allow-parallel-subsystem "Short topic name"

Examples:
  npm run start-topic -- "customer density"
  npm run start-topic -- "measurements drawer cleanup"

What it does:
  1. Verifies the working tree is clean
  2. Checks out main
  3. Pulls the latest main with --ff-only
  4. Refuses to create a second same-subsystem topic branch unless you explicitly allow it
  5. Creates a new codex/ branch based on the topic name
EOF
}

allow_parallel_subsystem=false
topic=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --allow-parallel-subsystem)
      allow_parallel_subsystem=true
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      if [[ -n "$topic" ]]; then
        echo "Unexpected extra argument: $1"
        usage
        exit 1
      fi
      topic="$1"
      shift
      ;;
  esac
done

if [[ -z "$topic" ]]; then
  usage
  exit 0
fi

repo_root="$(git rev-parse --show-toplevel)"

slug="$(printf '%s' "$topic" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/-{2,}/-/g')"

if [[ -z "$slug" ]]; then
  echo "Could not derive a branch name from topic: $topic"
  exit 1
fi

branch_name="codex/${slug}"
subsystem_token="${slug%%-*}"

cd "$repo_root"

if [[ -n "$(git status --short)" ]]; then
  echo "Working tree is not clean. Commit, stash, or discard changes before starting a new topic branch."
  exit 1
fi

if git show-ref --verify --quiet "refs/heads/${branch_name}"; then
  echo "Branch ${branch_name} already exists locally."
  exit 1
fi

same_subsystem_branches="$(
  git for-each-ref --format='%(refname:short)' "refs/heads/codex/*" \
    | grep -E "^codex/${subsystem_token}(-|$)" \
    | grep -vx "${branch_name}" || true
)"

if [[ "$allow_parallel_subsystem" == false && -n "$same_subsystem_branches" ]]; then
  echo "Refusing to create ${branch_name} while other local codex/${subsystem_token}- branches exist:"
  while IFS= read -r branch; do
    [[ -n "$branch" ]] && echo "  - $branch"
  done <<< "$same_subsystem_branches"
  echo
  echo "Checkpoint before opening a second branch in the same subsystem:"
  echo "  - Does one of those branches already contain the accepted fix?"
  echo "  - Should this follow-up continue on one of them instead?"
  echo
  echo "If you intentionally need parallel same-subsystem work, rerun with:"
  echo "  npm run start-topic -- --allow-parallel-subsystem \"${topic}\""
  echo
  echo "Current local branch graph:"
  git log --oneline --decorate --graph --max-count=12 --all --simplify-by-decoration
  exit 1
fi

echo "Checking out main..."
git checkout main

echo "Pulling latest main..."
git pull --ff-only origin main

echo "Creating ${branch_name}..."
git checkout -b "$branch_name"

echo "Ready on ${branch_name}."
