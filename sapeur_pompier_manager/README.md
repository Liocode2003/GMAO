# Gestion des Livrets Sanitaires - Sapeurs-Pompiers

## 📋 Description

Application desktop complète (Windows/macOS/Linux) pour la gestion numérique des livrets sanitaires des sapeurs-pompiers au Burkina Faso. Ce logiciel remplace le système papier traditionnel par une solution moderne avec base de données locale, export PDF, et génération automatique de statistiques.

## 🎯 Fonctionnalités principales

### ✅ Gestion des dossiers
- Création, modification, suppression de dossiers de sapeurs-pompiers
- Système de matricules uniques
- Recherche avancée et filtres
- Historique des modifications

### 📝 Sections du livret sanitaire
1. **État civil** - Informations personnelles et contacts d'urgence
2. **Constantes** - Taille, poids, IMC, périmètres (avec calcul automatique)
3. **Examen d'incorporation** - Antécédents, examens cliniques, profil SIGYCOP
4. **Opérations (OPEX/OPINT)** - Jusqu'à 6 séjours opérationnels
5. **Vaccinations** - Historique avec alertes de rappel automatiques
6. **Visites sanitaires** - Suivi médical régulier
7. **Indisponibilités** - Périodes d'arrêt maladie/blessure
8. **Certificats** - Upload et gestion de documents PDF/images
9. **Décisions de réforme** - Commissions médicales
10. **Contrôle de fin de service** - Examen médical final

### 📊 Statistiques et graphiques
- Dashboard avec KPIs (effectifs, aptitudes, vaccinations)
- Graphique d'évolution du poids sur 39 ans
- Répartition apte/inapte
- Alertes vaccinations expirées

### 🔒 Sécurité
- Authentification par login/mot de passe (hashage bcrypt)
- 3 rôles : Administrateur, Médecin, Consultation
- Logs d'accès détaillés
- Chiffrement des données sensibles
- Auto-logout après 30 min d'inactivité

### 📄 Export PDF
- Génération de PDF identique au livret papier
- Export complet ou par section
- Mise en page professionnelle avec logo

### 💾 Backup & Restore
- Sauvegarde automatique quotidienne
- Sauvegarde manuelle à la demande
- Restauration depuis fichier .db
- Rotation automatique (30 derniers jours)

## 🏗️ Architecture

Le projet suit une **Clean Architecture** avec 3 couches :

```
lib/
├── core/                     # Utilitaires partagés
│   ├── constants/            # Couleurs, textes
│   ├── errors/               # Gestion des erreurs
│   ├── utils/                # Validators, formatters
│   └── widgets/              # Composants réutilisables
│
├── domain/                   # Logique métier
│   ├── entities/             # Objets métier purs
│   ├── repositories/         # Interfaces
│   └── usecases/             # Cas d'usage
│
├── data/                     # Couche données
│   ├── datasources/          # SQLite, fichiers
│   ├── models/               # Models avec JSON
│   └── repositories/         # Implémentations
│
└── presentation/             # Interface utilisateur
    ├── providers/            # State management (Riverpod)
    ├── screens/              # Écrans de l'app
    └── widgets/              # Composants UI
```

## 📦 Technologies utilisées

- **Framework** : Flutter 3.x (Desktop)
- **Language** : Dart
- **Base de données** : SQLite (sqflite_common_ffi)
- **State Management** : Riverpod
- **PDF** : pdf + printing packages
- **Graphiques** : fl_chart
- **Authentification** : bcrypt
- **Architecture** : Clean Architecture avec Either (dartz)

## 🚀 Installation et compilation

### Prérequis
- Flutter SDK 3.x ou supérieur
- Dart SDK 3.x ou supérieur
- Visual Studio 2022 (Windows) / Xcode (macOS) / Build essentials (Linux)

### Installation

1. **Cloner le repository**
```bash
git clone <repository-url>
cd sapeur_pompier_manager
```

