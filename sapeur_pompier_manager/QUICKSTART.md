# 🚀 Guide de démarrage rapide

## Démarrage en 5 minutes

### 1. Prérequis
```bash
# Vérifier Flutter
flutter doctor

# Activer desktop
flutter config --enable-windows-desktop   # Windows
flutter config --enable-macos-desktop     # macOS
flutter config --enable-linux-desktop     # Linux
```

### 2. Installation
```bash
cd sapeur_pompier_manager
flutter pub get
```

### 3. Lancement
```bash
# Windows
flutter run -d windows

# macOS
flutter run -d macos

# Linux
flutter run -d linux
```

### 4. Connexion
- **Utilisateur** : `admin`
- **Mot de passe** : `admin123`

---

## 📂 Structure du code source

```
lib/
├── main.dart                  # Point d'entrée ✅
├── core/                      # Utilitaires partagés ✅
│   ├── constants/
│   │   ├── app_colors.dart    # Palette de couleurs
│   │   └── app_strings.dart   # Textes en français
│   ├── errors/
│   │   └── failures.dart      # Types d'erreurs
│   └── utils/
│       ├── validators.dart    # Validation formulaires
│       └── date_formatter.dart
│
├── domain/                    # Logique métier ✅
│   ├── entities/              # 12 entities créées
│   ├── repositories/          # 2 interfaces
│   └── usecases/              # 6 usecases de base
│
├── data/                      # Couche données 🚧
│   ├── datasources/
│   │   ├── local_database.dart  ✅ SQLite configuré
│   │   └── auth_local_datasource.dart  ⏳ À créer
│   ├── models/                ⏳ 12 models à créer
│   └── repositories/          ⏳ 2 implémentations
│
└── presentation/              # Interface utilisateur ⏳
    ├── providers/             # State management
    ├── screens/               # Écrans de l'app
    └── widgets/               # Composants UI
```

---

## 🎯 Prochaines tâches prioritaires

### Task 1 : Créer le premier model
**Fichier** : `lib/data/models/user_model.dart`

```dart
import 'package:sapeur_pompier_manager/domain/entities/user.dart';

class UserModel extends User {
  const UserModel({
    required super.id,
    required super.username,
    required super.email,
    required super.role,
    super.nomComplet,
    required super.createdAt,
    super.lastLogin,
    super.isActive,
  });

  // De JSON
  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      username: json['username'] as String,
      email: json['email'] as String,
      role: json['role'] as String,
      nomComplet: json['nom_complet'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      lastLogin: json['last_login'] != null
          ? DateTime.parse(json['last_login'] as String)
          : null,
      isActive: (json['is_active'] as int) == 1,
    );
  }

  // Vers JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'role': role,
      'nom_complet': nomComplet,
      'created_at': createdAt.toIso8601String(),
      'last_login': lastLogin?.toIso8601String(),
      'is_active': isActive ? 1 : 0,
    };
  }

  // De la base de données
  factory UserModel.fromDatabase(Map<String, dynamic> map) {
    return UserModel.fromJson(map);
  }

  // Vers la base de données
  Map<String, dynamic> toDatabase() {
    return toJson();
  }
}
```

### Task 2 : Implémenter AuthRepository
**Fichier** : `lib/data/repositories/auth_repository_impl.dart`

```dart
import 'package:dartz/dartz.dart';
import 'package:bcrypt/bcrypt.dart';
import 'package:sapeur_pompier_manager/core/errors/failures.dart';
import 'package:sapeur_pompier_manager/domain/entities/user.dart';
import 'package:sapeur_pompier_manager/domain/repositories/auth_repository.dart';
import 'package:sapeur_pompier_manager/data/datasources/local_database.dart';
import 'package:sapeur_pompier_manager/data/models/user_model.dart';

class AuthRepositoryImpl implements AuthRepository {
  final LocalDatabase database;

  AuthRepositoryImpl(this.database);

  @override
  Future<Either<Failure, User>> login(String username, String password) async {
    try {
      final db = await database.database;

      final results = await db.query(
        'users',
        where: 'username = ? AND is_active = 1',
        whereArgs: [username],
      );

      if (results.isEmpty) {
        return const Left(AuthenticationFailure('Utilisateur introuvable'));
      }

      final userData = results.first;
      final passwordHash = userData['password_hash'] as String;

      // Vérifier le mot de passe avec bcrypt
      final isValid = BCrypt.checkpw(password, passwordHash);

      if (!isValid) {
        return const Left(AuthenticationFailure('Mot de passe incorrect'));
      }

      // Mettre à jour last_login
      await db.update(
        'users',
        {'last_login': DateTime.now().toIso8601String()},
        where: 'id = ?',
        whereArgs: [userData['id']],
      );

      final user = UserModel.fromDatabase(userData);
      return Right(user);
    } catch (e) {
      return Left(DatabaseFailure(e.toString()));
    }
  }

  // Implémenter les autres méthodes...
}
```

### Task 3 : Créer AuthProvider
**Fichier** : `lib/presentation/providers/auth_provider.dart`

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:sapeur_pompier_manager/domain/entities/user.dart';
import 'package:sapeur_pompier_manager/domain/repositories/auth_repository.dart';
import 'package:sapeur_pompier_manager/domain/usecases/login_user.dart';

// État d'authentification
class AuthState {
  final User? user;
  final bool isLoading;
  final String? error;

  const AuthState({
    this.user,
    this.isLoading = false,
    this.error,
  });

  bool get isAuthenticated => user != null;

  AuthState copyWith({User? user, bool? isLoading, String? error}) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

// Provider pour l'authentification
class AuthNotifier extends StateNotifier<AuthState> {
  final LoginUser loginUseCase;

