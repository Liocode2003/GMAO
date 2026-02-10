# Écrans du Livret Sanitaire

Ce répertoire contient les 5 premiers écrans du livret sanitaire pour la gestion des sapeurs-pompiers.

## 📋 Écrans disponibles

### 1. État Civil (`etat_civil_screen.dart`)

Formulaire complet pour la saisie de l'état civil d'un sapeur-pompier.

**Fonctionnalités:**
- Saisie du nom, prénoms (requis)
- Date et lieu de naissance
- Nom du père et de la mère
- Upload et preview de photo
- 3 contacts d'urgence (nom, téléphone, lien de parenté)
- Auto-sauvegarde toutes les 2 minutes
- Validation complète des champs

**Utilisation:**
```dart
Navigator.of(context).push(
  MaterialPageRoute(
    builder: (context) => EtatCivilScreen(
      sapeurPompierId: 'id-du-sapeur',
    ),
  ),
);
```

---

### 2. Constantes Physiques (`constantes_screen.dart`)

Formulaire pour la saisie des constantes physiques avec calcul automatique de l'IMC.

**Fonctionnalités:**
- Saisie taille (100-250 cm) et poids (30-200 kg)
- Calcul automatique de l'IMC
- Interprétation colorée de l'IMC (insuffisance pondérale, normal, surpoids, obésité)
- Périmètres thoracique et abdominal
- Date de mesure
- Upload empreintes digitales et signature
- Graphique simple de l'historique du poids
- Validation des valeurs

**Utilisation:**
```dart
Navigator.of(context).push(
  MaterialPageRoute(
    builder: (context) => ConstantesScreen(
      sapeurPompierId: 'id-du-sapeur',
    ),
  ),
);
```

---

### 3. Examen d'Incorporation (`examen_incorporation_screen.dart`)

Formulaire multi-étapes (Stepper) pour l'examen médical complet d'incorporation.

**Fonctionnalités:**
- **Étape 1 - Antécédents:** héréditaires, personnels, collatéraux
- **Étape 2 - Examens cliniques:** respiratoire, radiographie, génito-urinaire, digestif, circulatoire, nerveux, denture, peau, constantes (FC, TA, sucre, albumine)
- **Étape 3 - Vision & Audition:** AV OD/OG avec/sans correction, sens chromatique, AA OD/OG voix haute/chuchotée
- **Étape 4 - Profil SIGYCOP:** 7 sliders (S, I, G, Y, C, O, P) de 0 à 5 avec calcul du score total
- **Étape 5 - Notes VAESIFX:** champs pour V, A, E, S, I, F, X
- **Étape 6 - Conclusions:** date clôture, décision (Apte/Inapte), à surveiller, mentions spéciales, entraînement spécial, utilisation préférentielle, nom médecin, signature
- Navigation entre les étapes (Précédent/Suivant)
- Validation selon les sections

**Utilisation:**
```dart
Navigator.of(context).push(
  MaterialPageRoute(
    builder: (context) => ExamenIncorporationScreen(
      sapeurPompierId: 'id-du-sapeur',
    ),
  ),
);
```

---

### 4. Opérations OPEX/OPINT (`operations_screen.dart`)

