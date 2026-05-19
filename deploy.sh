#!/bin/bash

# =========================================================================
# Laboremus - Deployment Script
# =========================================================================

set -e # Exit immediately if a command exits with a non-zero status

echo "🚀 Starting deployment process..."

# 1. Check if .env exists, copy from .env.example if not
if [ ! -f .env ]; then
  echo "⚠️  .env file not found!"
  if [ -f .env.example ]; then
    echo "📋 Copying .env.example to .env..."
    cp .env.example .env
    echo "✅ Created .env from .env.example. Please review it."
  else
    echo "❌ Error: Neither .env nor .env.example exists."
    exit 1
  fi
fi

# 2. Build and start containers
echo "📦 Building and starting Docker containers..."
docker compose down
docker compose up --build -d

# 3. Wait for the database and web service to be healthy
echo "⏳ Waiting for the services to be ready..."
sleep 8

# 4. Seed the database
echo "🌱 Seeding the database with default roles..."
docker compose exec -T web npm run db:seed || echo "⚠️  Seeding failed or skipped."

echo "🎉 Deployment complete! Application is running on http://localhost:3000"
