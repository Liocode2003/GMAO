import 'package:dartz/dartz.dart';
import 'package:sapeur_pompier_manager/core/errors/failures.dart';
import 'package:sapeur_pompier_manager/domain/entities/user.dart';

/// Interface du repository pour l'authentification
abstract class AuthRepository {
  /// Login avec nom d'utilisateur et mot de passe
  Future<Either<Failure, User>> login(String username, String password);

  /// Déconnexion
  Future<Either<Failure, void>> logout();

  /// Obtenir l'utilisateur actuellement connecté
  Future<Either<Failure, User?>> getCurrentUser();

  /// Vérifier si l'utilisateur est connecté
  Future<bool> isLoggedIn();

  /// Créer un nouvel utilisateur (admin only)
  Future<Either<Failure, User>> createUser(User user, String password);

  /// Obtenir tous les utilisateurs
  Future<Either<Failure, List<User>>> getAllUsers();

  /// Mettre à jour un utilisateur
  Future<Either<Failure, User>> updateUser(User user);

  /// Supprimer un utilisateur
  Future<Either<Failure, void>> deleteUser(String id);

  /// Changer le mot de passe
  Future<Either<Failure, void>> changePassword(
    String userId,
    String newPassword,
  );

  /// Réinitialiser le mot de passe
  Future<Either<Failure, void>> resetPassword(String userId);

  /// Enregistrer un log d'accès
  Future<Either<Failure, void>> logAccess(
    String userId,
    String action,
    String? sapeurPompierId,
  );

  /// Obtenir les logs d'accès
  Future<Either<Failure, List<Map<String, dynamic>>>> getAccessLogs({
    String? userId,
    DateTime? startDate,
    DateTime? endDate,
  });
}
