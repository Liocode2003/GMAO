# 🔥 Guide Utilisateur — Gestion des Livrets Sanitaires SPR
## Système de Gestion des Dossiers Médicaux des Sapeurs-Pompiers
### Direction Générale de la Protection Civile — Burkina Faso

---

```
╔══════════════════════════════════════════════════════════════════╗
║   🇧🇫  GESTION LIVRETS SANITAIRES SPR  🇧🇫                      ║
║   Direction Générale de la Protection Civile                     ║
║   Version 1.0.0 — © 2024 Service des Sapeurs-Pompiers           ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 📋 Table des matières

1. [Installation et premier lancement](#1-installation-et-premier-lancement)
2. [Connexion](#2-connexion)
3. [Dashboard — Tableau de bord](#3-dashboard--tableau-de-bord)
4. [Gestion des sapeurs-pompiers](#4-gestion-des-sapeurs-pompiers)
5. [Livret sanitaire — Toutes les sections](#5-livret-sanitaire--toutes-les-sections)
   - 5.1 État civil
   - 5.2 Constantes morphologiques
   - 5.3 Examen d'incorporation
   - 5.4 Opérations OPEX/OPINT
   - 5.5 Vaccinations et immunisations
   - 5.6 Visites sanitaires
   - 5.7 Indisponibilités
   - 5.8 Copies de certificats
   - 5.9 Décisions de réforme
   - 5.10 Contrôle de fin de service
6. [Export PDF](#6-export-pdf)
7. [Administration](#7-administration)
8. [Sauvegardes](#8-sauvegardes)
9. [Résolution de problèmes (FAQ)](#9-résolution-de-problèmes-faq)
10. [Raccourcis clavier](#10-raccourcis-clavier)
11. [Rôles et permissions](#11-rôles-et-permissions)
12. [Glossaire SIGYCOP](#12-glossaire-sigycop)

---

## 1. Installation et premier lancement

### Prérequis système

| Élément | Minimum | Recommandé |
|---------|---------|------------|
| OS | Windows 10 / Ubuntu 20.04 | Windows 11 / Ubuntu 22.04 |
| RAM | 4 Go | 8 Go |
| Espace disque | 200 Mo | 1 Go (pour les sauvegardes) |
| Résolution | 1024×600 | 1280×800 ou plus |

### Étapes d'installation

**Étape 1 — Téléchargement**

Télécharger le fichier d'installation fourni par votre administrateur :
- Windows : `SPR_Livrets_Setup_v1.0.0.exe`
- Linux : `SPR_Livrets_v1.0.0.AppImage`

**Étape 2 — Installation (Windows)**

```
1. Double-cliquer sur SPR_Livrets_Setup_v1.0.0.exe
2. Accepter la demande de permissions administrateur
3. Choisir le dossier d'installation (défaut: C:\Program Files\SPR Livrets)
4. Cliquer sur "Installer"
5. Attendre la fin de l'installation (environ 2 minutes)
6. Cocher "Lancer l'application" et cliquer sur "Terminer"
```

**Étape 3 — Premier lancement**

```
┌─────────────────────────────────────────┐
│  🔥 Gestion Livrets Sanitaires SPR      │
│                                         │
│         [Icône flamme rouge]            │
│                                         │
│           Chargement...                 │
│         ████████████░░░░ 75%            │
└─────────────────────────────────────────┘
```

Au premier lancement, l'application :
1. Crée la base de données locale dans le dossier Documents
2. Initialise le compte administrateur par défaut
3. Affiche l'écran de connexion

> ⚠️ **IMPORTANT** : Le mot de passe administrateur par défaut est `Admin@SPR2024`.
> Changez-le immédiatement lors de la première connexion.

> 💡 **ASTUCE** : Créez un raccourci sur le bureau pour un accès rapide.

---

## 2. Connexion

### Écran de connexion

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│            🔥  SPR — Livrets Sanitaires              │
│         Direction Générale de la Protection Civile   │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  👤  Nom d'utilisateur                         │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  🔒  Mot de passe                          👁  │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ☐  Rester connecté                                  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │           SE CONNECTER                         │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Procédure de connexion

1. Saisir votre **nom d'utilisateur** (fourni par l'administrateur)
2. Saisir votre **mot de passe** (sensible à la casse)
3. Cocher "Rester connecté" si vous êtes sur un poste sécurisé
4. Cliquer sur **SE CONNECTER**

### Exemple de connexion (médecin)

| Champ | Valeur exemple |
|-------|----------------|
| Nom d'utilisateur | `dr.ouedraogo` |
| Mot de passe | `Medecin@SPR#24` |

> ⚠️ **SÉCURITÉ** : Ne partagez jamais votre mot de passe. Chaque action dans
> l'application est enregistrée avec votre identifiant.

> ⚠️ **AUTO-DÉCONNEXION** : L'application se déconnecte automatiquement après
> **30 minutes** d'inactivité pour protéger les données médicales.

