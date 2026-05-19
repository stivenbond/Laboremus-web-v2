# =========================================================================
# Laboremus - Windows Deployment Script (PowerShell)
# =========================================================================

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting deployment process..." -ForegroundColor Cyan

# 1. Check if .env exists, copy from .env.example if not
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found!" -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Write-Host "📋 Copying .env.example to .env..." -ForegroundColor Gray
        Copy-Item ".env.example" ".env"
        Write-Host "✅ Created .env from .env.example. Please review it." -ForegroundColor Green
    } else {
        Write-Error "❌ Error: Neither .env nor .env.example exists."
        exit 1
    }
}

# 2. Build and start containers
Write-Host "📦 Building and starting Docker containers..." -ForegroundColor Cyan
docker compose down
docker compose up --build -d

# 3. Wait for the services to be healthy
Write-Host "⏳ Waiting for the services to be ready..." -ForegroundColor Cyan
Start-Sleep -Seconds 8

# 4. Seed the database
Write-Host "🌱 Seeding the database with default roles..." -ForegroundColor Cyan
try {
    docker compose exec -T web npm run db:seed
} catch {
    Write-Host "⚠️  Seeding failed or skipped." -ForegroundColor Yellow
}

Write-Host "🎉 Deployment complete! Application is running on http://localhost:3000" -ForegroundColor Green