  AuthNotifier(this.loginUseCase) : super(const AuthState());

  Future<void> login(String username, String password) async {
    state = state.copyWith(isLoading: true, error: null);

    final result = await loginUseCase(
      username: username,
      password: password,
    );

    result.fold(
      (failure) => state = state.copyWith(
        isLoading: false,
        error: failure.message,
      ),
      (user) => state = state.copyWith(
        user: user,
        isLoading: false,
      ),
    );
  }

  void logout() {
    state = const AuthState();
  }
}

// Providers
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  // TODO: Injecter les dépendances
  throw UnimplementedError('Configurer les dépendances d\'abord');
});
```

### Task 4 : Créer LoginScreen
**Fichier** : `lib/presentation/screens/auth/login_screen.dart`

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:sapeur_pompier_manager/core/constants/app_colors.dart';
import 'package:sapeur_pompier_manager/core/constants/app_strings.dart';
import 'package:sapeur_pompier_manager/presentation/providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      body: Center(
        child: Card(
          elevation: 8,
          margin: const EdgeInsets.all(32),
          child: Container(
            constraints: const BoxConstraints(maxWidth: 400),
            padding: const EdgeInsets.all(32),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.local_fire_department,
                    size: 64,
                    color: AppColors.primary,
                  ),
                  const SizedBox(height: 24),
                  Text(
                    AppStrings.login,
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                  const SizedBox(height: 32),

                  // Champ username
                  TextFormField(
                    controller: _usernameController,
                    decoration: InputDecoration(
                      labelText: AppStrings.username,
                      prefixIcon: const Icon(Icons.person),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return AppStrings.requiredField;
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Champ password
                  TextFormField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    decoration: InputDecoration(
                      labelText: AppStrings.password,
                      prefixIcon: const Icon(Icons.lock),
                      suffixIcon: IconButton(
                        icon: Icon(_obscurePassword
                            ? Icons.visibility
                            : Icons.visibility_off),
                        onPressed: () {
                          setState(() {
                            _obscurePassword = !_obscurePassword;
                          });
                        },
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return AppStrings.passwordRequired;
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 24),

                  // Message d'erreur
                  if (authState.error != null)
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.error.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        authState.error!,
                        style: const TextStyle(color: AppColors.error),
                      ),
                    ),
                  if (authState.error != null) const SizedBox(height: 16),

                  // Bouton de connexion
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: authState.isLoading ? null : _handleLogin,
                      child: authState.isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Text(AppStrings.loginButton),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _handleLogin() {
    if (_formKey.currentState!.validate()) {
      ref.read(authProvider.notifier).login(
            _usernameController.text,
            _passwordController.text,
          );
    }
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}
```

---

## 🔧 Commandes utiles

### Développement
```bash
# Lancer en mode debug
flutter run -d windows

# Hot reload
# Appuyez sur 'r' dans le terminal

# Hot restart
# Appuyez sur 'R' dans le terminal

# Analyser le code
flutter analyze

# Formater le code
flutter format lib/
```

### Build
```bash
# Release Windows
flutter build windows --release

# Release macOS
flutter build macos --release

# Release Linux
flutter build linux --release
```

### Base de données
La base de données se trouve ici :
- **Windows** : `C:\Users\<You>\Documents\sapeur_pompier_db.sqlite`
- **macOS/Linux** : `~/Documents/sapeur_pompier_db.sqlite`

Pour la réinitialiser, supprimez simplement ce fichier.

---

## 📚 Ressources

### Documentation officielle
- [Flutter Desktop](https://docs.flutter.dev/desktop)
- [Riverpod](https://riverpod.dev/)
- [SQLite](https://pub.dev/packages/sqflite)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

### Tutoriels recommandés
- [Flutter Desktop Setup](https://www.youtube.com/watch?v=hg4TUYRaLhg)
- [Clean Architecture in Flutter](https://www.youtube.com/watch?v=KjE2IDphA_U)
- [Riverpod Complete Guide](https://www.youtube.com/watch?v=A3AkCrVuFh4)

---

## 💡 Conseils

### Bonnes pratiques
✅ Toujours valider les formulaires avant sauvegarde
✅ Gérer les erreurs avec Either<Failure, T>
✅ Tester sur les 3 plateformes (Windows/Mac/Linux)
✅ Commenter en français
✅ Commit souvent avec messages descriptifs

### Pièges à éviter
❌ Ne pas modifier directement les entities
❌ Ne pas accéder à la DB depuis la couche presentation
❌ Ne pas mélanger logique métier et UI
❌ Ne pas oublier le .gitignore pour les données sensibles

---

## 🆘 Problèmes courants

### Erreur : "Database is locked"
**Solution** : Fermer toutes les instances de l'app

### Erreur : "Package not found"
**Solution** :
```bash
flutter clean
flutter pub get
```

### Erreur : "Desktop not enabled"
**Solution** :
```bash
flutter config --enable-windows-desktop
```

### L'app ne se lance pas
**Solution** :
```bash
flutter doctor
flutter pub get
flutter run -d windows -v  # Mode verbose pour plus d'infos
```

---

## 🎓 Apprendre Flutter Desktop

### Jour 1-2 : Bases
- Installer Flutter
- Créer une app Hello World
- Comprendre les widgets de base

### Jour 3-5 : State Management
- Apprendre Riverpod
- Provider vs StateNotifier
- Gérer l'état global

### Jour 6-10 : Architecture
- Clean Architecture
- Separation of Concerns
- Dependency Injection

### Jour 11-15 : Ce projet
- Comprendre la structure
- Créer les premiers models
- Implémenter l'authentification

---

**Bon courage ! 🚀**

Pour toute question, consultez README.md ou PROJECT_STATUS.md