> 💡 **MOT DE PASSE OUBLIÉ** : Contactez votre administrateur système.
> Il peut réinitialiser votre mot de passe depuis le module Administration.

---

## 3. Dashboard — Tableau de bord

### Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 🔥 Livrets Sanitaires SPR          [Dr. Ouédraogo] 👤  [Déconnexion] 🚪 │
├──────────────┬──────────────────────────────────────────────────────────┤
│ 🏠 Tableau   │                   TABLEAU DE BORD                        │
│    de bord   │                                                          │
│              │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ 👥 Liste     │  │  Total   │ │Dossiers  │ │Vaccins   │ │ Visites  │   │
│    SPR       │  │  SPR     │ │complets  │ │expirés   │ │ en retard│   │
│              │  │  🔢 247  │ │  ✅ 198  │ │  ⚠️  12  │ │  ⚠️  34  │   │
│ ➕ Nouveau   │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│    dossier   │                                                          │
│              │  ┌─────────────────────────┐ ┌─────────────────────┐   │
│ ⚙️  Admin    │  │   Répartition aptitude  │ │   Alertes actives   │   │
│    ▶ Users   │  │                         │ │                     │   │
│    ▶ Config  │  │   Apte      ████ 80%   │ │ ⚠️ Rappel vaccin x12│   │
│    ▶ Backup  │  │   Surveill. ██   12%   │ │ ⚠️ Visite > 1 an x34│   │
│              │  │   Inapte T. █    5%    │ │ 🔴 Inapte définitif │   │
│              │  │   Inapte D. ▌    3%    │ │    3 dossiers       │   │
│              │  └─────────────────────────┘ └─────────────────────┘   │
└──────────────┴──────────────────────────────────────────────────────────┘
```

### Tuiles de statistiques

| Tuile | Description | Couleur |
|-------|-------------|---------|
| Total SPR | Nombre total de sapeurs-pompiers enregistrés | Bleu |
| Dossiers complets | Dossiers avec état civil + examen d'incorporation | Vert |
| Vaccinations expirées | Vaccins dont la date de rappel est dépassée | Orange |
| Visites en retard | Dernière visite datant de plus de 365 jours | Orange |

### Actualiser le tableau de bord

- **Méthode 1** : Cliquer sur l'icône 🔄 en haut à droite
- **Méthode 2** : Appuyer sur **F5**
- **Méthode 3** : Faire défiler vers le bas puis vers le haut (pull-to-refresh)

> 💡 **ASTUCE** : Les alertes en rouge signalent des situations urgentes
> (vaccins expirés depuis plus de 30 jours, inaptitudes permanentes).
> Traitez-les en priorité en cliquant directement sur l'alerte.

---

## 4. Gestion des sapeurs-pompiers

### 4.1 Liste des sapeurs-pompiers

```
┌─────────────────────────────────────────────────────────────────────┐
│  LISTE DES SAPEURS-POMPIERS                    [+ Nouveau dossier]  │
│                                                                     │
│  🔍 [Rechercher par nom, matricule...    ]  [Filtrer ▼]            │
│                                                                     │
│  ┌──────────┬──────────────────┬────────────┬──────────┬────────┐  │
│  │ Matricule│ Nom & Prénoms    │ Date naiss.│ Décision │Actions │  │
│  ├──────────┼──────────────────┼────────────┼──────────┼────────┤  │
│  │SPR-00142 │ OUÉDRAOGO Mamadou│ 15/03/1990 │ ✅ Apte  │ 👁 ✏️  │  │
│  │SPR-00143 │ KABORÉ Fatimata  │ 22/07/1988 │ ⚠️ Surv. │ 👁 ✏️  │  │
│  │SPR-00144 │ TRAORÉ Issouf    │ 08/11/1995 │ 🔴 Inap. │ 👁 ✏️  │  │
│  │SPR-00145 │ SAWADOGO Adama   │ 30/01/1992 │ ✅ Apte  │ 👁 ✏️  │  │
│  │...       │ ...              │ ...        │ ...      │ ...   │  │
│  └──────────┴──────────────────┴────────────┴──────────┴────────┘  │
│                                          Page 1/10  [< >]          │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Recherche et filtres

**Recherche rapide** : Tapez dans la barre de recherche (au minimum 2 caractères) :
- Nom de famille
- Prénom
- Matricule (ex: `SPR-00142`)
- Lieu de naissance

**Filtres disponibles** :
- Par décision médicale (Apte / À surveiller / Inapte temporaire / Inapte définitif)
- Par statut du dossier (Complet / Incomplet)
- Par alerte (Vaccin expiré / Visite en retard)

### 4.3 Créer un nouveau dossier

**Accès** : Bouton `+ Nouveau dossier` en haut à droite de la liste

L'assistant de création se déroule en 3 étapes :

