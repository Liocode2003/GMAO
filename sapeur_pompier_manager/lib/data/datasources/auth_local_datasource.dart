import 'package:bcrypt/bcrypt.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/errors/failures.dart';
import '../../domain/entities/user.dart';
import '../models/user_model.dart';
import 'local_database.dart';

/// Datasource pour l'authentification locale
class AuthLocalDatasource {
  final LocalDatabase database;
  final SharedPreferences prefs;

  static const String _keyCurrentUserId = 'current_user_id';
  static const String _keySessionToken = 'session_token';
  static const String _keyLastActivity = 'last_activity';

  AuthLocalDatasource({
    required this.database,
    required this.prefs,
  });

  /// Hashage d'un mot de passe avec bcrypt
  /// Utilise un coût de 12 pour un bon équilibre sécurité/performance
  String hashPassword(String password) {
    return BCrypt.hashpw(password, BCrypt.gensalt(logRounds: 12));
  }

  /// Vérification d'un mot de passe contre un hash bcrypt
  bool verifyPassword(String password, String hashedPassword) {
    try {
      return BCrypt.checkpw(password, hashedPassword);
    } catch (e) {
      return false;
    }
  }

  /// Génère un token de session unique
  String generateSessionToken() {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final random = BCrypt.gensalt();
    return BCrypt.hashpw('$timestamp$random', BCrypt.gensalt(logRounds: 10));
  }

  /// Authentifie un utilisateur avec username et password
  Future<UserModel> login(String username, String password) async {
    try {
      final db = await database.database;

      // Recherche de l'utilisateur par username
      final results = await db.query(
        'users',
        where: 'username = ?',
        whereArgs: [username],
        limit: 1,
      );

      if (results.isEmpty) {
        throw AuthenticationFailure('Nom d\'utilisateur ou mot de passe incorrect');
      }

      final userData = results.first;
      final hashedPassword = userData['password_hash'] as String;

      // Vérification du mot de passe
      if (!verifyPassword(password, hashedPassword)) {
        throw AuthenticationFailure('Nom d\'utilisateur ou mot de passe incorrect');
      }

      // Vérification que l'utilisateur est actif
      final isActive = (userData['is_active'] as int) == 1;
      if (!isActive) {
        throw AuthenticationFailure('Ce compte est désactivé');
      }

      // Mise à jour de la date de dernière connexion
      await db.update(
        'users',
        {'last_login': DateTime.now().toIso8601String()},
        where: 'id = ?',
        whereArgs: [userData['id']],
      );

      // Création d'une session
      final sessionToken = generateSessionToken();
      await prefs.setString(_keyCurrentUserId, userData['id'] as String);
      await prefs.setString(_keySessionToken, sessionToken);
      await prefs.setString(_keyLastActivity, DateTime.now().toIso8601String());

      // Log de l'accès
      await _logAccess(
        userData['id'] as String,
        'login',
        null,
      );

      return UserModel.fromDatabase(userData);
    } catch (e) {
      if (e is AuthenticationFailure) rethrow;
      throw DatabaseFailure('Erreur lors de la connexion: ${e.toString()}');
    }
  }

  /// Déconnexion de l'utilisateur courant
  Future<void> logout() async {
    try {
      final userId = prefs.getString(_keyCurrentUserId);

      if (userId != null) {
        await _logAccess(userId, 'logout', null);
      }

      // Suppression de la session
      await prefs.remove(_keyCurrentUserId);
      await prefs.remove(_keySessionToken);
      await prefs.remove(_keyLastActivity);
    } catch (e) {
      throw DatabaseFailure('Erreur lors de la déconnexion: ${e.toString()}');
    }
  }

  /// Récupère l'utilisateur actuellement connecté
  Future<UserModel?> getCurrentUser() async {
    try {
      final userId = prefs.getString(_keyCurrentUserId);
      if (userId == null) return null;

      // Vérification de l'activité récente (timeout après 30 minutes)
      final lastActivityStr = prefs.getString(_keyLastActivity);
      if (lastActivityStr != null) {
        final lastActivity = DateTime.parse(lastActivityStr);
        final now = DateTime.now();
        final difference = now.difference(lastActivity).inMinutes;

        if (difference > 30) {
          // Session expirée
          await logout();
          return null;
        }
      }

      // Mise à jour de la dernière activité
      await prefs.setString(_keyLastActivity, DateTime.now().toIso8601String());

      final db = await database.database;
      final results = await db.query(
        'users',
        where: 'id = ? AND is_active = ?',
        whereArgs: [userId, 1],
        limit: 1,
      );

      if (results.isEmpty) {
        await logout();
        return null;
      }

      return UserModel.fromDatabase(results.first);
    } catch (e) {
      throw DatabaseFailure('Erreur lors de la récupération de l\'utilisateur: ${e.toString()}');
    }
  }

  /// Vérifie si un utilisateur est connecté
  Future<bool> isLoggedIn() async {
    final user = await getCurrentUser();
    return user != null;
  }

