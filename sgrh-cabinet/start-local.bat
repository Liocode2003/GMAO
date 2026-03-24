@echo off
echo SGRH Cabinet -- Demarrage local

:: Créer le .env si absent
if not exist .env (
    (
        echo DB_PASSWORD=sgrh_local_pass
        echo JWT_SECRET=dev_secret_sgrh_cabinet_local_32chars_min
        echo JWT_EXPIRES_IN=8h
        echo HTTP_PORT=8080
        echo HTTPS_PORT=8443
        echo LOG_LEVEL=debug
    ) > .env
    echo .env cree
)

:: Créer le dossier ssl si absent
if not exist nginx\ssl mkdir nginx\ssl

:: Lancer Docker Compose
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build

echo.
echo Application disponible sur http://localhost:8080
echo.
echo Comptes de demo:
echo   DRH     -- drh@cabinet.ci / Admin123!
echo   Manager -- manager@cabinet.ci / Admin123!
echo.
echo Logs : docker compose logs -f
echo Stop : docker compose down

pause
