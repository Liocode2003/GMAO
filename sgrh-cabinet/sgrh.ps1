#Requires -Version 5.1
<#
.SYNOPSIS
    Outil de gestion SGRH Cabinet — commandes rapides via PowerShell.

.EXAMPLE
    .\sgrh.ps1 start          # Démarrer l'application
    .\sgrh.ps1 stop           # Arrêter l'application
    .\sgrh.ps1 restart        # Redémarrer tout
    .\sgrh.ps1 rebuild        # Reconstruire et redémarrer après un changement de code
    .\sgrh.ps1 rebuild front  # Reconstruire uniquement le frontend
    .\sgrh.ps1 rebuild back   # Reconstruire uniquement le backend
    .\sgrh.ps1 logs           # Voir tous les logs en direct
    .\sgrh.ps1 logs front     # Logs du frontend uniquement
    .\sgrh.ps1 logs back      # Logs du backend uniquement
    .\sgrh.ps1 status         # État des conteneurs
    .\sgrh.ps1 reset          # Tout supprimer et repartir de zéro (ATTENTION : efface la BDD)
#>

param(
    [Parameter(Position=0)]
    [string]$Command = "help",

    [Parameter(Position=1)]
    [string]$Target = ""
)

$COMPOSE_FILES = "-f docker-compose.yml -f docker-compose.local.yml"

function Write-Title($msg) {
    Write-Host ""
    Write-Host ">> $msg" -ForegroundColor Cyan
    Write-Host ""
}

function Ensure-Env {
    if (-not (Test-Path ".env")) {
        @"
DB_PASSWORD=sgrh_local_pass
JWT_SECRET=dev_secret_sgrh_cabinet_local_32chars_min
JWT_EXPIRES_IN=8h
HTTP_PORT=8080
HTTPS_PORT=8443
LOG_LEVEL=debug
"@ | Set-Content -Encoding UTF8 ".env"
        Write-Host ".env créé avec les valeurs par défaut." -ForegroundColor Yellow
    }
    if (-not (Test-Path "nginx\ssl")) {
        New-Item -ItemType Directory -Path "nginx\ssl" | Out-Null
    }
}

function Run-Compose($args) {
    $cmd = "docker compose $COMPOSE_FILES $args"
    Invoke-Expression $cmd
    return $LASTEXITCODE
}

switch ($Command.ToLower()) {

    "start" {
        Write-Title "Démarrage de SGRH Cabinet"
        Ensure-Env
        Run-Compose "up -d --build"
        Write-Host ""
        Write-Host "Application disponible sur http://localhost:8080" -ForegroundColor Green
        Write-Host "  DRH     --> drh@cabinet.ci / Admin123!"
        Write-Host "  Manager --> manager@cabinet.ci / Admin123!"
    }

    "stop" {
        Write-Title "Arrêt de SGRH Cabinet"
        Run-Compose "down"
        Write-Host "Application arrêtée." -ForegroundColor Yellow
    }

    "restart" {
        Write-Title "Redémarrage de SGRH Cabinet"
        Run-Compose "restart"
        Write-Host "Redémarré." -ForegroundColor Green
    }

    "rebuild" {
        switch ($Target.ToLower()) {
            "front" {
                Write-Title "Reconstruction du Frontend"
                Run-Compose "build frontend"
                Run-Compose "up -d --no-deps frontend"
            }
            "back" {
                Write-Title "Reconstruction du Backend"
                Run-Compose "build backend"
                Run-Compose "up -d --no-deps backend"
            }
            default {
                Write-Title "Reconstruction complète (frontend + backend)"
                Run-Compose "up -d --build"
            }
        }
        Write-Host ""
        Write-Host "Reconstruction terminée. Application disponible sur http://localhost:8080" -ForegroundColor Green
    }

    "logs" {
        $service = switch ($Target.ToLower()) {
            "front"   { "frontend" }
            "back"    { "backend" }
            "db"      { "postgres" }
            "nginx"   { "nginx" }
            default   { "" }
        }
        $titleSuffix = if ($service) { " - $service" } else { "" }
        Write-Title "Logs en direct$titleSuffix"
        if ($service) {
            Run-Compose "logs -f $service"
        } else {
            Run-Compose "logs -f"
        }
    }

    "status" {
        Write-Title "État des conteneurs"
        Run-Compose "ps"
    }

    "reset" {
        Write-Host ""
        Write-Host "ATTENTION : cette commande supprime tous les conteneurs ET les données (base de données)." -ForegroundColor Red
        $confirm = Read-Host "Confirmer ? (oui/non)"
        if ($confirm -eq "oui") {
            Write-Title "Suppression complète"
            Run-Compose "down -v --remove-orphans"
            Write-Host "Tout a été supprimé. Relancez avec : .\sgrh.ps1 start" -ForegroundColor Yellow
        } else {
            Write-Host "Annulé." -ForegroundColor Gray
        }
    }

    default {
        Write-Host ""
        Write-Host "Usage : .\sgrh.ps1 <commande> [cible]" -ForegroundColor White
        Write-Host ""
        Write-Host "Commandes disponibles :" -ForegroundColor Cyan
        Write-Host "  start              Démarrer l'application"
        Write-Host "  stop               Arrêter l'application"
        Write-Host "  restart            Redémarrer tous les services"
        Write-Host "  rebuild            Reconstruire tout après un changement de code"
        Write-Host "  rebuild front      Reconstruire uniquement le frontend"
        Write-Host "  rebuild back       Reconstruire uniquement le backend"
        Write-Host "  logs               Afficher tous les logs en direct"
        Write-Host "  logs front         Logs du frontend"
        Write-Host "  logs back          Logs du backend"
        Write-Host "  logs db            Logs de la base de données"
        Write-Host "  status             État des conteneurs"
        Write-Host "  reset              Tout supprimer (EFFACE LA BASE DE DONNÉES)"
        Write-Host ""
    }
}