```
ÉTAPE 1/3                    ÉTAPE 2/3                ÉTAPE 3/3
┌──────────────────────┐    ┌─────────────────────┐  ┌──────────────────────┐
│  INFORMATIONS        │    │  INFORMATIONS       │  │  CONFIRMATION        │
│  PRINCIPALES         │ →  │  COMPLÉMENTAIRES    │→ │                      │
│                      │    │                     │  │  Matricule: SPR-0XXX │
│  Matricule*:         │    │  Groupe sanguin:    │  │  Nom: KONÉ Bernard   │
│  [SPR-_____]         │    │  [A+         ▼]    │  │  Date naiss.: ...    │
│                      │    │                     │  │                      │
│  Nom*: [________]    │    │  Taille (cm):       │  │  ┌──────────────┐   │
│  Prénoms*: [_______] │    │  [___]              │  │  │  CRÉER LE    │   │
│  Date naiss.*: [_/__/│    │  Poids (kg):        │  │  │  DOSSIER     │   │
│  Lieu naiss.: [____] │    │  [___]              │  │  └──────────────┘   │
│                      │    │                     │  │                      │
│  [Annuler] [Suivant →]│   │  [← Retour][Suivant]│  │  [← Retour]         │
└──────────────────────┘    └─────────────────────┘  └──────────────────────┘
```

**Étape 1 — Informations principales** (champs obligatoires marqués \*)
1. Saisir le **matricule** au format `SPR-XXXXX` (5 chiffres)
2. Saisir le **nom** en majuscules
3. Saisir les **prénoms**
4. Sélectionner la **date de naissance** via le calendrier
5. Saisir le **lieu de naissance**
6. Cliquer sur **Suivant →**

**Étape 2 — Informations complémentaires**
1. Sélectionner le **groupe sanguin** (liste déroulante : A+, A-, B+, B-, AB+, AB-, O+, O-)
2. Saisir la **taille** en centimètres (ex: `175`)
3. Saisir le **poids** en kilogrammes (ex: `72`)
4. Cliquer sur **Suivant →**

**Étape 3 — Confirmation**
1. Vérifier les informations affichées
2. Cliquer sur **CRÉER LE DOSSIER**

> ✅ Un message de confirmation s'affiche et vous êtes redirigé automatiquement
> vers le dossier du nouveau sapeur-pompier.

> 💡 **ASTUCE** : Le matricule est généré automatiquement en séquence.
> Vous pouvez modifier le numéro proposé si nécessaire.

> ⚠️ **DOUBLON** : Si un matricule identique existe déjà, un message d'erreur
> s'affiche. Vérifiez que le dossier n'existe pas déjà dans la liste.

### 4.4 Ouvrir un dossier existant

- **Méthode 1** : Cliquer sur l'icône 👁 (voir) dans la colonne Actions
- **Méthode 2** : Double-cliquer sur la ligne

### 4.5 Supprimer un dossier

> ⚠️ **ATTENTION** : La suppression d'un dossier est **irréversible**.
> Tous les données médicales du sapeur-pompier seront définitivement effacées.

1. Cliquer sur l'icône ✏️ (modifier) dans la colonne Actions
2. Dans le dossier ouvert, cliquer sur le bouton **Supprimer le dossier** (en bas de page)
3. Un dialogue de confirmation s'affiche
4. Taper le matricule du sapeur-pompier pour confirmer
5. Cliquer sur **SUPPRIMER**

> 💡 Cette fonctionnalité est réservée aux **Administrateurs** et **Médecins**.
> Les utilisateurs en consultation ne peuvent pas supprimer de dossiers.

---

## 5. Livret sanitaire — Toutes les sections

### Navigation dans le livret

