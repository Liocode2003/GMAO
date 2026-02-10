import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/errors/failures.dart';
import '../../domain/entities/user.dart';
import '../../data/datasources/local_database.dart';
import '../../data/datasources/auth_local_datasource.dart';
import '../../data/repositories/auth_repository_impl.dart';

/// État de l'authentification
class AuthState {
  final User? user;
  final bool isLoading;
  final String? error;
  final bool isAuthenticated;

  const AuthState({
    this.user,
    this.isLoading = false,
    this.error,
    this.isAuthenticated = false,
  });

  AuthState copyWith({
    User? user,
    bool? isLoading,
    String? error,
    bool? isAuthenticated,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
    );
  }
}

/// Provider pour SharedPreferences
final sharedPreferencesProvider = FutureProvider<SharedPreferences>((ref) async {
  return await SharedPreferences.getInstance();
});

/// Provider pour LocalDatabase
final localDatabaseProvider = Provider<LocalDatabase>((ref) {
  return LocalDatabase.instance;
});

/// Provider pour AuthLocalDatasource
final authLocalDatasourceProvider = Provider<AuthLocalDatasource>((ref) {
  final database = ref.watch(localDatabaseProvider);
  final prefs = ref.watch(sharedPreferencesProvider).value;

  if (prefs == null) {
    throw Exception('SharedPreferences not initialized');
  }

  return AuthLocalDatasource(database: database, prefs: prefs);
});

/// Provider pour AuthRepository
final authRepositoryProvider = Provider<AuthRepositoryImpl>((ref) {
  final datasource = ref.watch(authLocalDatasourceProvider);
  final database = ref.watch(localDatabaseProvider);

  return AuthRepositoryImpl(datasource: datasource, database: database);
});

/// Notifier pour gérer l'état d'authentification
class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepositoryImpl repository;

  AuthNotifier(this.repository) : super(const AuthState()) {
    _checkAuthStatus();
  }

  /// Vérifie si un utilisateur est déjà connecté
  Future<void> _checkAuthStatus() async {
    state = state.copyWith(isLoading: true);

    final result = await repository.getCurrentUser();

    result.fold(
      (failure) {
        state = state.copyWith(
          isLoading: false,
          isAuthenticated: false,
          error: failure.message,
        );
      },
      (user) {
        state = state.copyWith(
          user: user,
          isLoading: false,
          isAuthenticated: user != null,
          error: null,
        );
      },
    );
  }

  /// Connexion
  Future<bool> login(String username, String password) async {
    state = state.copyWith(isLoading: true, error: null);

    final result = await repository.login(username, password);

    return result.fold(
      (failure) {
        state = state.copyWith(
          isLoading: false,
          isAuthenticated: false,
          error: failure.message,
        );
        return false;
      },
      (user) {
        state = state.copyWith(
          user: user,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        );
        return true;
      },
    );
  }

  /// Déconnexion
  Future<void> logout() async {
    state = state.copyWith(isLoading: true);

    final result = await repository.logout();

    result.fold(
      (failure) {
        state = state.copyWith(
          isLoading: false,
          error: failure.message,
        );
      },
      (_) {
        state = const AuthState(
          isLoading: false,
          isAuthenticated: false,
        );
      },
    );
  }

  /// Rafraîchir les données de l'utilisateur
  Future<void> refreshUser() async {
    final result = await repository.getCurrentUser();

    result.fold(
      (failure) {
        // En cas d'erreur, on garde l'état actuel
      },
      (user) {
        if (user != null) {
          state = state.copyWith(user: user);
        }
      },
    );
  }

  /// Changer le mot de passe
  Future<bool> changePassword(String userId, String newPassword) async {
    state = state.copyWith(isLoading: true, error: null);

    final result = await repository.changePassword(userId, newPassword);

    return result.fold(
      (failure) {
        state = state.copyWith(
          isLoading: false,
          error: failure.message,
        );
        return false;
      },
      (_) {
        state = state.copyWith(isLoading: false, error: null);
        return true;
      },
    );
  }
}

/// Provider pour AuthNotifier
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  return AuthNotifier(repository);
});

/// Provider helper pour vérifier si l'utilisateur est admin
final isAdminProvider = Provider<bool>((ref) {
  final authState = ref.watch(authProvider);
  return authState.user?.isAdmin ?? false;
});

/// Provider helper pour vérifier si l'utilisateur peut éditer
final canEditProvider = Provider<bool>((ref) {
  final authState = ref.watch(authProvider);
  return authState.user?.canEdit ?? false;
});

/// Provider helper pour vérifier si l'utilisateur est en lecture seule
final isReadOnlyProvider = Provider<bool>((ref) {
  final authState = ref.watch(authProvider);
  return authState.user?.isReadOnly ?? false;
});
