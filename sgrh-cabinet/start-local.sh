#!/bin/bash
set -e

echo "🚀 SGRH Cabinet — Démarrage local"

# Créer le .env si absent
if [ ! -f .env ]; then
  cat > .env << 'EOF'
DB_PASSWORD=sgrh_local_pass
JWT_SECRET=dev_secret_sgrh_cabinet_local_32chars_min
JWT_EXPIRES_IN=8h
HTTP_PORT=8080
HTTPS_PORT=8443
LOG_LEVEL=debug
EOF
  echo "✅ .env créé"
fi

# Créer le dossier ssl si absent
mkdir -p nginx/ssl

# Lancer
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build

echo ""
echo "✅ Application disponible sur http://localhost:8080"
echo ""
echo "Comptes de démo:"
echo "  DRH     → drh@cabinet.ci / Admin123!"
echo "  Manager → manager@cabinet.ci / Admin123!"
echo ""
echo "Logs: docker compose logs -f"
echo "Stop: docker compose down"