Une fois un dossier ouvert, les sections du livret sont accessibles via les
onglets en haut de l'écran :

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← Retour   OUÉDRAOGO Mamadou — SPR-00142              [Exporter PDF]│
├──────────┬─────────┬──────────┬───────────┬─────────┬───────────────┤
│ État     │Constantes│ Examen  │ Opérations│ Vaccins │  Visites  ··· │
│ civil    │         │ Incorp.  │           │         │               │
└──────────┴─────────┴──────────┴───────────┴─────────┴───────────────┘
```

Le bouton `···` en fin d'onglets donne accès aux sections supplémentaires :
Indisponibilités, Certificats, Décisions de réforme, Contrôle fin de service.

---

### 5.1 État civil

**Contenu** : Identité complète, photo, contacts d'urgence

```
┌─────────────────────────────────────────────────────────────────────┐
│  ÉTAT CIVIL                                          [Modifier ✏️]  │
│                                                                     │
│  ┌──────────────────────────┐  Nom : OUÉDRAOGO                     │
│  │                          │  Prénoms : Mamadou Adama             │
│  │   [PHOTO D'IDENTITÉ]    │  Date de naissance : 15/03/1990      │
│  │   📷 Cliquer pour       │  Lieu de naissance : Ouagadougou     │
│  │      changer la photo   │                                       │
│  └──────────────────────────┘  Nom du père : Salif OUÉDRAOGO      │
│                                Nom de la mère : Aïcha TAPSOBA      │
│  CONTACTS D'URGENCE                                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 1. Mariam OUÉDRAOGO — Conjoint(e) — +226 70 12 34 56       │   │
│  │ 2. Ibrahim OUÉDRAOGO — Père       — +226 76 98 76 54       │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

**Procédure de modification** :
1. Cliquer sur **Modifier ✏️**
2. Modifier les champs souhaités
3. Pour changer la photo : cliquer sur la photo actuelle → sélectionner un fichier (JPG/PNG, max 5 Mo)
4. Pour ajouter un contact d'urgence : cliquer sur `+ Ajouter un contact`
5. Cliquer sur **Enregistrer**

> 💡 **FORMAT PHOTO** : Les formats acceptés sont JPEG, PNG. La taille maximale
> est de 5 Mo. La photo sera redimensionnée automatiquement si nécessaire.

---

### 5.2 Constantes morphologiques

**Contenu** : Taille, poids, IMC, périmètres, empreintes, signature

| Champ | Unité | Exemple |
|-------|-------|---------|
| Taille | cm | 178 |
| Poids | kg | 74 |
| IMC | calculé automatiquement | 23,3 (Normal) |
| Périmètre thoracique | cm | 96 |
| Périmètre abdominal | cm | 82 |

> 💡 **IMC AUTOMATIQUE** : L'IMC est calculé automatiquement dès que la taille
> et le poids sont saisis (formule : poids / taille²).

**Interprétation IMC** :

| IMC | Catégorie | Affichage |
|-----|-----------|-----------|
| < 18,5 | Insuffisance pondérale | 🔵 Bleu |
| 18,5 – 24,9 | Normal | 🟢 Vert |
| 25 – 29,9 | Surpoids | 🟡 Jaune |
| ≥ 30 | Obésité | 🔴 Rouge |

---

### 5.3 Examen d'incorporation

**Contenu** : Antécédents, examens cliniques par système, SIGYCOP, décision

**Procédure de saisie** :

1. **Antécédents**
   - Héréditaires : noter les maladies familiales (diabète, hypertension, etc.)
   - Personnels : opérations, maladies chroniques
   - Collatéraux : fratrie

2. **Examens cliniques** (cocher normal/anormal pour chaque système)
   - Appareil circulatoire
   - Appareil respiratoire
   - Appareil digestif
   - Appareil génito-urinaire
   - Système nerveux
   - Denture (coefficient de mastication)
   - Peau et annexes

3. **Examens paracliniques**
   - Radiographie pulmonaire
   - Glycémie (mmol/L)
   - Albumine (g/L)
   - FC (battements/min)
   - TA (ex: 120/80 mmHg)

4. **Vision**
   - Saisir acuité visuelle OD et OG (sans/avec correction)
   - Exemple : OD = 10/10, OG = 8/10
   - Sens chromatique : Normal / Dyschromatopsie

5. **Audition**
   - Voix haute : distance en mètres
   - Voix chuchotée : distance en mètres

6. **Profil SIGYCOP**
   - Coter chaque lettre de 1 (excellent) à 5 (inapte)
   - Voir le [Glossaire SIGYCOP](#12-glossaire-sigycop) pour les détails

7. **Décision médicale**
   - Sélectionner : Apte / Inapte temporaire / À surveiller / Inapte définitif
   - Saisir les conclusions
   - Signer et dater

> ⚠️ **DÉCISION INAPTE DÉFINITIF** : Cette décision déclenche automatiquement
> une alerte sur le tableau de bord et requiert une validation du médecin-chef.

---

### 5.4 Opérations OPEX/OPINT

**Contenu** : Jusqu'à 6 séjours opérationnels (OPEX = extérieur, OPINT = intérieur)

**Procédure d'ajout d'une opération** :

```
Cliquer sur [+ Ajouter une opération]

┌──────────────────────────────────────────────────────┐
│  NOUVELLE OPÉRATION                                  │
│                                                      │
│  Type :  ● OPEX  ○ OPINT                            │
│                                                      │
│  Lieu de séjour : [Mali — Opération Barkhane    ]   │
│                                                      │
│  Date de départ : [01/03/2023]  📅                  │
│  Date de retour : [30/06/2023]  📅                  │
│                                                      │
│  AU DÉPART                     AU RETOUR            │
│  FC  : [72 bpm]                FC  : [74 bpm]       │
│  TA  : [120/80 mmHg]           TA  : [118/78 mmHg]  │
│  État de santé : [Bon ]        État : [Bon     ]    │
│  Glycémie : [5,2 mmol/L]       Glycémie: [5,4 ]    │
│                                                      │
│  Observations : [RAS                           ]    │
│                                                      │
│  Lieu/Date signature : [Ouagadougou, 30/06/2023]    │
│                                                      │
│           [Annuler]     [Enregistrer]                │
└──────────────────────────────────────────────────────┘
```

> ⚠️ **LIMITE** : Le livret réglementaire ne prévoit que **6 opérations**.
> Au-delà, un message d'avertissement s'affiche.

---

### 5.5 Vaccinations et immunisations

**Contenu** : Historique complet des vaccinations avec alertes de rappel

**Vaccins réglementaires** (liste avec suivi automatique) :
- Antiamaril (fièvre jaune)
- Antitétanique
- Antiméningite
- Anti-COVID-19
- Antihépatite B
- Et autres vaccins

**Procédure d'ajout d'une vaccination** :

1. Cliquer sur `+ Ajouter une vaccination`
2. Sélectionner le type de vaccin (liste déroulante ou "Autres")
3. Saisir la date de vaccination
4. Indiquer le nombre de doses reçues
5. Saisir la référence/numéro de lot (si disponible)
6. Saisir la date de rappel prévue
7. Cliquer sur **Enregistrer**

**Indicateurs visuels** :
- 🟢 **Vaccin à jour** : date de rappel > 30 jours
- 🟡 **Rappel imminent** : date de rappel dans les 30 prochains jours
- 🔴 **Vaccin expiré** : date de rappel dépassée

> 💡 **ASTUCE** : L'application envoie des alertes automatiques sur le tableau
> de bord 30 jours avant l'expiration d'un vaccin.

---

### 5.6 Visites sanitaires périodiques

**Contenu** : Enregistrement des visites médicales annuelles

**Procédure** :
1. Cliquer sur `+ Nouvelle visite`
2. Saisir l'entité/corps (ex: `Groupement Central des Sapeurs-Pompiers`)
3. Sélectionner la date de visite
4. Saisir les résultats de la visite
5. Saisir les observations du médecin
6. Enregistrer

> ⚠️ **ALERTE ANNUELLE** : Si la dernière visite date de plus de **365 jours**,
> une alerte apparaît sur le tableau de bord dans la colonne "Visites en retard".

---

### 5.7 Indisponibilités médicales

**Contenu** : Périodes d'arrêt médical (hospitalisation, infirmerie, chambre)

**Procédure** :
1. Cliquer sur `+ Nouvelle indisponibilité`
2. Saisir le corps/entité
3. Sélectionner les dates de début et fin
4. Saisir le diagnostic
5. Indiquer la répartition (hôpital / infirmerie / chambre) en jours
6. Signer et enregistrer

**Exemple — Indisponibilité du SP Kaboré Fatimata** :
```
Corps/Entité   : Groupement Nord des Sapeurs-Pompiers
Période        : 10/05/2023 — 24/05/2023 (14 jours)
Diagnostic     : Fracture du poignet droit (suite à intervention)
À l'hôpital    : 7 jours (CHU Yalgado Ouédraogo)
En infirmerie  : 3 jours
En chambre     : 4 jours
```

---

### 5.8 Copies de certificats

**Contenu** : Archivage numérique des certificats médicaux

**Types de certificats** :
- Blessure (survenue en service)
- Maladie
- Autre (certificat de guérison, d'aptitude spéciale, etc.)

**Procédure d'ajout** :
1. Cliquer sur `+ Ajouter un certificat`
2. Saisir le titre du certificat (ex: `Certificat de guérison - fracture`)
3. Saisir la date du certificat
4. Sélectionner le type (Blessure / Maladie / Autre)
5. Cliquer sur `📎 Attacher un fichier` pour importer le scan (PDF/JPG, max 10 Mo)
6. Ajouter des notes si nécessaire
7. Enregistrer

> 💡 **FORMAT FICHIER** : Formats acceptés : PDF, JPEG, PNG.
> Scannez les documents à 200 DPI minimum pour garantir la lisibilité.

---

### 5.9 Décisions de réforme

**Contenu** : Décisions officielles de maintien ou fin de service

**Types de décisions** :
- **Réforme** : fin de service anticipée pour raisons médicales
- **Rengagement** : prolongation du service actif

**Procédure** :
1. Cliquer sur `+ Nouvelle décision`
2. Saisir la date de décision
3. Sélectionner le type (Réforme / Rengagement)
4. Saisir le libellé de la décision
5. Indiquer le nom et grade de l'autorité signataire
6. Enregistrer

---

### 5.10 Contrôle de fin de service

**Contenu** : Examen médical terminal effectué à la radiation des contrôles

Cette section est remplie **une seule fois**, lors de la fin de service
du sapeur-pompier.

**Champs principaux** :
- Date de radiation des contrôles
- Lieu de l'examen
- État de santé général (Bonne santé / Atteint de...)
- Diagnostic si pathologie
- Lieu d'hospitalisation éventuel
- Indice de Pignet (corpulence)
- Examen clinique final complet
- Vision finale (OD/OG)
- Audition finale

> ⚠️ **IRRÉVERSIBLE** : Une fois la section contrôle fin de service enregistrée
> et validée, le dossier passe en statut "Archivé" et ne peut plus être modifié
> qu'avec l'autorisation d'un administrateur.

---

## 6. Export PDF

### Exporter le livret complet

```
┌─────────────────────────────────────────┐
│  EXPORT PDF                             │
│                                         │
│  Sélectionner les sections à exporter : │
│  ☑ État civil                          │
│  ☑ Constantes morphologiques           │
│  ☑ Examen d'incorporation              │
│  ☑ Opérations OPEX/OPINT              │
│  ☑ Vaccinations                        │
│  ☑ Visites sanitaires                  │
│  ☑ Indisponibilités                    │
│  ☑ Certificats                         │
│  ☑ Décisions de réforme               │
│  ☑ Contrôle fin de service             │
│                                         │
│  ☑ Inclure le logo de l'institution    │
│  ☑ Inclure la photo d'identité         │
│                                         │
│  [Annuler]     [Générer le PDF 📄]     │
└─────────────────────────────────────────┘
```

**Procédure** :
1. Depuis le dossier d'un sapeur-pompier, cliquer sur **Exporter PDF** en haut à droite
2. Cocher/décocher les sections à inclure
3. Cliquer sur **Générer le PDF**
4. Choisir l'emplacement de sauvegarde du fichier
5. Cliquer sur **Enregistrer**

> 💡 **NOM DU FICHIER** : Le PDF est nommé automatiquement :
> `livret_spr_OUEDRAOGO_SPR-00142_20240315.pdf`

> 💡 **IMPRESSION DIRECTE** : Après génération, vous pouvez imprimer directement
> depuis le lecteur PDF ou cliquer sur l'icône 🖨️ dans la fenêtre d'aperçu.

---

## 7. Administration

> ⚠️ **ACCÈS RESTREINT** : Les fonctions d'administration sont réservées
> aux utilisateurs avec le rôle **Administrateur**.

### 7.1 Gestion des utilisateurs

**Accès** : Menu latéral → Admin → Gestion des utilisateurs

**Créer un nouvel utilisateur** :
1. Cliquer sur `+ Nouvel utilisateur`
2. Renseigner nom complet, nom d'utilisateur, email
3. Sélectionner le rôle (Administrateur / Médecin / Consultation)
4. Définir un mot de passe temporaire
5. Cocher "Obliger le changement au premier login"
6. Cliquer sur **Créer**

### 7.2 Paramètres de l'application

**Accès** : Menu latéral → Admin → Paramètres

| Paramètre | Valeur par défaut | Description |
|-----------|------------------|-------------|
| Nom de l'institution | DGPC | Affiché dans les en-têtes PDF |
| Chemin des sauvegardes | Documents/SPR_Backups | Dossier de stockage |
| Fréquence auto-backup | Quotidienne | Sauvegarde automatique |
| Délai auto-déconnexion | 30 min | Inactivité avant logout |
| Logo personnalisé | — | Logo affiché dans l'interface |

---

## 8. Sauvegardes

### 8.1 Sauvegarde manuelle

**Accès** : Menu latéral → Admin → Sauvegardes

1. Cliquer sur **Sauvegarder maintenant**
2. Choisir ou confirmer le dossier de destination
3. Attendre la fin du processus (barre de progression)
4. Un message de confirmation s'affiche avec le nom du fichier créé

**Nom du fichier de sauvegarde** :
```
backup_spr_20240315_143022.db
```

### 8.2 Sauvegarde automatique

L'application crée automatiquement une sauvegarde selon la fréquence configurée
(défaut : quotidienne à 23h00). Les **30 dernières sauvegardes** sont conservées,
les plus anciennes sont supprimées automatiquement.

### 8.3 Restaurer une sauvegarde

> ⚠️ **ATTENTION** : La restauration **remplace toutes les données actuelles**
> par celles de la sauvegarde sélectionnée. Cette action est irréversible.

1. Cliquer sur **Restaurer une sauvegarde**
2. Sélectionner le fichier `.db` à restaurer
3. Lire attentivement l'avertissement affiché
4. Taper `RESTAURER` pour confirmer
5. L'application redémarre automatiquement après la restauration

> 💡 **BONNE PRATIQUE** : Effectuez une sauvegarde manuelle **avant** toute
> restauration, afin de pouvoir revenir en arrière si nécessaire.

---

## 9. Résolution de problèmes (FAQ)

### ❓ Q1 : Je ne peux pas me connecter malgré le bon mot de passe

**Causes possibles** :
- La touche Verr Maj est activée (le mot de passe est sensible à la casse)
- Votre compte a été désactivé par l'administrateur
- Votre session est expirée — essayez de fermer et relancer l'application

**Solution** : Contactez votre administrateur pour vérifier l'état de votre compte.

---

### ❓ Q2 : L'application est très lente

**Causes possibles** :
- Base de données volumineuse sans optimisation récente
- Autres programmes consommant beaucoup de RAM

**Solutions** :
1. Fermer les autres applications
2. Demander à l'administrateur d'effectuer une maintenance de la base de données
3. Vérifier que le disque dur n'est pas plein (minimum 500 Mo libres recommandés)

---

### ❓ Q3 : Je ne trouve pas un sapeur-pompier dans la liste

**Vérifications** :
1. Vérifier l'orthographe du nom (utilisez les premières lettres seulement)
2. Essayer de rechercher par matricule
3. Vérifier si un filtre est actif (un filtre actif est indiqué par un point bleu sur l'icône filtre)
4. Cliquer sur "Effacer les filtres" et relancer la recherche

---

### ❓ Q4 : Le PDF généré est incomplet ou vide

**Causes possibles** :
- La section sélectionnée n'a pas encore de données saisies
- Problème temporaire de génération

**Solutions** :
1. Vérifier que les sections cochées contiennent bien des données
2. Fermer et rouvrir le dialogue d'export
3. Réessayer la génération

---

### ❓ Q5 : J'ai supprimé un dossier par erreur

**Action immédiate** : Contactez l'administrateur **immédiatement**.
Si une sauvegarde récente existe, il est possible de restaurer les données.

> ⚠️ Plus le délai est court, plus la restauration est précise.
> N'effectuez **aucune autre modification** avant la restauration.

---

### ❓ Q6 : L'application affiche "Base de données verrouillée"

**Cause** : Une autre instance de l'application est déjà ouverte, ou l'application
a été fermée de façon anormale lors d'une écriture.

**Solution** :
1. Fermer toutes les fenêtres de l'application
2. Vérifier dans le Gestionnaire des tâches qu'aucun processus SPR ne tourne
3. Relancer l'application

Si le problème persiste, contactez l'administrateur.

---

### ❓ Q7 : Les alertes de vaccination s'affichent pour des vaccins à jour

**Cause** : La date de rappel saisie est peut-être incorrecte.

**Solution** :
1. Ouvrir le dossier du sapeur-pompier concerné
2. Aller dans la section Vaccinations
3. Vérifier et corriger la date de rappel
4. Enregistrer

---

### ❓ Q8 : Je ne peux pas modifier un dossier

**Causes possibles** :
- Votre rôle est "Consultation" (lecture seule uniquement)
- Le dossier est en statut "Archivé" (contrôle fin de service validé)

**Solution** : Si vous devez modifier un dossier archivé, contactez l'administrateur.

---

### ❓ Q9 : L'image de profil ne s'affiche pas après import

**Causes possibles** :
- Format non supporté (utilisez JPG ou PNG)
- Fichier corrompu ou trop volumineux (max 5 Mo)

**Solution** :
1. Vérifier que le fichier est bien au format JPEG ou PNG
2. Réduire la taille de l'image si elle dépasse 5 Mo (via Paint, GIMP ou un service en ligne)
3. Réessayer l'import

---

### ❓ Q10 : Comment transférer les données vers un autre ordinateur ?

**Procédure** :
1. Sur l'ancien ordinateur : effectuer une **sauvegarde manuelle** (voir [section 8](#8-sauvegardes))
2. Copier le fichier `.db` sur une clé USB sécurisée
3. Installer l'application sur le nouvel ordinateur
4. Se connecter avec le compte administrateur
5. **Restaurer la sauvegarde** depuis la clé USB

> ⚠️ Assurez-vous que la clé USB est chiffrée ou protégée par mot de passe.
> Les données médicales sont confidentielles.

---

### ❓ Q11 : Comment changer mon mot de passe ?

1. Cliquer sur votre nom d'utilisateur en haut à droite
2. Sélectionner **Mon profil**
3. Cliquer sur **Changer le mot de passe**
4. Saisir l'ancien mot de passe, puis le nouveau (2 fois)
5. Cliquer sur **Enregistrer**

**Exigences du mot de passe** :
- Minimum 8 caractères
- Au moins une majuscule
- Au moins un chiffre
- Au moins un caractère spécial (@, #, !, $, etc.)

---

### ❓ Q12 : L'application ne démarre plus après une mise à jour

**Solution** :
1. Redémarrer l'ordinateur
2. Relancer l'application
3. Si le problème persiste, contacter l'administrateur pour une réinstallation

---

## 10. Raccourcis clavier

| Raccourci | Action |
|-----------|--------|
| `Ctrl + N` | Nouveau dossier sapeur-pompier |
| `Ctrl + S` | Enregistrer le formulaire en cours |
| `Ctrl + F` | Ouvrir la barre de recherche |
| `Ctrl + P` | Exporter en PDF (depuis un dossier ouvert) |
| `Ctrl + Z` | Annuler la dernière modification |
| `F5` | Actualiser la page courante |
| `Échap` | Fermer le dialogue / Annuler |
| `Entrée` | Valider le formulaire / Confirmer |
| `Tab` | Passer au champ suivant |
| `Maj + Tab` | Passer au champ précédent |
| `Alt + F4` | Fermer l'application |
| `Ctrl + B` | Lancer une sauvegarde manuelle (admin) |

---

## 11. Rôles et permissions

### Tableau des permissions par rôle

| Fonctionnalité | 👑 Admin | 🩺 Médecin | 👁️ Consultation |
|----------------|----------|-----------|----------------|
| Voir la liste des SPR | ✅ | ✅ | ✅ |
| Voir un dossier complet | ✅ | ✅ | ✅ |
| Créer un nouveau dossier | ✅ | ✅ | ❌ |
| Modifier les données médicales | ✅ | ✅ | ❌ |
| Supprimer un dossier | ✅ | ✅ | ❌ |
| Exporter un PDF | ✅ | ✅ | ✅ |
| Gérer les utilisateurs | ✅ | ❌ | ❌ |
| Configurer l'application | ✅ | ❌ | ❌ |
| Effectuer une sauvegarde | ✅ | ❌ | ❌ |
| Restaurer une sauvegarde | ✅ | ❌ | ❌ |
| Voir les logs d'accès | ✅ | ❌ | ❌ |

### Descriptions des rôles

**👑 Administrateur** (`admin`)
Accès complet à toutes les fonctionnalités. Responsable de la gestion des
comptes, des sauvegardes et de la configuration du système.

**🩺 Médecin** (`medecin`)
Peut créer, lire et modifier tous les dossiers médicaux. Ne peut pas gérer
les utilisateurs ni accéder aux paramètres système.

**👁️ Consultation** (`consultation`)
Accès en lecture seule à tous les dossiers. Peut uniquement visualiser et
exporter en PDF. Typiquement utilisé pour les personnels d'état-major.

---

## 12. Glossaire SIGYCOP

Le profil SIGYCOP est le système de cotation médicale standardisé utilisé
pour les militaires et sapeurs-pompiers dans les armées francophones d'Afrique.
Chaque lettre évalue un système organique sur une échelle de 1 à 5.

### Signification de chaque lettre

| Lettre | Système évalué | Description |
|--------|---------------|-------------|
| **S** | État général | Morphologie générale, poids, taille, état nutritionnel |
| **I** | Membres inférieurs | Mobilité, résistance à la marche et à la course |
| **G** | Membres supérieurs | Force de préhension, dextérité, mobilité des épaules |
| **Y** | Yeux | Acuité visuelle (OD/OG), vision des couleurs (sens chromatique) |
| **C** | Appareil circulatoire | Cœur, artères, tension artérielle, varices |
| **O** | Oreilles | Acuité auditive (voix haute/chuchotée), équilibre |
| **P** | Psychisme | Équilibre psychologique, résistance au stress, aptitude au commandement |

### Échelle de cotation

| Cotation | Signification | Aptitude |
|----------|--------------|----------|
| **1** | Excellent | Apte sans restriction |
| **2** | Bon | Apte |
| **3** | Moyen | Apte avec réserves |
| **4** | Limité | Inapte temporaire possible |
| **5** | Inapte | Inapte à l'emploi |

### Exemple de profil SIGYCOP

**SPR-00142 — Ouédraogo Mamadou** :
```
S : 1  (Morphologie excellente, BMI 23,3)
I : 1  (Aucune pathologie membre inférieur)
G : 1  (Force et mobilité normales)
Y : 2  (Acuité visuelle légèrement réduite OG : 8/10)
C : 1  (TA 120/80, FC 68, pas de soufflé)
O : 1  (Audition normale voix haute et chuchotée)
P : 1  (Profil psychologique stable)

Profil : S1 I1 G1 Y2 C1 O1 P1
Décision : APTE
```

---

## Informations de contact et support

```
Direction Générale de la Protection Civile
Service Informatique — Gestion des Livrets Sanitaires SPR

Pour toute assistance technique :
  → Contacter votre administrateur local
  → Email : support.spr@protection-civile.bf
  → Téléphone du support : +226 25 30 XX XX

Urgence technique (perte de données) :
  → Contacter immédiatement le responsable informatique
  → Ne pas effectuer d'autres opérations avant intervention

Version du logiciel : 1.0.0
© 2024 Service des Sapeurs-Pompiers — Burkina Faso
La Patrie ou la Mort, Nous Vaincrons
```

---

*Document rédigé pour le Service des Sapeurs-Pompiers du Burkina Faso.*
*Dernière mise à jour : Mars 2024*
