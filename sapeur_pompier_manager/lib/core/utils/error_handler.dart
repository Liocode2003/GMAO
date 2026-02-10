import 'package:logger/logger.dart';
import '../errors/failures.dart';

/// Gestionnaire d'erreurs centralisé de l'application.
///
/// Responsabilités:
/// - Traduire chaque type de [Failure] en message utilisateur lisible en français
/// - Fournir des suggestions de résolution contextuelles
/// - Logger les erreurs de façon structurée (console en dev, fichier en prod)
/// - Indiquer si une erreur est récupérable (nouvelle tentative possible)
class ErrorHandler {
  ErrorHandler._();

  static final Logger _logger = Logger(
    printer: PrettyPrinter(
      methodCount: 3,
      errorMethodCount: 8,
      lineLength: 100,
      colors: true,
      printEmojis: true,
      dateTimeFormat: DateTimeFormat.onlyTimeAndSinceStart,
    ),
    level: Level.debug,
  );

  // ---------------------------------------------------------------------------
  // Message utilisateur
  // ---------------------------------------------------------------------------

  /// Traduit un [Failure] en message lisible par l'utilisateur (français).
  ///
  /// Pour [ValidationFailure], le message de la failure est retourné directement
  /// car il est déjà spécifique au contexte métier.
  static String getErrorMessage(Failure failure) {
    return switch (failure) {
      DatabaseFailure() =>
        'Erreur de base de données. Vérifiez l\'espace disque disponible.',
      AuthenticationFailure() =>
        'Identifiants incorrects. Vérifiez votre nom d\'utilisateur et mot de passe.',
      ValidationFailure() => failure.message,
      NetworkFailure() =>
        'Connexion impossible. Vérifiez votre réseau et réessayez.',
      NotFoundFailure() =>
        'Élément introuvable. Il a peut-être été supprimé ou déplacé.',
      PermissionFailure() =>
        'Accès refusé. Vous ne disposez pas des droits nécessaires.',
      FileFailure() =>
        'Erreur de fichier. Vérifiez que le fichier existe et est accessible.',
      PdfFailure() =>
        'Impossible de générer le PDF. Vérifiez l\'espace disque disponible.',
      BackupFailure() =>
        'Erreur de sauvegarde. Vérifiez le répertoire de destination.',
      ConflictFailure() =>
        'Conflit de données. Un enregistrement similaire existe déjà.',
      UnknownFailure() =>
        'Erreur inattendue. Contactez l\'administrateur système.',
      _ => 'Une erreur est survenue. Veuillez réessayer.',
    };
  }

  // ---------------------------------------------------------------------------
  // Suggestion de résolution
  // ---------------------------------------------------------------------------

  /// Retourne une suggestion d'action pour aider l'utilisateur à résoudre l'erreur.
  ///
  /// Retourne `null` si aucune suggestion pertinente n'est disponible.
  static String? getSuggestion(Failure failure) {
    return switch (failure) {
      DatabaseFailure() =>
        'Libérez de l\'espace disque ou redémarrez l\'application. '
            'Si le problème persiste, restaurez une sauvegarde récente.',
      AuthenticationFailure() =>
        'Vérifiez que le verrou majuscules n\'est pas activé. '
            'Contactez l\'administrateur si vous avez oublié vos identifiants.',
      ValidationFailure() => null,
      NetworkFailure() =>
        'Vérifiez votre connexion Wi-Fi ou réseau local. '
            'Redémarrez votre équipement réseau si nécessaire.',
      NotFoundFailure() =>
        'Actualisez la liste et vérifiez que l\'élément n\'a pas été supprimé par un autre utilisateur.',
      PermissionFailure() =>
        'Connectez-vous avec un compte disposant des droits requis '
            'ou demandez une élévation de privilèges à l\'administrateur.',
      FileFailure() =>
        'Vérifiez que le chemin du fichier est correct et que vous avez '
            'les droits de lecture/écriture sur ce répertoire.',
      PdfFailure() =>
        'Fermez les autres applications et libérez de la mémoire, '
            'puis réessayez la génération du PDF.',
      BackupFailure() =>
        'Vérifiez que le répertoire de sauvegarde est accessible en écriture '
            'et qu\'il dispose de suffisamment d\'espace libre.',
      ConflictFailure() =>
        'Vérifiez si un enregistrement avec le même matricule ou identifiant '
            'existe déjà dans la base de données.',
      UnknownFailure() =>
        'Notez les étapes qui ont conduit à l\'erreur et contactez le support technique.',
      _ => null,
    };
  }

