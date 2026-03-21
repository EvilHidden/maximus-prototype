#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  npm run start-topic -- "Short topic name"

Examples:
  npm run start-topic -- "customer density"
  npm run start-topic -- "measurements drawer cleanup"

What it does:
  1. Verifies the working tree is clean
  2. Checks out main
  3. Pulls the latest main with --ff-only
  4. Creates a new codex/ branch based on the topic name
EOF
}

if [[ "${1:-}" == "" ]] || [[ "${1:-}" == "--help" ]] || [[ "${1:-}" == "-h" ]]; then
  usage
  exit 0
fi

topic="$1"
repo_root="$(git rev-parse --show-toplevel)"

slug="$(printf '%s' "$topic" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/-{2,}/-/g')"

if [[ -z "$slug" ]]; then
  echo "Could not derive a branch name from topic: $topic"
  exit 1
fi

branch_name="codex/${slug}"

cd "$repo_root"

if [[ -n "$(git status --short)" ]]; then
  echo "Working tree is not clean. Commit, stash, or discard changes before starting a new topic branch."
  exit 1
fi

if git show-ref --verify --quiet "refs/heads/${branch_name}"; then
  echo "Branch ${branch_name} already exists locally."
  exit 1
fi

echo "Checking out main..."
git checkout main

echo "Pulling latest main..."
git pull --ff-only origin main

echo "Creating ${branch_name}..."
git checkout -b "$branch_name"

echo "Ready on ${branch_name}."