Gestion complète des opérations extérieures (jusqu'à 6 opérations maximum).

**Fonctionnalités:**
- Liste des opérations avec statut (En cours / Terminée)
- Ajout d'opération (max 6)
- Formulaire en 2 parties:
  - **Au départ:** lieu, date, état santé, poids, TA, AV, glycémie, AA, observations, médecin
  - **Au retour:** date, état santé, poids, TA, AV, glycémie, AA, observations, médecin
- Calcul automatique de la variation de poids (avec indicateur visuel)
- Calcul de la durée du séjour
- Validation: date retour > date départ
- Suppression d'opération avec confirmation
- Édition d'opération existante

**Utilisation:**
```dart
Navigator.of(context).push(
  MaterialPageRoute(
    builder: (context) => OperationsScreen(
      sapeurPompierId: 'id-du-sapeur',
    ),
  ),
);
```

---

### 5. Vaccinations (`vaccinations_screen.dart`)

Gestion complète des vaccinations avec alertes et filtres.

**Fonctionnalités:**
- Liste des vaccinations avec badges de statut colorés (✅ À jour, ⚠️ Proche expiration, ❌ Expiré)
- Alertes visuelles pour vaccins expirés ou proches de l'expiration
- Filtres par statut et type de vaccin
- Types de vaccins prédéfinis:
  - Antiamaril (fièvre jaune) - rappel 10 ans
  - Antitétanique - rappel 10 ans
  - Antiméningite - rappel 3 ans
  - Anti-COVID-19 - rappel 1 an
  - Antihépatite B - rappel 10 ans
  - Autres - pas de rappel automatique
- Calcul automatique de la date de rappel (ou saisie manuelle)
- Upload signature médecin
- Validation: date future pas acceptée
- Suppression avec confirmation

**Utilisation:**
```dart
Navigator.of(context).push(
  MaterialPageRoute(
    builder: (context) => VaccinationsScreen(
      sapeurPompierId: 'id-du-sapeur',
    ),
  ),
);
```

---

## 🎨 Design & UX

Tous les écrans partagent les mêmes caractéristiques:

### Layout
- Utilisation du `AppLayout` wrapper pour la sidebar
- AppBar avec titre et bouton retour
- Design Material 3 avec la palette `AppColors`
- Responsive et adaptatif

### Formulaires
- Validation en temps réel
- Messages d'erreur clairs en français
- Champs requis marqués avec *
- InputDecoration cohérente

### États de chargement
- CircularProgressIndicator pendant le chargement
- Boutons désactivés pendant les opérations
- SnackBar pour les messages de succès (vert) et erreur (rouge)

### Couleurs
- **Primary:** Rouge pompier (`#D32F2F`)
- **Secondary:** Bleu (`#1976D2`)
- **Success:** Vert (`#388E3C`)
- **Warning:** Orange (`#F57C00`)
- **Error:** Rouge foncé (`#C62828`)

---

## 🔧 Intégration avec le Repository

Tous les écrans utilisent le `sapeurPompierRepositoryProvider` pour:

### État Civil
- `saveEtatCivil(EtatCivil)` - Enregistrer l'état civil
- `getEtatCivil(String sapeurPompierId)` - Récupérer l'état civil

### Constantes
- `saveConstantes(Constantes)` - Enregistrer les constantes
- `getConstantes(String sapeurPompierId)` - Récupérer les constantes
- `getHistoriquePoids(String sapeurPompierId)` - Récupérer l'historique du poids

### Examen Incorporation
- `saveExamenIncorporation(ExamenIncorporation)` - Enregistrer l'examen
- `getExamenIncorporation(String sapeurPompierId)` - Récupérer l'examen

### Opérations
- `saveOperation(Operation)` - Enregistrer une opération
- `getOperations(String sapeurPompierId)` - Récupérer toutes les opérations
- `deleteOperation(String id)` - Supprimer une opération

### Vaccinations
- `saveVaccination(Vaccination)` - Enregistrer une vaccination
- `getVaccinations(String sapeurPompierId)` - Récupérer toutes les vaccinations
- `deleteVaccination(String id)` - Supprimer une vaccination

---

## 📱 Navigation recommandée

Pour intégrer ces écrans dans votre application, ajoutez les routes dans votre système de navigation:

```dart
// Exemple avec named routes
routes: {
  '/livret/etat-civil': (context) => EtatCivilScreen(
    sapeurPompierId: ModalRoute.of(context)!.settings.arguments as String,
  ),
  '/livret/constantes': (context) => ConstantesScreen(
    sapeurPompierId: ModalRoute.of(context)!.settings.arguments as String,
  ),
  '/livret/examen-incorporation': (context) => ExamenIncorporationScreen(
    sapeurPompierId: ModalRoute.of(context)!.settings.arguments as String,
  ),
  '/livret/operations': (context) => OperationsScreen(
    sapeurPompierId: ModalRoute.of(context)!.settings.arguments as String,
  ),
  '/livret/vaccinations': (context) => VaccinationsScreen(
    sapeurPompierId: ModalRoute.of(context)!.settings.arguments as String,
  ),
}
```

---

## ✅ Fonctionnalités communes

- **Auto-save:** État civil uniquement (toutes les 2 minutes)
- **Validation:** Tous les formulaires ont une validation complète
- **Upload de fichiers:** Photo, empreintes, signatures
- **Dates:** Sélecteur de date en français avec formatage dd/MM/yyyy
- **Messages:** SnackBar pour feedback utilisateur
- **États:** Gestion propre du loading, error, success
- **Responsive:** S'adapte aux différentes tailles d'écran

---

## 🔒 Sécurité & Validation

### Validations implémentées:
- **État civil:** Nom et prénoms requis, date de naissance cohérente
- **Constantes:** Taille entre 100-250cm, poids entre 30-200kg
- **Opérations:** Maximum 6 opérations, date retour après date départ
- **Vaccinations:** Date vaccination pas dans le futur, type requis

### Gestion des erreurs:
- Tous les appels repository utilisent `Either<Failure, T>`
- Messages d'erreur affichés dans des SnackBar rouges
- État de chargement pendant les opérations asynchrones

---

## 📦 Dépendances requises

Assurez-vous que ces packages sont dans votre `pubspec.yaml`:

```yaml
dependencies:
  flutter_riverpod: ^2.4.0
  image_picker: ^1.0.4
  intl: ^0.18.1
  equatable: ^2.0.5
  dartz: ^0.10.1
```

---

## 🚀 Prochaines étapes

Ces écrans constituent les 5 premiers écrans du livret sanitaire. Pour compléter le livret, vous pourrez ajouter:

- Visites sanitaires annuelles
- Indisponibilités médicales
- Certificats médicaux
- Décisions de réforme
- Contrôle de fin de service

Le pattern et la structure sont déjà établis, facilitant l'ajout de nouveaux écrans similaires.

---

**Développé avec Flutter & Riverpod**
Version: 1.0.0
Date: Février 2026
