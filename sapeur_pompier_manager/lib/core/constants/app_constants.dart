/// Constantes métier et de configuration de l'application
///
/// Regroupe toutes les valeurs fixes utilisées dans l'application :
/// limites métier, formats, rôles, décisions médicales, types d'opérations
/// et descriptions SIGYCOP.
class AppConstants {
  AppConstants._();

  // -------------------------------------------------------------------------
  // Limites métier
  // -------------------------------------------------------------------------

  /// Nombre maximum d'opérations (OPEX/OPINT) enregistrables par dossier.
  /// Correspond aux 6 lignes disponibles dans le livret physique réglementaire.
  static const int maxOperations = 6;

  /// Durée de la session utilisateur avant déconnexion automatique (minutes).
  /// Protège les données médicales en cas d'oubli de déconnexion.
  static const int sessionTimeoutMinutes = 30;

  /// Intervalle de sauvegarde automatique des formulaires en cours (secondes).
  static const int autoSaveIntervalSeconds = 120;

  /// Nombre maximum de fichiers de sauvegarde conservés en rotation.
  /// Au-delà, les plus anciens sont supprimés automatiquement.
  static const int maxBackupFiles = 30;

  /// Nombre de jours avant expiration d'une vaccination pour déclencher
  /// une alerte préventive dans le tableau de bord.
  static const int alertVaccinationDays = 30;

  /// Nombre de jours depuis la dernière visite sanitaire pour déclencher
  /// une alerte (correspondant à la périodicité annuelle réglementaire).
  static const int alertVisiteDays = 365;

  /// Taille minimale du mot de passe utilisateur.
  static const int minPasswordLength = 8;

  /// Taille maximale d'une photo d'identité importée (octets) : 5 Mo.
  static const int maxPhotoSizeBytes = 5 * 1024 * 1024;

  /// Taille maximale d'un fichier certificat importé (octets) : 10 Mo.
  static const int maxCertificatSizeBytes = 10 * 1024 * 1024;

  // -------------------------------------------------------------------------
  // Formats d'affichage
  // -------------------------------------------------------------------------

  /// Format de date standard de l'application.
  static const String dateFormat = 'dd/MM/yyyy';

  /// Format de date et heure pour les horodatages (logs, sauvegardes).
  static const String dateTimeFormat = 'dd/MM/yyyy HH:mm';

  /// Format de date utilisé dans les noms de fichiers de sauvegarde.
  static const String dateFileFormat = 'yyyyMMdd_HHmmss';

  /// Format du matricule sapeur-pompier : SPR suivi de 5 chiffres.
  /// Exemple : SPR-00142, SPR-01987
  static const String matriculeFormat = 'SPR-XXXXX';

  /// Expression régulière de validation du matricule.
  static const String matriculeRegex = r'^SPR-\d{5}$';

  /// Préfixe utilisé lors de la génération automatique d'un matricule.
  static const String matriculePrefix = 'SPR-';

  // -------------------------------------------------------------------------
  // Rôles utilisateurs
  // -------------------------------------------------------------------------

  /// Rôle administrateur : accès complet à toutes les fonctionnalités
  /// y compris la gestion des utilisateurs, les sauvegardes et les paramètres.
  static const String roleAdmin = 'admin';

  /// Rôle médecin : peut créer, lire et modifier tous les dossiers médicaux.
  /// N'a pas accès à la gestion des comptes ni aux paramètres système.
  static const String roleMedecin = 'medecin';

  /// Rôle consultation : accès en lecture seule à tous les dossiers.
  /// Ne peut ni créer, ni modifier, ni supprimer de données.
  static const String roleConsultation = 'consultation';

  /// Liste ordonnée des rôles (du plus au moins privilégié).
  static const List<String> allRoles = [roleAdmin, roleMedecin, roleConsultation];

  /// Labels lisibles des rôles pour l'affichage dans l'interface.
  static const Map<String, String> roleLabels = {
    roleAdmin: 'Administrateur',
    roleMedecin: 'Médecin',
    roleConsultation: 'Consultation',
  };

  // -------------------------------------------------------------------------
  // Décisions médicales
  // -------------------------------------------------------------------------

  /// Décision : sapeur-pompier apte au service actif sans restriction.
  static const String decisionApte = 'Apte';

  /// Décision : inaptitude permanente, entraîne une procédure de réforme.
  static const String decisionInapteDef = 'Inapte définitif';

  /// Décision : inaptitude temporaire avec durée et réévaluation prévue.
  static const String decisionInapteTemp = 'Inapte temporaire';

  /// Décision : apte avec réserves, nécessite un suivi médical renforcé.
  static const String decisionASurveiller = 'À surveiller';

  /// Liste de toutes les décisions médicales possibles.
  static const List<String> decisionsMediacles = [
    decisionApte,
    decisionInapteTemp,
    decisionASurveiller,
    decisionInapteDef,
  ];

  // -------------------------------------------------------------------------
  // Types d'opérations
  // -------------------------------------------------------------------------

  /// Opération Extérieure (déploiement hors zone nationale).
  static const String typeOpex = 'OPEX';

  /// Opération Intérieure (intervention sur le territoire national).
  static const String typeOpint = 'OPINT';

  /// Liste des types d'opérations valides.
  static const List<String> typesOperations = [typeOpex, typeOpint];

