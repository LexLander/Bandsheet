#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
README="$ROOT_DIR/README.md"

if [[ ! -f "$README" ]]; then
  echo "README.md not found"
  exit 1
fi

ORIGIN_URL="$(git -C "$ROOT_DIR" remote get-url origin 2>/dev/null || true)"
if [[ -z "$ORIGIN_URL" ]]; then
  echo "origin is not configured"
  exit 2
fi

# Supports:
# - git@github.com:owner/repo.git
# - https://github.com/owner/repo.git
# - https://github.com/owner/repo
if [[ "$ORIGIN_URL" =~ github\.com[:/]([^/]+)/([^/.]+)(\.git)?$ ]]; then
  OWNER="${BASH_REMATCH[1]}"
  REPO="${BASH_REMATCH[2]}"
else
  echo "Unsupported origin URL format: $ORIGIN_URL"
  exit 3
fi

# Replace placeholder in README.
sed -i '' "s|OWNER/REPO|$OWNER/$REPO|g" "$README"

# Remove placeholder note if it exists before or after replacement.
sed -i '' "/^> Оновіть .*CI badge.*origin.*$/d" "$README"

echo "Updated README badge to https://github.com/$OWNER/$REPO/actions/workflows/ci.yml"
