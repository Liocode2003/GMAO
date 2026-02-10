# Guide d'Administration — GMAO Sapeurs-Pompiers

> **Version :** 1.0.0  
> **Dernière mise à jour :** Février 2026  
> **Public cible :** Administrateurs système et responsables informatiques

---

## Table des matières

1. [Installation et Configuration](#1-installation-et-configuration)
2. [Gestion des Utilisateurs](#2-gestion-des-utilisateurs)
3. [Gestion des Sauvegardes](#3-gestion-des-sauvegardes)
4. [Paramètres de Sécurité](#4-paramètres-de-sécurité)
5. [Résolution des Problèmes](#5-résolution-des-problèmes)
6. [Procédures de Maintenance](#6-procédures-de-maintenance)

---

## 1. Installation et Configuration

### 1.1 Prérequis système

| Composant | Version minimale | Recommandée |
|-----------|-----------------|-------------|
| Système d'exploitation | Ubuntu 20.04 / Windows 10 | Ubuntu 22.04 / Windows 11 |
| Flutter SDK | 3.16.0 | 3.19.0 |
| Dart SDK | 3.2.0 | 3.3.0 |
| RAM | 4 Go | 8 Go |
| Espace disque | 2 Go | 10 Go |

### 1.2 Installation de l'application

#### Sur Linux (Ubuntu/Debian)

```bash
# 1. Cloner le dépôt
git clone https://github.com/votre-organisation/gmao-sapeurs-pompiers.git
cd gmao-sapeurs-pompiers/sapeur_pompier_manager

# 2. Installer les dépendances Flutter
flutter pub get

# 3. Compiler pour Linux
flutter build linux --release

# 4. L'exécutable se trouve dans :
# build/linux/x64/release/bundle/sapeur_pompier_manager
```

#### Sur Windows

```powershell
# 1. Cloner le dépôt
git clone https://github.com/votre-organisation/gmao-sapeurs-pompiers.git
cd gmao-sapeurs-pompiers\sapeur_pompier_manager

# 2. Installer les dépendances
flutter pub get

# 3. Compiler pour Windows
flutter build windows --release

# L'exécutable se trouve dans :
# build\windows\x64\runner\Release\sapeur_pompier_manager.exe
```

### 1.3 Configuration initiale

Au premier lancement, l'application crée automatiquement sa base de données SQLite dans le répertoire de données utilisateur :

| OS | Chemin de la base de données |
|----|------------------------------|
| Linux | `~/.local/share/sapeur_pompier_manager/gmao.db` |
| Windows | `%APPDATA%\sapeur_pompier_manager\gmao.db` |
| macOS | `~/Library/Application Support/sapeur_pompier_manager/gmao.db` |

### 1.4 Variables d'environnement

Créer un fichier `.env` à la racine du projet (non versionné) :

```ini
# Environnement (development | staging | production)
APP_ENV=production

# Délai d'expiration de session (en minutes)
SESSION_TIMEOUT_MINUTES=30

# Chemin de sauvegarde automatique
BACKUP_PATH=/opt/gmao/backups

# Niveau de journalisation (debug | info | warning | error)
LOG_LEVEL=info
```

---

## 2. Gestion des Utilisateurs

### 2.1 Rôles et permissions

| Rôle | Description | Permissions |
|------|-------------|-------------|
| `admin` | Administrateur système | Accès complet, gestion des utilisateurs |
| `medecin` | Médecin contrôleur | Lecture/écriture sur livrets médicaux |
| `responsable` | Responsable RH | Lecture/écriture état civil, opérations |
| `consultation` | Accès lecture seule | Lecture seule sur tous les modules |

### 2.2 Créer un utilisateur

1. Connectez-vous avec un compte administrateur
2. Accédez à **Paramètres > Gestion des utilisateurs**
3. Cliquez sur **Nouvel utilisateur**
4. Renseignez les champs obligatoires :
   - Nom d'utilisateur (unique, sans espaces)
   - Adresse e-mail
   - Rôle
5. Un mot de passe temporaire est généré et doit être changé à la première connexion

Via la CLI (si disponible) :

```bash
# Créer un utilisateur avec le rôle medecin
./gmao-cli user create \
  --username "dr.dupont" \
  --email "dupont@sdis.fr" \
  --role "medecin" \
  --force-password-change
```

### 2.3 Modifier un utilisateur

1. Accédez à **Paramètres > Gestion des utilisateurs**
2. Cliquez sur le nom de l'utilisateur à modifier
3. Modifiez les champs souhaités
4. Cliquez sur **Enregistrer**

> **Attention :** La modification du rôle prend effet immédiatement. L'utilisateur devra se reconnecter pour que les nouvelles permissions s'appliquent.

### 2.4 Désactiver / Réactiver un utilisateur

La désactivation d'un compte empêche toute connexion sans supprimer l'historique des actions.

```bash
# Désactiver un utilisateur
./gmao-cli user disable --username "dr.dupont"

# Réactiver un utilisateur
./gmao-cli user enable --username "dr.dupont"

# Lister tous les utilisateurs désactivés
./gmao-cli user list --status disabled
```

Depuis l'interface :
1. Accédez à **Paramètres > Gestion des utilisateurs**
2. Cliquez sur l'icône de statut (vert = actif / gris = inactif)
3. Confirmez l'action dans la boîte de dialogue

### 2.5 Réinitialiser un mot de passe

```bash
# Générer un nouveau mot de passe temporaire
./gmao-cli user reset-password --username "dr.dupont"
# → Nouveau mot de passe temporaire : Xy7#mP2kL9
```

L'utilisateur devra changer ce mot de passe à la prochaine connexion.

---

## 3. Gestion des Sauvegardes

### 3.1 Types de sauvegarde

| Type | Fréquence recommandée | Description |
|------|-----------------------|-------------|
| Complète | Hebdomadaire | Sauvegarde intégrale de la base de données et des fichiers |
| Incrémentale | Quotidienne | Uniquement les modifications depuis la dernière sauvegarde |
| Manuelle | À la demande | Avant toute opération critique |

### 3.2 Sauvegarde manuelle

#### Depuis l'interface

1. Accédez à **Paramètres > Sauvegardes**
2. Cliquez sur **Créer une sauvegarde maintenant**
3. Choisissez le répertoire de destination
4. Attendez la confirmation de succès

#### Via script (Linux)

```bash
#!/bin/bash
# backup_gmao.sh — Sauvegarde complète de la GMAO

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/gmao/backups"
DB_PATH="$HOME/.local/share/sapeur_pompier_manager/gmao.db"
ARCHIVE_NAME="gmao_backup_${DATE}.tar.gz"

# Créer le répertoire de sauvegarde
mkdir -p "$BACKUP_DIR"

# Copier et compresser la base de données
sqlite3 "$DB_PATH" ".backup /tmp/gmao_backup_${DATE}.db"
tar -czf "${BACKUP_DIR}/${ARCHIVE_NAME}" \
  -C /tmp "gmao_backup_${DATE}.db" \
  -C "$HOME/.local/share/sapeur_pompier_manager" "uploads/"

# Supprimer la copie temporaire
rm "/tmp/gmao_backup_${DATE}.db"

echo "Sauvegarde créée : ${BACKUP_DIR}/${ARCHIVE_NAME}"
```

```bash
# Rendre le script exécutable et l'ajouter au cron (quotidien à 2h00)
chmod +x backup_gmao.sh
crontab -e
# Ajouter la ligne :
# 0 2 * * * /opt/gmao/scripts/backup_gmao.sh >> /var/log/gmao_backup.log 2>&1
```

### 3.3 Procédure de restauration

> **Avertissement :** La restauration écrase toutes les données actuelles. Effectuez une sauvegarde de l'état actuel avant de restaurer.

```bash
#!/bin/bash
# restore_gmao.sh — Restauration depuis une sauvegarde

BACKUP_FILE="$1"  # Chemin vers l'archive .tar.gz
DB_DEST="$HOME/.local/share/sapeur_pompier_manager/gmao.db"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore_gmao.sh <chemin_vers_archive.tar.gz>"
  exit 1
fi

# Arrêter l'application si elle tourne
pkill -f "sapeur_pompier_manager" 2>/dev/null

# Sauvegarder la base actuelle
cp "$DB_DEST" "${DB_DEST}.before_restore_$(date +%Y%m%d_%H%M%S)"

# Extraire l'archive
TEMP_DIR=$(mktemp -d)
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Restaurer la base de données
cp "$TEMP_DIR"/*.db "$DB_DEST"

# Restaurer les fichiers uploads si présents
if [ -d "$TEMP_DIR/uploads" ]; then
  cp -r "$TEMP_DIR/uploads/" \
    "$HOME/.local/share/sapeur_pompier_manager/"
fi

rm -rf "$TEMP_DIR"
echo "Restauration terminée avec succès."
```

### 3.4 Vérification de l'intégrité d'une sauvegarde

```bash
# Vérifier l'intégrité de la base SQLite
sqlite3 /tmp/gmao_restaure.db "PRAGMA integrity_check;"
# Résultat attendu : ok

# Vérifier la taille des tables
sqlite3 /tmp/gmao_restaure.db "
  SELECT name, COUNT(*) as nb_enregistrements
  FROM sqlite_master
  JOIN (SELECT * FROM sqlite_master) sub ON sqlite_master.name = sub.tbl_name
  WHERE type='table'
  GROUP BY name;
"
```

---

## 4. Paramètres de Sécurité

### 4.1 Politique de mots de passe

Les règles suivantes sont configurables dans **Paramètres > Sécurité** :

| Paramètre | Valeur par défaut | Recommandation |
|-----------|-------------------|----------------|
| Longueur minimale | 8 caractères | 12 caractères |
| Majuscules requises | Oui | Oui |
| Chiffres requis | Oui | Oui |
| Caractères spéciaux | Non | Oui |
| Expiration du mot de passe | 90 jours | 60 jours |
| Historique (réutilisation) | 5 derniers | 10 derniers |
| Tentatives avant blocage | 5 | 3 |

### 4.2 Délai d'expiration de session

Le délai d'inactivité avant déconnexion automatique est configurable :

```ini
# Dans .env ou dans l'interface Paramètres > Sécurité
SESSION_TIMEOUT_MINUTES=30   # Recommandé : 15–30 minutes
SESSION_MAX_DURATION_HOURS=8 # Durée maximale même avec activité
```

L'utilisateur est averti 5 minutes avant l'expiration de sa session avec la possibilité de prolonger.

### 4.3 Chiffrement des données sensibles

Les données médicales sont chiffrées en base de données avec AES-256 :

```bash
# Vérifier que le chiffrement est activé
sqlite3 ~/.local/share/sapeur_pompier_manager/gmao.db "PRAGMA cipher_version;"
```

La clé de chiffrement est dérivée du mot de passe administrateur principal et stockée dans le trousseau système (Keychain / GNOME Keyring).

### 4.4 Journal d'audit

Toutes les actions sensibles sont journalisées :

- Connexions/déconnexions
- Modifications des données médicales
- Exports de données
- Changements de configuration

Consultation des journaux :

```bash
# Journaux d'application
cat ~/.local/share/sapeur_pompier_manager/logs/audit.log

# Filtrer par utilisateur
grep "username=dr.dupont" ~/.local/share/sapeur_pompier_manager/logs/audit.log

# Filtrer par date
grep "2026-02-10" ~/.local/share/sapeur_pompier_manager/logs/audit.log
```

### 4.5 Contrôle d'accès réseau

Si l'application est déployée en mode serveur (futur) :

```bash
# Restreindre l'accès au pare-feu (exemple UFW)
ufw allow from 192.168.1.0/24 to any port 8080
ufw deny 8080
ufw enable
```

---

## 5. Résolution des Problèmes

### 5.1 L'application ne démarre pas

**Symptôme :** L'application se ferme immédiatement au lancement.

**Vérifications :**

```bash
# Vérifier les droits sur la base de données
ls -la ~/.local/share/sapeur_pompier_manager/

# Vérifier l'intégrité de la base
sqlite3 ~/.local/share/sapeur_pompier_manager/gmao.db "PRAGMA integrity_check;"

# Consulter les logs d'erreur
cat ~/.local/share/sapeur_pompier_manager/logs/error.log
```

**Solution courante :** Supprimer le fichier de verrouillage si présent :

```bash
rm -f ~/.local/share/sapeur_pompier_manager/gmao.db-wal
rm -f ~/.local/share/sapeur_pompier_manager/gmao.db-shm
```

### 5.2 Impossible de se connecter

**Symptôme :** Le message "Identifiants incorrects" s'affiche malgré les bons identifiants.

| Cause probable | Solution |
|----------------|----------|
| Compte verrouillé après échecs | Réinitialiser via `./gmao-cli user unlock --username "..."` |
| Session expirée | Attendre 15 minutes et réessayer |
| Base de données corrompue | Restaurer depuis la dernière sauvegarde |

### 5.3 Données manquantes après mise à jour

**Symptôme :** Des enregistrements semblent avoir disparu après une mise à jour.

```bash
# Vérifier les migrations de base de données
./gmao-cli db migrate --status

# Forcer l'exécution des migrations manquantes
./gmao-cli db migrate --run-pending

# Vérifier le nombre d'enregistrements
sqlite3 ~/.local/share/sapeur_pompier_manager/gmao.db "
  SELECT 'Sapeurs-pompiers' as table_name, COUNT(*) FROM sapeurs_pompiers
  UNION ALL
  SELECT 'Livrets', COUNT(*) FROM livrets
  UNION ALL
  SELECT 'Visites sanitaires', COUNT(*) FROM visites_sanitaires;
"
```

### 5.4 Performance dégradée

**Symptôme :** L'application est lente, les listes mettent plusieurs secondes à charger.

```bash
# Optimiser la base de données SQLite
sqlite3 ~/.local/share/sapeur_pompier_manager/gmao.db "VACUUM; ANALYZE;"

# Vérifier la taille de la base
du -sh ~/.local/share/sapeur_pompier_manager/gmao.db

# Reconstruire les index
sqlite3 ~/.local/share/sapeur_pompier_manager/gmao.db "REINDEX;"
```

### 5.5 Images/signatures non affichées

**Symptôme :** Les photos et signatures apparaissent avec une icône d'erreur.

```bash
# Vérifier l'existence des fichiers référencés
sqlite3 ~/.local/share/sapeur_pompier_manager/gmao.db "
  SELECT signature_path FROM livrets WHERE signature_path IS NOT NULL;
" | while read path; do
  [ -f "$path" ] || echo "MANQUANT: $path"
done
```

---

## 6. Procédures de Maintenance

### 6.1 Maintenance mensuelle

- [ ] Vérifier l'intégrité de la base de données : `sqlite3 gmao.db "PRAGMA integrity_check;"`
- [ ] Optimiser la base : `VACUUM; ANALYZE;`
- [ ] Archiver les journaux du mois précédent
- [ ] Tester la procédure de restauration depuis une sauvegarde
- [ ] Vérifier les comptes utilisateurs inactifs depuis plus de 90 jours
- [ ] Contrôler l'espace disque disponible

### 6.2 Mise à jour de l'application

```bash
# 1. Sauvegarder avant toute mise à jour
./backup_gmao.sh

# 2. Récupérer la nouvelle version
git pull origin main

# 3. Mettre à jour les dépendances
flutter pub get

# 4. Exécuter les migrations de base de données
./gmao-cli db migrate

# 5. Recompiler l'application
flutter build linux --release  # ou windows

# 6. Redémarrer le service
systemctl restart gmao-sapeur-pompier  # si déployé comme service
```

### 6.3 Archivage des données

Les données des sapeurs-pompiers radiés depuis plus de 5 ans peuvent être archivées :

```bash
# Lister les sapeurs-pompiers radiés depuis plus de 5 ans
./gmao-cli sp list \
  --status radiation \
  --date-before $(date -d "5 years ago" +%Y-%m-%d)

# Archiver (exporter en JSON + supprimer de la base active)
./gmao-cli sp archive \
  --status radiation \
  --date-before $(date -d "5 years ago" +%Y-%m-%d) \
  --output /opt/gmao/archives/
```

### 6.4 Surveillance des sauvegardes

Créer une alerte si la sauvegarde quotidienne n'a pas été effectuée :

```bash
#!/bin/bash
# check_backup.sh — Vérification quotidienne des sauvegardes

BACKUP_DIR="/opt/gmao/backups"
MAX_AGE_HOURS=26  # Alerte si pas de sauvegarde depuis 26 heures

LATEST=$(find "$BACKUP_DIR" -name "gmao_backup_*.tar.gz" \
  -mtime -1 | sort | tail -n 1)

if [ -z "$LATEST" ]; then
  echo "ALERTE : Aucune sauvegarde GMAO détectée dans les dernières ${MAX_AGE_HOURS}h"
  # Envoyer un e-mail d'alerte
  # mail -s "[ALERTE] Sauvegarde GMAO manquante" admin@sdis.fr < /dev/null
  exit 1
else
  echo "OK : Dernière sauvegarde : $LATEST"
fi
```

### 6.5 Procédure d'urgence (reprise après sinistre)

En cas de perte totale du serveur :

1. **Installer Flutter** sur la nouvelle machine (voir section 1.1)
2. **Récupérer la sauvegarde** la plus récente depuis le stockage distant
3. **Recompiler l'application** depuis les sources (`git clone` + `flutter build`)
4. **Restaurer la base de données** avec `restore_gmao.sh`
5. **Vérifier l'intégrité** avec `PRAGMA integrity_check;`
6. **Relancer l'application** et vérifier l'accès avec un compte test
7. **Informer les utilisateurs** de la reprise d'activité

---

## Contacts et support

| Rôle | Contact |
|------|---------|
| Support technique | support-informatique@sdis.fr |
| Urgence base de données | dba@sdis.fr |
| Responsable applicatif | gmao-admin@sdis.fr |

---

*Ce document est confidentiel et destiné uniquement aux administrateurs autorisés.*