2. **Installer les dépendances**
```bash
flutter pub get
```

3. **Vérifier la configuration desktop**
```bash
flutter config --enable-windows-desktop
flutter config --enable-macos-desktop
flutter config --enable-linux-desktop
```

### Compilation

#### Windows (.exe)
```bash
flutter build windows --release
```
L'exécutable sera dans : `build/windows/runner/Release/sapeur_pompier_manager.exe`

#### macOS (.app)
```bash
flutter build macos --release
```
L'application sera dans : `build/macos/Build/Products/Release/`

#### Linux
```bash
flutter build linux --release
```
L'exécutable sera dans : `build/linux/x64/release/bundle/`

### Exécution en mode développement

```bash
flutter run -d windows    # Windows
flutter run -d macos      # macOS
flutter run -d linux      # Linux
```

## 📚 Structure de la base de données

### Tables principales

- `sapeurs_pompiers` - Dossiers principaux
- `etat_civil` - État civil et contacts
- `constantes` - Mesures physiques
- `historique_poids` - Évolution du poids
- `examens_incorporation` - Examens médicaux d'entrée
- `operations` - Opérations OPEX/OPINT
- `vaccinations` - Historique vaccinal
- `visites_sanitaires` - Visites médicales
- `indisponibilites` - Arrêts maladie
- `certificats` - Documents scannés
- `decisions_reforme` - Décisions commissions
- `controles_fin_service` - Examens de sortie
- `users` - Utilisateurs du système
- `access_logs` - Logs d'accès
- `settings` - Paramètres application

### Localisation de la base de données

- **Windows** : `C:\Users\<Username>\Documents\sapeur_pompier_db.sqlite`
- **macOS** : `~/Documents/sapeur_pompier_db.sqlite`
- **Linux** : `~/Documents/sapeur_pompier_db.sqlite`

## 👤 Utilisateur par défaut

Au premier lancement, un compte administrateur est créé :

- **Nom d'utilisateur** : `admin`
- **Mot de passe** : `admin123`

⚠️ **Important** : Changez ce mot de passe immédiatement après la première connexion !

## 🎨 Interface utilisateur

