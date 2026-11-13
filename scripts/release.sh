#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <commit-message> <version>"
  echo "Example: $0 \"feat: auto collapse keypad\" 1.7.2"
  exit 1
fi

COMMIT_MSG="$1"
RAW_VERSION="$2"
VERSION="${RAW_VERSION#v}"
TAG="v${VERSION}"

if [[ -z "${COMMIT_MSG// /}" ]]; then
  echo "Error: Commit message cannot be empty."
  exit 1
fi

if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+([+-][0-9A-Za-z.-]+)?$ ]]; then
  echo "Error: Invalid version '$RAW_VERSION'. Expected semantic version like 1.7.2 or v1.7.2."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "$REPO_ROOT"

if git rev-parse -q --verify "refs/tags/${TAG}" >/dev/null; then
  echo "Error: Git tag '${TAG}' already exists locally."
  exit 1
fi

if git ls-remote --exit-code --tags origin "refs/tags/${TAG}" >/dev/null 2>&1; then
  echo "Error: Git tag '${TAG}' already exists on origin."
  exit 1
fi

echo "Updating package version to ${VERSION}..."
npm version "$VERSION" --no-git-tag-version

echo "Typechecking and building..."
npx tsc --noEmit
npm run build

echo "Staging all changes..."
git add -A

if git diff --cached --quiet; then
  echo "Error: No changes to commit."
  exit 1
fi

echo "Committing..."
git commit -m "$COMMIT_MSG"

echo "Tagging ${TAG}..."
git tag -a "$TAG" -m "$TAG"

echo "Pushing commit and tag ${TAG}..."
git push
git push origin "$TAG"

echo "Done! Released ${TAG}."

