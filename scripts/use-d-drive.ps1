# Route npm cache/temp to D: so installs don't fill C:
$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path "D:\npm-cache", "D:\Temp" | Out-Null

$env:TEMP = "D:\Temp"
$env:TMP = "D:\Temp"
$env:TMPDIR = "D:\Temp"
$env:npm_config_cache = "D:\npm-cache"
$env:npm_config_tmp = "D:\Temp"

Write-Host "Using D: for npm cache ($env:npm_config_cache) and temp ($env:TEMP)"
Write-Host "Run installs from this session, e.g.:"
Write-Host "  npm install --legacy-peer-deps -w @fireguard/web"
