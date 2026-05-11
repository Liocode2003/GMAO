#Requires -Version 5.1
<#
.SYNOPSIS
    Démarre SGRH Cabinet en local avec Docker Compose.
#>

Write-Host "SGRH Cabinet -- Démarrage local" -ForegroundColor Cyan

# Créer le .env si absent
if (-not (Test-Path ".env")) {
    @"
DB_PASSWORD=sgrh_local_pass
JWT_SECRET=dev_secret_sgrh_cabinet_local_32chars_min
JWT_EXPIRES_IN=8h
HTTP_PORT=8080
HTTPS_PORT=8443
LOG_LEVEL=debug
"@ | Set-Content -Encoding UTF8 ".env"
    Write-Host ".env créé" -ForegroundColor Green
}

# Créer le dossier ssl si absent
if (-not (Test-Path "nginx\ssl")) {
    New-Item -ItemType Directory -Path "nginx\ssl" | Out-Null
}

# Lancer Docker Compose
Write-Host "Lancement de Docker Compose..." -ForegroundColor Yellow
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur au démarrage de Docker Compose." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Application disponible sur http://localhost:8080" -ForegroundColor Green
Write-Host ""
Write-Host "Comptes de démo:" -ForegroundColor White
Write-Host "  DRH     --> drh@cabinet.ci / Admin123!"
Write-Host "  Manager --> manager@cabinet.ci / Admin123!"
Write-Host ""
Write-Host "Logs : docker compose logs -f"
Write-Host "Stop : docker compose down"
