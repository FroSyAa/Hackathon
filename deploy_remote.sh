#!/usr/bin/env bash
set -euo pipefail

# deploy_remote.sh
# Usage: run this on the remote server (or via SSH). The script will:
# - clone or update the repo `FroSyAa/Hackathon` (branch `feature/backend-api`)
# - ensure docker / docker-compose are installed
# - adjust `docker-compose.yml` to map Postgres host port 5435 -> container 5432
# - build and start containers
# - run the test data seeder inside the backend container

REPO_URL="https://github.com/FroSyAa/Hackathon.git"
REPO_DIR="Hackathon"
BRANCH="feature/backend-api"

echo "Starting deploy script"

if [ ! -d "$REPO_DIR" ]; then
  echo "Cloning repo $REPO_URL ..."
  git clone "$REPO_URL" "$REPO_DIR"
fi

cd "$REPO_DIR"
echo "Fetching latest..."
git fetch --all --prune
git checkout "$BRANCH" || git checkout -b "$BRANCH"
git pull origin "$BRANCH" || true

echo "Ensuring docker is installed..."
if ! command -v docker >/dev/null 2>&1; then
  echo "Docker not found — installing (using apt). You may be prompted for sudo password." 
  sudo apt update
  sudo apt install -y docker.io docker-compose
  sudo systemctl enable --now docker
fi

echo "Adjusting docker-compose.yml: mapping host port 5435 -> container 5432 (Postgres)"
if grep -q "\"5432:5432\"" docker-compose.yml; then
  sed -i 's/"5432:5432"/"5435:5432"/' docker-compose.yml
  echo "Patched docker-compose.yml"
else
  echo "docker-compose.yml does not contain \"5432:5432\"; skipping patch (it may already be patched)."
fi

echo "Building and starting containers (may require sudo)"
sudo docker-compose down || true
sudo docker-compose up -d --build

echo "Waiting for DB to accept connections..."
sleep 10

echo "Running seeder inside backend container"
set +e
sudo docker-compose exec backend node scripts/createTestData.js
SEED_EXIT=$?
set -e

if [ $SEED_EXIT -ne 0 ]; then
  echo "Seeder failed (exit code $SEED_EXIT). Showing backend logs (last 200 lines):"
  sudo docker-compose logs backend --tail=200
  exit $SEED_EXIT
fi

echo "Seeder finished successfully. Generated file (on host): ./backend/scripts/generatedTestData.json"

echo "Containers status:"
sudo docker-compose ps

echo "Listing uploaded test files (if any):"
ls -la backend/uploads || true

echo "Deploy script finished. Check http://<server-ip>:8080 or your domain if DNS is set."