  /// Crée un nouvel utilisateur
  Future<UserModel> createUser(
    String username,
    String email,
    String password,
    String role,
    String? nomComplet,
  ) async {
    try {
      final db = await database.database;

      // Vérification que le username n'existe pas déjà
      final existing = await db.query(
        'users',
        where: 'username = ?',
        whereArgs: [username],
        limit: 1,
      );

      if (existing.isNotEmpty) {
        throw ValidationFailure('Ce nom d\'utilisateur est déjà utilisé');
      }

      // Hashage du mot de passe
      final hashedPassword = hashPassword(password);

      // Création de l'utilisateur
      final userId = DateTime.now().millisecondsSinceEpoch.toString();
      final now = DateTime.now().toIso8601String();

      final userData = {
        'id': userId,
        'username': username,
        'email': email,
        'password_hash': hashedPassword,
        'role': role,
        'nom_complet': nomComplet,
        'created_at': now,
        'is_active': 1,
      };

      await db.insert('users', userData);

      // Log de la création
      final currentUserId = prefs.getString(_keyCurrentUserId);
      if (currentUserId != null) {
        await _logAccess(currentUserId, 'create_user', userId);
      }

      return UserModel.fromDatabase(userData);
    } catch (e) {
      if (e is ValidationFailure) rethrow;
      throw DatabaseFailure('Erreur lors de la création de l\'utilisateur: ${e.toString()}');
    }
  }

  /// Change le mot de passe d'un utilisateur
  Future<void> changePassword(String userId, String newPassword) async {
    try {
      final db = await database.database;
      final hashedPassword = hashPassword(newPassword);

      await db.update(
        'users',
        {'password_hash': hashedPassword},
        where: 'id = ?',
        whereArgs: [userId],
      );

      // Log du changement
      final currentUserId = prefs.getString(_keyCurrentUserId);
      if (currentUserId != null) {
        await _logAccess(currentUserId, 'change_password', userId);
      }
    } catch (e) {
      throw DatabaseFailure('Erreur lors du changement de mot de passe: ${e.toString()}');
    }
  }

  /// Récupère tous les utilisateurs
  Future<List<UserModel>> getAllUsers() async {
    try {
      final db = await database.database;
      final results = await db.query(
        'users',
        orderBy: 'created_at DESC',
      );

      return results.map((data) => UserModel.fromDatabase(data)).toList();
    } catch (e) {
      throw DatabaseFailure('Erreur lors de la récupération des utilisateurs: ${e.toString()}');
    }
  }

  /// Met à jour un utilisateur (sans changer le mot de passe)
  Future<UserModel> updateUser(User user) async {
    try {
      final db = await database.database;
      final model = UserModel.fromEntity(user);

      await db.update(
        'users',
        model.toDatabase(),
        where: 'id = ?',
        whereArgs: [user.id],
      );

      // Log de la modification
      final currentUserId = prefs.getString(_keyCurrentUserId);
      if (currentUserId != null) {
        await _logAccess(currentUserId, 'update_user', user.id);
      }

      return model;
    } catch (e) {
      throw DatabaseFailure('Erreur lors de la mise à jour de l\'utilisateur: ${e.toString()}');
    }
  }

  /// Supprime un utilisateur
  Future<void> deleteUser(String userId) async {
    try {
      final db = await database.database;

      // Vérification qu'on ne supprime pas le dernier admin
      final adminCount = await db.rawQuery(
        'SELECT COUNT(*) as count FROM users WHERE role = ? AND is_active = 1',
        ['admin'],
      );

      final count = adminCount.first['count'] as int;
      if (count <= 1) {
        final userToDelete = await db.query(
          'users',
          where: 'id = ?',
          whereArgs: [userId],
          limit: 1,
        );

        if (userToDelete.isNotEmpty &&
            userToDelete.first['role'] == 'admin') {
          throw ValidationFailure('Impossible de supprimer le dernier administrateur');
        }
      }

      await db.delete(
        'users',
        where: 'id = ?',
        whereArgs: [userId],
      );

      // Log de la suppression
      final currentUserId = prefs.getString(_keyCurrentUserId);
      if (currentUserId != null) {
        await _logAccess(currentUserId, 'delete_user', userId);
      }
    } catch (e) {
      if (e is ValidationFailure) rethrow;
      throw DatabaseFailure('Erreur lors de la suppression de l\'utilisateur: ${e.toString()}');
    }
  }

  /// Log d'un accès/action dans la base de données
  Future<void> _logAccess(
    String userId,
    String action,
    String? sapeurPompierId,
  ) async {
    try {
      final db = await database.database;
      final logId = DateTime.now().millisecondsSinceEpoch.toString();

      await db.insert('access_logs', {
        'id': logId,
        'user_id': userId,
        'action': action,
        'sapeur_pompier_id': sapeurPompierId,
        'timestamp': DateTime.now().toIso8601String(),
      });
    } catch (e) {
      // Les erreurs de log ne doivent pas bloquer l'opération principale
      print('Erreur lors du log d\'accès: $e');
    }
  }

  /// Enregistre une action utilisateur (pour les logs)
  Future<void> logAccess(
    String userId,
    String action,
    String? sapeurPompierId,
  ) async {
    await _logAccess(userId, action, sapeurPompierId);
  }
}
