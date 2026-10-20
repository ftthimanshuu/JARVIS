# Run Tauri desktop app in development mode
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$desktopDir = Join-Path (Split-Path -Parent $scriptDir) "apps\desktop"

Write-Host "==> Starting JARVIS Desktop App (Tauri dev)..." -ForegroundColor Cyan

Push-Location $desktopDir
try {
    npm run tauri dev
} finally {
    Pop-Location
}
