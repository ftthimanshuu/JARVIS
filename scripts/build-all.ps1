# Build both Spring Boot backend and Tauri desktop app
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
$backendDir = Join-Path $rootDir "services\local-backend"
$desktopDir = Join-Path $rootDir "apps\desktop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "       Building JARVIS (Full Suite)       " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Build Spring Boot Backend
Write-Host "`n[1/2] Building Spring Boot Backend..." -ForegroundColor Yellow
$mvn = "$env:USERPROFILE\tools\maven\apache-maven-3.10.0\bin\mvn.cmd"
if (-not (Test-Path $mvn)) {
    $mvn = "mvn"
}

Push-Location $backendDir
try {
    & $mvn clean package -DskipTests
    if ($LASTEXITCODE -ne 0) { throw "Backend build failed" }
} finally {
    Pop-Location
}
Write-Host "Backend build complete: services\local-backend\target\local-backend-0.1.0-SNAPSHOT.jar" -ForegroundColor Green

# 2. Build Tauri Desktop Frontend
Write-Host "`n[2/2] Building Tauri Desktop Frontend..." -ForegroundColor Yellow
Push-Location $desktopDir
try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Desktop frontend build failed" }
} finally {
    Pop-Location
}
Write-Host "Desktop frontend build complete: apps\desktop\dist\" -ForegroundColor Green

Write-Host "`n==> All JARVIS artifacts built successfully!" -ForegroundColor Cyan
