# Run Spring Boot backend in development mode
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path (Split-Path -Parent $scriptDir) "services\local-backend"

Write-Host "==> Starting JARVIS Local Backend on http://127.0.0.1:48765..." -ForegroundColor Cyan

$mvn = "$env:USERPROFILE\tools\maven\apache-maven-3.10.0\bin\mvn.cmd"
if (-not (Test-Path $mvn)) {
    $mvn = "mvn"
}

$jarvisDir = Join-Path $env:USERPROFILE ".jarvis"
if (-not (Test-Path $jarvisDir)) {
    New-Item -ItemType Directory -Path $jarvisDir -Force | Out-Null
}

Push-Location $backendDir
try {
    & $mvn spring-boot:run
} finally {
    Pop-Location
}