  // ---------------------------------------------------------------------------
  // Récupérabilité
  // ---------------------------------------------------------------------------

  /// Indique si l'erreur est récupérable, c'est-à-dire si l'utilisateur peut
  /// réessayer l'opération sans modification.
  ///
  /// Les erreurs de validation et de permission ne sont pas récupérables
  /// par une simple nouvelle tentative.
  static bool isRecoverable(Failure failure) {
    return switch (failure) {
      ValidationFailure() => false,
      PermissionFailure() => false,
      AuthenticationFailure() => false,
      ConflictFailure() => false,
      NotFoundFailure() => false,
      DatabaseFailure() => true,
      NetworkFailure() => true,
      FileFailure() => true,
      PdfFailure() => true,
      BackupFailure() => true,
      UnknownFailure() => true,
      _ => true,
    };
  }

  // ---------------------------------------------------------------------------
  // Catégorisation
  // ---------------------------------------------------------------------------

  /// Retourne la catégorie de l'erreur pour le filtrage et l'affichage.
  static ErrorCategory getCategory(Failure failure) {
    return switch (failure) {
      DatabaseFailure() => ErrorCategory.database,
      AuthenticationFailure() => ErrorCategory.authentication,
      ValidationFailure() => ErrorCategory.validation,
      NetworkFailure() => ErrorCategory.network,
      NotFoundFailure() => ErrorCategory.notFound,
      PermissionFailure() => ErrorCategory.permission,
      FileFailure() || PdfFailure() || BackupFailure() => ErrorCategory.file,
      ConflictFailure() => ErrorCategory.conflict,
      _ => ErrorCategory.unknown,
    };
  }

  // ---------------------------------------------------------------------------
  // Logging
  // ---------------------------------------------------------------------------

  /// Logue une erreur avec son contexte.
  ///
  /// [context] identifie l'opération en cours (ex: 'SaveEtatCivil', 'LoginUser').
  /// [error] est l'objet exception ou Failure.
  /// [stackTrace] est la trace de pile optionnelle.
  static void logError(
    String context,
    dynamic error, [
    StackTrace? stackTrace,
  ]) {
    _logger.e(
      '[$context] ${_formatError(error)}',
      error: error,
      stackTrace: stackTrace,
    );
  }

  /// Logue un avertissement (situation anormale non bloquante).
  static void logWarning(String context, dynamic warning) {
    _logger.w('[$context] $warning');
  }

  /// Logue une information de débogage.
  static void logDebug(String context, String message) {
    _logger.d('[$context] $message');
  }

  /// Logue une information applicative (opération réussie notable).
  static void logInfo(String context, String message) {
    _logger.i('[$context] $message');
  }

  // ---------------------------------------------------------------------------
  // Helpers privés
  // ---------------------------------------------------------------------------

  static String _formatError(dynamic error) {
    if (error is Failure) {
      return 'Failure(${error.runtimeType}): ${error.message}';
    }
    if (error is Exception) {
      return 'Exception(${error.runtimeType}): $error';
    }
    return 'Error: $error';
  }
}

// ---------------------------------------------------------------------------
// ErrorCategory enum
// ---------------------------------------------------------------------------

/// Catégories d'erreurs pour la classification et le filtrage.
enum ErrorCategory {
  /// Erreurs liées à la base de données SQLite
  database,

  /// Erreurs d'authentification et de session
  authentication,

  /// Erreurs de validation des données saisies
  validation,

  /// Erreurs réseau (connexion, timeout)
  network,

  /// Ressource introuvable
  notFound,

  /// Permissions insuffisantes
  permission,

  /// Erreurs liées aux fichiers (lecture, écriture, PDF, backup)
  file,

  /// Conflits de données (doublons)
  conflict,

  /// Erreurs inconnues
  unknown;

  /// Libellé français de la catégorie.
  String get label => switch (this) {
        ErrorCategory.database => 'Base de données',
        ErrorCategory.authentication => 'Authentification',
        ErrorCategory.validation => 'Validation',
        ErrorCategory.network => 'Réseau',
        ErrorCategory.notFound => 'Introuvable',
        ErrorCategory.permission => 'Permission',
        ErrorCategory.file => 'Fichier',
        ErrorCategory.conflict => 'Conflit',
        ErrorCategory.unknown => 'Inconnu',
      };
}
