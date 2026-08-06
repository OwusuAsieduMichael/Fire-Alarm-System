# Run FireGuard web locally using D: for cache/temp (avoids full C: drive).
# Usage (from PowerShell):
#   powershell -ExecutionPolicy Bypass -File D:\Fire_Alarm_Sytsem\scripts\dev-web-d.ps1

$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path "D:\npm-cache", "D:\Temp", "D:\AppData\Local", "D:\AppData\Roaming" | Out-Null

$env:TEMP = "D:\Temp"
$env:TMP = "D:\Temp"
$env:npm_config_cache = "D:\npm-cache"
$env:LOCALAPPDATA = "D:\AppData\Local"
$env:APPDATA = "D:\AppData\Roaming"

Set-Location "D:\Fire_Alarm_Sytsem\apps\web"

if (-not (Test-Path ".\node_modules\.bin\next.cmd")) {
  Write-Host "Installing web dependencies on D: (one-time)..."
  # Clear broken install if present
  if (Test-Path ".\node_modules") {
    cmd /c "rmdir /s /q node_modules"
  }
  npm install --legacy-peer-deps --workspaces=false --cache "D:\npm-cache" --no-fund --no-audit
}

if (-not (Test-Path ".\node_modules\.bin\next.cmd")) {
  throw "next still missing after install. Free a bit of C: (1GB+) and retry, or close antivirus locking node_modules."
}

Write-Host "Starting FireGuard web at http://localhost:3000"
npm run dev
