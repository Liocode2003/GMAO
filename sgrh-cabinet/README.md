# SGRH Cabinet

**Système de Gestion des Ressources Humaines** pour cabinet d'audit (type Forvis Mazars).

## Fonctionnalités

- **Module Personnel** — Fiches collaborateurs complètes avec calcul d'ancienneté, détection de doublons, historique des modifications
- **Tableau de bord** — KPIs en temps réel, graphiques, widget anniversaires et contrats à renouveler
- **KPIs avancés** — Effectifs, formations (INTRA/INTERNE/AOC/GROUPE), diplômes, grades, turnover/attrition, YTD + TARGET
- **Alertes automatiques** — Anniversaires (J-1 et J), échéances CDD (J-60, J-30) et stages (J-15) via cron jobs + email
- **Rapports Excel** — Génération automatique mensuelle du 1er au 5 du mois (4 onglets : KPI, Effectifs, Formations)
- **Gestion des droits** — 5 rôles (DRH, Direction, Associé, Manager, Utilisateur), journal d'audit complet

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 18 + TypeScript + Tailwind CSS + Recharts |
| Backend | Node.js + Express + TypeScript |
| Base de données | PostgreSQL 15 |
| Auth | JWT (access + refresh tokens) |
| Emails | Nodemailer (SMTP) |
| Rapports | ExcelJS (xlsx) |
| Scheduler | node-cron |
| Déploiement | Docker + Docker Compose + Nginx |

---

## Installation rapide (VPS OVH Ubuntu 22.04)

### 1. Prérequis

```bash
# Installer Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Installer Docker Compose v2
sudo apt install docker-compose-plugin
```

### 2. Cloner et configurer

```bash
git clone <your-repo> sgrh-cabinet
cd sgrh-cabinet

# Créer le fichier .env
cp .env.example .env
nano .env  # Remplir toutes les valeurs
```

### 3. Variables obligatoires à modifier dans `.env`

```
DB_PASSWORD=       # Mot de passe PostgreSQL fort
JWT_SECRET=        # Clé secrète JWT (openssl rand -base64 48)
SMTP_HOST=         # Serveur SMTP
SMTP_USER=         # Email expéditeur
SMTP_PASS=         # Mot de passe SMTP
```

### 4. Démarrer

```bash
docker compose up -d --build
```

L'application sera disponible sur `http://votre-ip` (port 80).

### 5. Vérifier

```bash
docker compose ps              # Vérifier les services
docker compose logs backend    # Logs backend
curl http://localhost/health   # Health check
```

---

## Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| DRH | drh@cabinet.ci | Admin123! |
| Direction Générale | dg@cabinet.ci | Admin123! |
| Associé | associe@cabinet.ci | Admin123! |
| Manager | manager@cabinet.ci | Admin123! |
| Utilisateur | user@cabinet.ci | Admin123! |

> **Important** : Changez tous ces mots de passe en production !

---

## Configuration SMTP

### Gmail
1. Activer la validation en 2 étapes sur votre compte Google
2. Créer un "Mot de passe d'application" : Compte → Sécurité → Mots de passe d'application
3. Utiliser ce mot de passe dans `SMTP_PASS`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
```

### OVH
```env
SMTP_HOST=ssl0.ovh.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=contact@votre-domaine.com
SMTP_PASS=votre_mdp_email
```

---

## Structure des dossiers

```
sgrh-cabinet/
├── backend/                 # API Node.js + Express
│   ├── src/
│   │   ├── config/          # Database, config
│   │   ├── controllers/     # auth, employees, kpis, trainings, users
│   │   ├── jobs/            # Cron jobs (scheduler)
│   │   ├── middleware/       # Auth, audit
│   │   ├── routes/          # Routes API
│   │   ├── services/        # Email, Excel report
│   │   ├── types/           # TypeScript types
│   │   └── index.ts         # Point d'entrée
│   └── Dockerfile
├── frontend/                # React SPA
│   ├── src/
│   │   ├── components/      # Layout, UI
│   │   ├── pages/           # Dashboard, Personnel, KPIs, etc.
│   │   ├── services/        # API client (axios)
│   │   ├── store/           # Zustand (auth)
│   │   └── types/           # TypeScript types
│   ├── Dockerfile
│   └── nginx.conf
├── database/
│   ├── init.sql             # Schéma PostgreSQL
│   └── seeds/demo_data.sql  # Données de démo
├── nginx/
│   └── nginx.conf           # Config Nginx reverse proxy
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Accès aux données sensibles

| Donnée | Rôles autorisés |
|--------|----------------|
| Salaire | DRH, Direction Générale, Associé |
| Date de naissance | DRH, Direction Générale, Associé, Manager |
| Rapports Excel | DRH, Direction Générale |
| Gestion utilisateurs | DRH, Direction Générale |
| Journal d'audit | DRH, Direction Générale |

Tous les accès aux données sensibles sont tracés dans le journal d'audit (qui, quoi, quand, IP).

---

## Cron Jobs (alertes automatiques)

| Tâche | Fréquence | Description |
|-------|-----------|-------------|
| Anniversaires | Quotidien 8h00 | Alerte J-1 et J (email DRH) |
| Contrats | Quotidien 9h00 | CDD à J-60 et J-30, Stages à J-15 |
| Rapport mensuel | 1-5 du mois 7h00 | Génération + envoi rapport Excel |

---

## Mise à jour

```bash
cd sgrh-cabinet
git pull origin main
docker compose down
docker compose up -d --build
```

---

## Sauvegarde PostgreSQL

```bash
# Backup
docker exec sgrh_postgres pg_dump -U sgrh_user sgrh_cabinet > backup_$(date +%Y%m%d).sql

# Restore
cat backup_20240101.sql | docker exec -i sgrh_postgres psql -U sgrh_user sgrh_cabinet
```

---

## Dépannage

```bash
# Voir les logs en temps réel
docker compose logs -f backend

# Redémarrer un service
docker compose restart backend

# Accéder à la BDD
docker exec -it sgrh_postgres psql -U sgrh_user sgrh_cabinet

# Vérifier les cron jobs
docker compose exec backend sh -c "ps aux | grep node"
```
