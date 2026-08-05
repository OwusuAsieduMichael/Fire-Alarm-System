# FireGuard IoT — first-time setup (Windows PowerShell)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "==> Installing API dependencies..." -ForegroundColor Cyan
Set-Location "$Root\apps\api"
npm install --legacy-peer-deps --fetch-retries=5

Write-Host "==> Installing Web dependencies..." -ForegroundColor Cyan
Set-Location "$Root\apps\web"
npm install --legacy-peer-deps --fetch-retries=5

Write-Host "==> Installing root tooling..." -ForegroundColor Cyan
Set-Location $Root
npm install --legacy-peer-deps --fetch-retries=5

Write-Host "==> Prisma generate + push + seed..." -ForegroundColor Cyan
Set-Location "$Root\apps\api"
npx prisma generate
npx prisma db push
npx ts-node prisma/seed.ts

Write-Host ""
Write-Host "Setup complete. Run from repo root:" -ForegroundColor Green
Write-Host "  npm run dev"
Write-Host ""
Write-Host "Login: developer@fireguard.io / FireGuard@2026"
