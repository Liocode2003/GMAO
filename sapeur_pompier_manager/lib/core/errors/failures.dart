import 'package:equatable/equatable.dart';

/// Classe de base pour tous les échecs/erreurs de l'application
abstract class Failure extends Equatable {
  final String message;

  const Failure(this.message);

  @override
  List<Object> get props => [message];
}

/// Erreur de base de données
class DatabaseFailure extends Failure {
  const DatabaseFailure([String message = 'Erreur de base de données'])
      : super(message);
}

/// Erreur de validation
class ValidationFailure extends Failure {
  const ValidationFailure([String message = 'Erreur de validation'])
      : super(message);
}

/// Erreur d'authentification
class AuthenticationFailure extends Failure {
  const AuthenticationFailure(
      [String message = 'Erreur d\'authentification'])
      : super(message);
}

/// Erreur de permission
class PermissionFailure extends Failure {
  const PermissionFailure(
      [String message = 'Vous n\'avez pas les permissions nécessaires'])
      : super(message);
}

/// Erreur de fichier
class FileFailure extends Failure {
  const FileFailure([String message = 'Erreur lors de la manipulation du fichier'])
      : super(message);
}

/// Erreur de génération PDF
class PdfFailure extends Failure {
  const PdfFailure([String message = 'Erreur lors de la génération du PDF'])
      : super(message);
}

/// Erreur réseau (si besoin futur)
class NetworkFailure extends Failure {
  const NetworkFailure([String message = 'Erreur de connexion réseau'])
      : super(message);
}

/// Erreur de backup/restore
class BackupFailure extends Failure {
  const BackupFailure([String message = 'Erreur lors de la sauvegarde'])
      : super(message);
}

/// Erreur inconnue
class UnknownFailure extends Failure {
  const UnknownFailure([String message = 'Une erreur inconnue s\'est produite'])
      : super(message);
}

/// Erreur de données introuvables
class NotFoundFailure extends Failure {
  const NotFoundFailure([String message = 'Données introuvables'])
      : super(message);
}

/// Erreur de conflit (données en double)
class ConflictFailure extends Failure {
  const ConflictFailure([String message = 'Conflit de données'])
      : super(message);
}
