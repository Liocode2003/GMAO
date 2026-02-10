import 'package:dartz/dartz.dart';
import '../../core/errors/failures.dart';
import '../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_local_datasource.dart';
import '../datasources/local_database.dart';

/// Implémentation du repository d'authentification
class AuthRepositoryImpl implements AuthRepository {
  final AuthLocalDatasource datasource;
  final LocalDatabase database;

  AuthRepositoryImpl({
    required this.datasource,
    required this.database,
  });

  @override
  Future<Either<Failure, User>> login(String username, String password) async {
    try {
      final user = await datasource.login(username, password);
      return Right(user);
    } on AuthenticationFailure catch (e) {
      return Left(e);
    } on DatabaseFailure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(UnexpectedFailure('Erreur inattendue lors de la connexion: ${e.toString()}'));
    }
  }

  @override
  Future<Either<Failure, void>> logout() async {
    try {
      await datasource.logout();
      return const Right(null);
    } on DatabaseFailure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(UnexpectedFailure('Erreur inattendue lors de la déconnexion: ${e.toString()}'));
    }
  }

  @override
  Future<Either<Failure, User?>> getCurrentUser() async {
    try {
      final user = await datasource.getCurrentUser();
      return Right(user);
    } on DatabaseFailure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(UnexpectedFailure('Erreur inattendue lors de la récupération de l\'utilisateur: ${e.toString()}'));
    }
  }

  @override
  Future<bool> isLoggedIn() async {
    try {
      return await datasource.isLoggedIn();
    } catch (e) {
      return false;
    }
  }

  @override
  Future<Either<Failure, User>> createUser(User user, String password) async {
    try {
      final createdUser = await datasource.createUser(
        user.username,
        user.email,
        password,
        user.role,
        user.nomComplet,
      );
      return Right(createdUser);
    } on ValidationFailure catch (e) {
      return Left(e);
    } on DatabaseFailure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(UnexpectedFailure('Erreur inattendue lors de la création de l\'utilisateur: ${e.toString()}'));
    }
  }

  @override
  Future<Either<Failure, List<User>>> getAllUsers() async {
    try {
      final users = await datasource.getAllUsers();
      return Right(users);
    } on DatabaseFailure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(UnexpectedFailure('Erreur inattendue lors de la récupération des utilisateurs: ${e.toString()}'));
    }
  }

  @override
  Future<Either<Failure, User>> updateUser(User user) async {
    try {
      final updatedUser = await datasource.updateUser(user);
      return Right(updatedUser);
    } on DatabaseFailure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(UnexpectedFailure('Erreur inattendue lors de la mise à jour de l\'utilisateur: ${e.toString()}'));
    }
  }

  @override
  Future<Either<Failure, void>> deleteUser(String id) async {
    try {
      await datasource.deleteUser(id);
      return const Right(null);
    } on ValidationFailure catch (e) {
      return Left(e);
    } on DatabaseFailure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(UnexpectedFailure('Erreur inattendue lors de la suppression de l\'utilisateur: ${e.toString()}'));
    }
  }

  @override
  Future<Either<Failure, void>> changePassword(
    String userId,
    String newPassword,
  ) async {
    try {
      await datasource.changePassword(userId, newPassword);
      return const Right(null);
    } on DatabaseFailure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(UnexpectedFailure('Erreur inattendue lors du changement de mot de passe: ${e.toString()}'));
    }
  }

  @override
  Future<Either<Failure, void>> resetPassword(String userId) async {
    try {
      // Réinitialise le mot de passe à "reset123"
      // L'utilisateur devra le changer à la première connexion
      const defaultPassword = 'reset123';
      await datasource.changePassword(userId, defaultPassword);
      return const Right(null);
    } on DatabaseFailure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(UnexpectedFailure('Erreur inattendue lors de la réinitialisation du mot de passe: ${e.toString()}'));
    }
  }

  @override
  Future<Either<Failure, void>> logAccess(
    String userId,
    String action,
    String? sapeurPompierId,
  ) async {
    try {
      await datasource.logAccess(userId, action, sapeurPompierId);
      return const Right(null);
    } catch (e) {
      // Les erreurs de log ne doivent pas bloquer l'application
      return const Right(null);
    }
  }

  @override
  Future<Either<Failure, List<Map<String, dynamic>>>> getAccessLogs({
    String? userId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final db = await database.database;

      String whereClause = '1=1';
      List<dynamic> whereArgs = [];

      if (userId != null) {
        whereClause += ' AND user_id = ?';
        whereArgs.add(userId);
      }

      if (startDate != null) {
        whereClause += ' AND timestamp >= ?';
        whereArgs.add(startDate.toIso8601String());
      }

      if (endDate != null) {
        whereClause += ' AND timestamp <= ?';
        whereArgs.add(endDate.toIso8601String());
      }

      final results = await db.query(
        'access_logs',
        where: whereClause,
        whereArgs: whereArgs,
        orderBy: 'timestamp DESC',
        limit: 1000, // Limite à 1000 entrées pour éviter les problèmes de performance
      );

      return Right(results);
    } on DatabaseFailure catch (e) {
      return Left(e);
    } catch (e) {
      return Left(UnexpectedFailure('Erreur inattendue lors de la récupération des logs: ${e.toString()}'));
    }
  }
}
