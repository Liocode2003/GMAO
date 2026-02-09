import 'package:equatable/equatable.dart';

/// Entité représentant un utilisateur du système
class User extends Equatable {
  final String id;
  final String username;
  final String email;
  final String role; // 'admin', 'medecin', 'consultation'
  final String? nomComplet;
  final DateTime createdAt;
  final DateTime? lastLogin;
  final bool isActive;

  const User({
    required this.id,
    required this.username,
    required this.email,
    required this.role,
    this.nomComplet,
    required this.createdAt,
    this.lastLogin,
    this.isActive = true,
  });

  /// Vérifie si l'utilisateur est administrateur
  bool get isAdmin => role == 'admin';

  /// Vérifie si l'utilisateur est médecin
  bool get isMedecin => role == 'medecin' || role == 'admin';

  /// Vérifie si l'utilisateur peut modifier
  bool get canEdit => role == 'admin' || role == 'medecin';

  /// Vérifie si l'utilisateur peut uniquement consulter
  bool get isReadOnly => role == 'consultation';

  @override
  List<Object?> get props => [
        id,
        username,
        email,
        role,
        nomComplet,
        createdAt,
        lastLogin,
        isActive,
      ];

  /// Copie de l'entité avec modifications
  User copyWith({
    String? id,
    String? username,
    String? email,
    String? role,
    String? nomComplet,
    DateTime? createdAt,
    DateTime? lastLogin,
    bool? isActive,
  }) {
    return User(
      id: id ?? this.id,
      username: username ?? this.username,
      email: email ?? this.email,
      role: role ?? this.role,
      nomComplet: nomComplet ?? this.nomComplet,
      createdAt: createdAt ?? this.createdAt,
      lastLogin: lastLogin ?? this.lastLogin,
      isActive: isActive ?? this.isActive,
    );
  }
}