### Palette de couleurs
- **Primaire** : Rouge pompier (#D32F2F)
- **Secondaire** : Bleu (#1976D2)
- **Succès** : Vert (#388E3C)
- **Warning** : Orange (#F57C00)
- **Erreur** : Rouge foncé (#C62828)

### Layout
- Sidebar gauche : Navigation (250px)
- Zone centrale : Contenu principal
- Top bar : Titre + info utilisateur + logout

## 📖 Guide d'utilisation

### 1. Première connexion
1. Lancer l'application
2. Se connecter avec `admin` / `admin123`
3. Changer le mot de passe dans Paramètres → Profil

### 2. Créer un nouveau dossier
1. Cliquer sur "Nouveau dossier"
2. Remplir l'état civil (obligatoire)
3. Suivre le wizard étape par étape
4. Valider la création

### 3. Remplir le livret
1. Sélectionner un sapeur-pompier dans la liste
2. Cliquer sur une section du menu latéral
3. Remplir les champs
4. Cliquer sur "Enregistrer"

### 4. Exporter en PDF
1. Ouvrir un dossier
2. Cliquer sur "Exporter en PDF"
3. Choisir le format (complet ou section)
4. Sélectionner le dossier de destination

### 5. Gérer les utilisateurs (Admin)
1. Menu : Gestion des utilisateurs
2. Créer un nouvel utilisateur
3. Attribuer un rôle (Admin/Médecin/Consultation)
4. Définir un mot de passe temporaire

### 6. Sauvegardes
- **Automatique** : Tous les jours à 23h00
- **Manuelle** : Paramètres → Sauvegardes → "Sauvegarder maintenant"
- **Restaurer** : Paramètres → Sauvegardes → "Restaurer" → Sélectionner fichier .db

## 🔔 Système d'alertes

### Types d'alertes
- 🔴 **Vaccinations expirées** : Date de rappel dépassée
- 🟡 **Vaccinations proches** : Rappel dans moins de 30 jours
- 🟠 **Visites en retard** : Pas de visite depuis >365 jours
- 🔵 **Fin d'inaptitude** : Période d'inaptitude terminée

### Affichage
- Compteur sur le dashboard
- Notification dans la liste des SP concernés
- Détail dans la fiche individuelle

## 🛠️ Développement

### Structure du code

#### Entities (domain/entities/)
Classes métier pures sans dépendances :
- `SapeurPompier` - Entité principale
- `EtatCivil` - État civil
- `Vaccination` - Vaccin
- etc.

#### Repositories (domain/repositories/)
Interfaces définissant les contrats :
- `SapeurPompierRepository`
- `AuthRepository`

#### UseCases (domain/usecases/)
Logique métier encapsulée :
- `CreateSapeurPompier`
- `GetAllSapeursPompiers`
- `LoginUser`
- etc.

#### Models (data/models/)
Implémentations avec JSON :
- `SapeurPompierModel extends SapeurPompier`
- Méthodes `fromJson()` et `toJson()`

#### Providers (presentation/providers/)
State management avec Riverpod :
- `sapeurPompierProvider`
- `authProvider`
- `dashboardProvider`

### Ajouter une nouvelle fonctionnalité

1. **Créer l'entity** dans `domain/entities/`
2. **Ajouter au repository** interface dans `domain/repositories/`
3. **Créer le usecase** dans `domain/usecases/`
4. **Créer le model** dans `data/models/`
5. **Implémenter dans le repository** dans `data/repositories/`
6. **Créer le provider** dans `presentation/providers/`
7. **Créer le screen** dans `presentation/screens/`

## 📝 État actuel du projet

### ✅ Complété (Phase 1)
- [x] Structure du projet Flutter Desktop
- [x] Architecture Clean complète (Domain Layer)
- [x] Toutes les entities métier (12 entities)
- [x] Interfaces repositories
- [x] UseCases principaux
- [x] Base de données SQLite complète (13 tables)
- [x] Utilitaires (validators, formatters, errors)
- [x] Constantes (couleurs, textes en français)
- [x] Système de backup/restore

### 🚧 En cours (Phase 2)
- [ ] Models avec fromJson/toJson (10 models)
- [ ] Implémentation des repositories
- [ ] Auth local datasource avec bcrypt

### ⏳ À faire (Phase 3)
- [ ] Providers Riverpod pour state management
- [ ] Écran de login
- [ ] Dashboard avec statistiques
- [ ] Liste des sapeurs-pompiers
- [ ] Wizard de création
- [ ] 10 écrans du livret
- [ ] Système de graphiques (fl_chart)
- [ ] Générateur PDF complet
- [ ] Écran de paramètres
- [ ] Écran de gestion utilisateurs
- [ ] Widgets réutilisables (sidebar, topbar)
- [ ] main.dart avec routing
- [ ] Données de test

## 🤝 Contribution

### Guidelines
1. Suivre Clean Architecture
2. Respecter les conventions Dart/Flutter
3. Commenter en français
4. Tester avant de commit
5. Utiliser des messages de commit descriptifs

### Branches
- `main` - Production stable
- `develop` - Développement en cours
- `feature/*` - Nouvelles fonctionnalités
- `bugfix/*` - Corrections de bugs

## 📄 Licence

Ce projet est développé pour le Service des Sapeurs-Pompiers du Burkina Faso.
Tous droits réservés.

## 👥 Auteurs

- Développement initial : Claude AI
- Client : Service des Sapeurs-Pompiers - Burkina Faso

## 📞 Support

Pour toute question ou problème :
- Créer une issue sur GitHub
- Contacter l'administrateur système

---

**Version** : 1.0.0
**Dernière mise à jour** : Février 2024
**Status** : En développement actif
