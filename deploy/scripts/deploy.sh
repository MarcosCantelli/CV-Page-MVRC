#!/usr/bin/env bash
# Pulls and (re)starts the stack, then waits until the app container is healthy.
# Usage: deploy.sh <compose-dir> <image-tag> [url-to-check]
set -euo pipefail

dir="$1"
tag="$2"
check_url="${3:-}"

cd "$dir"
[ -f .env ] || { echo "missing $dir/.env" >&2; exit 1; }

# Persist the deployed tag so a manual `docker compose up -d` keeps the same version.
if grep -q '^TAG=' .env; then
  sed -i "s|^TAG=.*|TAG=${tag}|" .env
else
  printf '\nTAG=%s\n' "$tag" >> .env
fi

docker compose pull --quiet
docker compose up -d --remove-orphans

cid="$(docker compose ps -q app)"
for _ in $(seq 1 40); do
  status="$(docker inspect -f '{{.State.Health.Status}}' "$cid" 2>/dev/null || echo unknown)"
  echo "app health: ${status}"
  [ "$status" = healthy ] && break
  sleep 3
done
if [ "$status" != healthy ]; then
  docker compose logs --tail 80 app
  exit 1
fi

if [ -n "$check_url" ]; then
  curl -fsS --retry 10 --retry-delay 3 --retry-all-errors -o /dev/null "$check_url"
  echo "OK: ${check_url}"
fi

docker image prune -f >/dev/null
