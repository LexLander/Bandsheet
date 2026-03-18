#!/usr/bin/env bash
set -euo pipefail

echo "=== Pre-push check ==="

echo "[Repo path]"
pwd

echo
echo "[Remote]"
git remote -v

echo
echo "[Current branch + upstream]"
git branch -vv | sed -n '1,3p'

echo
echo "[Commit author for this repo]"
echo "user.name:  $(git config user.name || echo '<not set>')"
echo "user.email: $(git config user.email || echo '<not set>')"

echo
echo "[Working tree summary]"
git status --short | sed -n '1,40p'

echo
echo "=== End pre-push check ==="