  // -------------------------------------------------------------------------
  // Vaccinations réglementaires
  // -------------------------------------------------------------------------

  /// Liste des vaccins obligatoires ou recommandés pour les sapeurs-pompiers
  /// du Burkina Faso, avec leur libellé officiel.
  static const List<String> vaccinsReglementaires = [
    'Antiamaril (fièvre jaune)',
    'Antitétanique',
    'Antiméningite',
    'Anti-COVID-19',
    'Antihépatite B',
    'Antipaludéen',
    'Antityphoïdique',
    'Antipoliomyélitique',
  ];

  /// Libellé pour les vaccinations non répertoriées dans la liste standard.
  static const String vaccinsAutres = 'Autres';

  // -------------------------------------------------------------------------
  // Types de certificats
  // -------------------------------------------------------------------------

  /// Certificat médical relatif à une blessure survenue en service.
  static const String certifBlessure = 'Blessure';

  /// Certificat médical relatif à une maladie.
  static const String certifMaladie = 'Maladie';

  /// Tout autre type de document médical ou administratif.
  static const String certifAutre = 'Autre';

  /// Liste des types de certificats disponibles.
  static const List<String> typesCertificats = [
    certifBlessure,
    certifMaladie,
    certifAutre,
  ];

  // -------------------------------------------------------------------------
  // Types de décisions de réforme
  // -------------------------------------------------------------------------

  /// Décision de réforme : fin de service anticipée pour raisons médicales.
  static const String decisionReforme = 'Réforme';

  /// Décision de rengagement : prolongation du service.
  static const String decisionRengagement = 'Rengagement';

  /// Liste des types de décisions de réforme.
  static const List<String> typesDecisionsReforme = [
    decisionReforme,
    decisionRengagement,
  ];

  // -------------------------------------------------------------------------
  // Profil SIGYCOP
  // -------------------------------------------------------------------------

  /// Descriptions officielles de chaque lettre du profil SIGYCOP.
  ///
  /// Le profil SIGYCOP est le système de cotation médicale militaire utilisé
  /// pour évaluer l'aptitude physique des militaires et sapeurs-pompiers
  /// en Afrique francophone. Chaque lettre correspond à un système organique
  /// coté de 1 (excellent) à 5 (inapte).
  static const Map<String, String> sigycopDescriptions = {
    'S': 'État général et morphologie',
    'I': 'Membres inférieurs - mobilité et résistance',
    'G': 'Membres supérieurs - force et dextérité',
    'Y': 'Yeux - acuité visuelle et sens chromatique',
    'C': 'Appareil circulatoire - cœur et vaisseaux',
    'O': 'Oreilles - acuité auditive',
    'P': 'Psychisme - équilibre psychologique et mental',
  };

  /// Valeurs de cotation SIGYCOP valides (1 = excellent, 5 = inapte).
  static const List<int> sigycopCotations = [1, 2, 3, 4, 5];

  /// Description textuelle de chaque cotation SIGYCOP.
  static const Map<int, String> sigycopCotationLabels = {
    1: 'Excellent',
    2: 'Bon',
    3: 'Moyen',
    4: 'Limité',
    5: 'Inapte',
  };

  // -------------------------------------------------------------------------
  // Noms de fichiers et chemins
  // -------------------------------------------------------------------------

  /// Nom du fichier de base de données SQLite.
  static const String dbFileName = 'sapeurs_pompiers.db';

  /// Préfixe des fichiers de sauvegarde.
  static const String backupPrefix = 'backup_spr_';

  /// Extension des fichiers de sauvegarde.
  static const String backupExtension = '.db';

  /// Nom du dossier de sauvegardes par défaut (relatif au dossier Documents).
  static const String defaultBackupFolder = 'SPR_Backups';

  /// Préfixe des fichiers PDF exportés.
  static const String pdfPrefix = 'livret_spr_';

  /// Extension des fichiers PDF.
  static const String pdfExtension = '.pdf';

  // -------------------------------------------------------------------------
  // Pagination et affichage
  // -------------------------------------------------------------------------

  /// Nombre d'éléments par page dans les listes paginées.
  static const int pageSize = 25;

  /// Délai de debounce pour la recherche en temps réel (millisecondes).
  static const int searchDebounceMs = 300;

  // -------------------------------------------------------------------------
  // Institution par défaut (Burkina Faso)
  // -------------------------------------------------------------------------

  /// Nom complet de l'institution par défaut.
  static const String defaultNomInstitution =
      'Direction Générale de la Protection Civile';

  /// Pays de déploiement de l'application.
  static const String pays = 'Burkina Faso';

  /// Devise nationale (utilisée dans les en-têtes officiels).
  static const String devise = 'La Patrie ou la Mort, Nous Vaincrons';

  // -------------------------------------------------------------------------
  // Contacts d'urgence
  // -------------------------------------------------------------------------

  /// Nombre maximum de contacts d'urgence par sapeur-pompier.
  static const int maxContactsUrgence = 3;

  /// Liens de parenté courants pour les contacts d'urgence.
  static const List<String> liensParente = [
    'Conjoint(e)',
    'Père',
    'Mère',
    'Frère',
    'Sœur',
    'Enfant',
    'Oncle',
    'Tante',
    'Grand-parent',
    'Ami(e) proche',
    'Autre',
  ];
}
