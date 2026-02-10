import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../domain/entities/user.dart';
import '../../providers/auth_provider.dart';

// ---------------------------------------------------------------------------
// Provider: liste de tous les utilisateurs (chargée au montage)
// ---------------------------------------------------------------------------
final allUsersProvider = FutureProvider<List<User>>((ref) async {
  final repository = ref.watch(authRepositoryProvider);
  final result = await repository.getAllUsers();
  return result.fold(
    (failure) => throw Exception(failure.message),
    (users) => users,
  );
});

// ---------------------------------------------------------------------------
// UserManagementScreen
// ---------------------------------------------------------------------------
class UserManagementScreen extends ConsumerStatefulWidget {
  const UserManagementScreen({super.key});

  @override
  ConsumerState<UserManagementScreen> createState() =>
      _UserManagementScreenState();
}

class _UserManagementScreenState extends ConsumerState<UserManagementScreen> {
  String _searchQuery = '';
  String _filterRole = 'tous';

  static const _roles = ['tous', 'admin', 'medecin', 'infirmier', 'consultation'];

  static const _roleLabels = {
    'tous': 'Tous',
    'admin': 'Administrateur',
    'medecin': 'Médecin',
    'infirmier': 'Infirmier',
    'consultation': 'Consultant',
  };

  static const _roleColors = {
    'admin': AppColors.primary,
    'medecin': AppColors.secondary,
    'infirmier': Color(0xFF00897B),
    'consultation': AppColors.warning,
  };

  // -------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------
  String _roleLabel(String role) => _roleLabels[role] ?? role;

  Color _roleColor(String role) => _roleColors[role] ?? AppColors.textSecondary;

  List<User> _applyFilters(List<User> users) {
    return users.where((u) {
      final matchesRole =
          _filterRole == 'tous' || u.role == _filterRole;
      final q = _searchQuery.toLowerCase();
      final matchesSearch = q.isEmpty ||
          (u.nomComplet?.toLowerCase().contains(q) ?? false) ||
          u.username.toLowerCase().contains(q) ||
          u.email.toLowerCase().contains(q);
      return matchesRole && matchesSearch;
    }).toList();
  }

  // -------------------------------------------------------------------
  // Dialog: Ajouter / Modifier un utilisateur
  // -------------------------------------------------------------------
  Future<void> _openUserDialog({User? existing}) async {
    final formKey = GlobalKey<FormState>();
    final nomCtrl = TextEditingController(
        text: existing?.nomComplet?.split(' ').skip(1).join(' ') ?? '');
    final prenomCtrl = TextEditingController(
        text: existing?.nomComplet?.split(' ').first ?? '');
    final emailCtrl = TextEditingController(text: existing?.email ?? '');
    final usernameCtrl = TextEditingController(text: existing?.username ?? '');
    final passwordCtrl = TextEditingController();
    String selectedRole = existing?.role ?? 'consultation';

    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        return StatefulBuilder(builder: (ctx, setDialogState) {
          return AlertDialog(
            title: Text(
              existing == null
                  ? 'Ajouter un utilisateur'
                  : 'Modifier l\'utilisateur',
              style: const TextStyle(
                  color: AppColors.primary, fontWeight: FontWeight.bold),
            ),
            content: SingleChildScrollView(
              child: SizedBox(
                width: 400,
                child: Form(
                  key: formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Prénom
                      TextFormField(
                        controller: prenomCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Prénom(s)',
                          prefixIcon: Icon(Icons.person_outline),
                          border: OutlineInputBorder(),
                        ),
                        validator: (v) =>
                            (v == null || v.isEmpty) ? 'Champ obligatoire' : null,
                      ),
                      const SizedBox(height: 12),
                      // Nom
                      TextFormField(
                        controller: nomCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Nom de famille',
                          prefixIcon: Icon(Icons.badge_outlined),
                          border: OutlineInputBorder(),
                        ),
                        validator: (v) =>
                            (v == null || v.isEmpty) ? 'Champ obligatoire' : null,
                      ),
                      const SizedBox(height: 12),
                      // Email
                      TextFormField(
                        controller: emailCtrl,
                        keyboardType: TextInputType.emailAddress,
                        decoration: const InputDecoration(
                          labelText: 'Adresse email',
                          prefixIcon: Icon(Icons.email_outlined),
                          border: OutlineInputBorder(),
                        ),
                        validator: (v) {
                          if (v == null || v.isEmpty) return 'Champ obligatoire';
                          if (!v.contains('@')) return 'Email invalide';
                          return null;
                        },
                      ),
                      const SizedBox(height: 12),
                      // Matricule / username
                      TextFormField(
                        controller: usernameCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Matricule / Identifiant',
                          prefixIcon: Icon(Icons.fingerprint),
                          border: OutlineInputBorder(),
                        ),
                        validator: (v) =>
                            (v == null || v.isEmpty) ? 'Champ obligatoire' : null,
                      ),
                      const SizedBox(height: 12),
                      // Rôle
                      DropdownButtonFormField<String>(
                        value: selectedRole,
                        decoration: const InputDecoration(
                          labelText: 'Rôle',
                          prefixIcon: Icon(Icons.manage_accounts_outlined),
                          border: OutlineInputBorder(),
                        ),
                        items: _roles
                            .where((r) => r != 'tous')
                            .map((r) => DropdownMenuItem(
                                  value: r,
                                  child: Text(_roleLabel(r)),
                                ))
                            .toList(),
                        onChanged: (v) {
                          if (v != null) {
                            setDialogState(() => selectedRole = v);
                          }
                        },
                      ),
                      const SizedBox(height: 12),
                      // Mot de passe (uniquement à la création)
                      if (existing == null)
                        TextFormField(
                          controller: passwordCtrl,
                          obscureText: true,
                          decoration: const InputDecoration(
                            labelText: 'Mot de passe',
                            prefixIcon: Icon(Icons.lock_outline),
                            border: OutlineInputBorder(),
                          ),
                          validator: (v) {
                            if (v == null || v.isEmpty) return 'Champ obligatoire';
                            if (v.length < 6) {
                              return 'Minimum 6 caractères';
                            }
                            return null;
                          },
                        ),
                    ],
                  ),
                ),
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(),
                child: const Text('Annuler'),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white),
                onPressed: () async {
                  if (!formKey.currentState!.validate()) return;
                  Navigator.of(ctx).pop();
                  await _saveUser(
                    existing: existing,
                    prenom: prenomCtrl.text.trim(),
                    nom: nomCtrl.text.trim(),
                    email: emailCtrl.text.trim(),
                    username: usernameCtrl.text.trim(),
                    role: selectedRole,
                    password: passwordCtrl.text,
                  );
                },
                child: Text(existing == null ? 'Créer' : 'Enregistrer'),
              ),
            ],
          );
        });
      },
    );
  }

  // -------------------------------------------------------------------
  // Créer / Mettre à jour
  // -------------------------------------------------------------------
  Future<void> _saveUser({
    User? existing,
    required String prenom,
    required String nom,
    required String email,
    required String username,
    required String role,
    required String password,
  }) async {
    final repository = ref.read(authRepositoryProvider);
    final nomComplet = '$prenom $nom';

    if (existing == null) {
      // Création
      final newUser = User(
        id: '',
        username: username,
        email: email,
        role: role,
        nomComplet: nomComplet,
        createdAt: DateTime.now(),
        isActive: true,
      );
      final result = await repository.createUser(newUser, password);
      result.fold(
        (f) => _showError('Erreur lors de la création : ${f.message}'),
        (_) {
          ref.invalidate(allUsersProvider);
          _showSuccess('Utilisateur créé avec succès');
        },
      );
    } else {
      // Mise à jour
      final updated = existing.copyWith(
        username: username,
        email: email,
        role: role,
        nomComplet: nomComplet,
      );
      final result = await repository.updateUser(updated);
      result.fold(
        (f) => _showError('Erreur lors de la mise à jour : ${f.message}'),
        (_) {
          ref.invalidate(allUsersProvider);
          _showSuccess('Utilisateur mis à jour');
        },
      );
    }
  }

  // -------------------------------------------------------------------
  // Activer / Désactiver
  // -------------------------------------------------------------------
  Future<void> _toggleActive(User user) async {
    final repository = ref.read(authRepositoryProvider);
    final updated = user.copyWith(isActive: !user.isActive);
    final result = await repository.updateUser(updated);
    result.fold(
      (f) => _showError('Erreur : ${f.message}'),
      (_) {
        ref.invalidate(allUsersProvider);
        _showSuccess(
          user.isActive ? 'Utilisateur désactivé' : 'Utilisateur activé',
        );
      },
    );
  }

  // -------------------------------------------------------------------
  // Supprimer
  // -------------------------------------------------------------------
  Future<void> _confirmDelete(User user) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirmer la suppression'),
        content: Text(
          'Voulez-vous vraiment supprimer l\'utilisateur "${user.nomComplet ?? user.username}" ?\n\nCette action est irréversible.',
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: const Text('Annuler')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.error,
                foregroundColor: Colors.white),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final repository = ref.read(authRepositoryProvider);
      final result = await repository.deleteUser(user.id);
      result.fold(
        (f) => _showError('Erreur lors de la suppression : ${f.message}'),
        (_) {
          ref.invalidate(allUsersProvider);
          _showSuccess('Utilisateur supprimé');
        },
      );
    }
  }

  // -------------------------------------------------------------------
  // Notifications
  // -------------------------------------------------------------------
  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: AppColors.error,
      ),
    );
  }

  void _showSuccess(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: AppColors.success,
      ),
    );
  }

  // -------------------------------------------------------------------
  // Build
  // -------------------------------------------------------------------
  @override
  Widget build(BuildContext context) {
    final usersAsync = ref.watch(allUsersProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        title: const Text(
          AppStrings.userManagement,
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Actualiser',
            onPressed: () => ref.invalidate(allUsersProvider),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.person_add),
        label: const Text('Ajouter'),
        onPressed: () => _openUserDialog(),
      ),
      body: Column(
        children: [
          // ── Barre de recherche + filtre ──────────────────────────────
          Container(
            color: AppColors.cardBackground,
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    decoration: InputDecoration(
                      hintText: 'Rechercher un utilisateur…',
                      prefixIcon: const Icon(Icons.search,
                          color: AppColors.textSecondary),
                      filled: true,
                      fillColor: AppColors.background,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding:
                          const EdgeInsets.symmetric(vertical: 10),
                    ),
                    onChanged: (v) => setState(() => _searchQuery = v),
                  ),
                ),
                const SizedBox(width: 12),
                DropdownButton<String>(
                  value: _filterRole,
                  underline: const SizedBox.shrink(),
                  items: _roles
                      .map((r) => DropdownMenuItem(
                            value: r,
                            child: Text(_roleLabel(r)),
                          ))
                      .toList(),
                  onChanged: (v) {
                    if (v != null) setState(() => _filterRole = v);
                  },
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          // ── Liste utilisateurs ───────────────────────────────────────
          Expanded(
            child: usersAsync.when(
              loading: () => const Center(
                child: CircularProgressIndicator(color: AppColors.primary),
              ),
              error: (e, _) => Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.error_outline,
                        color: AppColors.error, size: 48),
                    const SizedBox(height: 12),
                    Text(
                      'Erreur de chargement\n$e',
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: AppColors.error),
                    ),
                    const SizedBox(height: 12),
                    ElevatedButton.icon(
                      icon: const Icon(Icons.refresh),
                      label: const Text('Réessayer'),
                      onPressed: () => ref.invalidate(allUsersProvider),
                    ),
                  ],
                ),
              ),
              data: (users) {
                final filtered = _applyFilters(users);
                if (filtered.isEmpty) {
                  return const Center(
                    child: Text(
                      'Aucun utilisateur trouvé',
                      style: TextStyle(color: AppColors.textSecondary),
                    ),
                  );
                }
                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: filtered.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final user = filtered[index];
                    return _UserCard(
                      user: user,
                      roleLabel: _roleLabel(user.role),
                      roleColor: _roleColor(user.role),
                      onEdit: () => _openUserDialog(existing: user),
                      onToggleActive: () => _toggleActive(user),
                      onDelete: () => _confirmDelete(user),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Widget: carte utilisateur
// ---------------------------------------------------------------------------
class _UserCard extends StatelessWidget {
  final User user;
  final String roleLabel;
  final Color roleColor;
  final VoidCallback onEdit;
  final VoidCallback onToggleActive;
  final VoidCallback onDelete;

  const _UserCard({
    required this.user,
    required this.roleLabel,
    required this.roleColor,
    required this.onEdit,
    required this.onToggleActive,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final initials = _initials(user.nomComplet ?? user.username);
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      color: AppColors.cardBackground,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            // Avatar
            CircleAvatar(
              radius: 26,
              backgroundColor:
                  user.isActive ? AppColors.primary : AppColors.textDisabled,
              child: Text(
                initials,
                style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16),
              ),
            ),
            const SizedBox(width: 14),
            // Infos
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          user.nomComplet ?? user.username,
                          style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textPrimary),
                        ),
                      ),
                      // Chip statut actif/inactif
                      Chip(
                        label: Text(
                          user.isActive ? 'Actif' : 'Inactif',
                          style: const TextStyle(
                              fontSize: 11, color: Colors.white),
                        ),
                        backgroundColor:
                            user.isActive ? AppColors.success : AppColors.error,
                        padding: EdgeInsets.zero,
                        materialTapTargetSize:
                            MaterialTapTargetSize.shrinkWrap,
                        visualDensity: VisualDensity.compact,
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    user.email,
                    style: const TextStyle(
                        fontSize: 13, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      // Matricule
                      const Icon(Icons.badge_outlined,
                          size: 14, color: AppColors.textSecondary),
                      const SizedBox(width: 4),
                      Text(
                        user.username,
                        style: const TextStyle(
                            fontSize: 12, color: AppColors.textSecondary),
                      ),
                      const SizedBox(width: 12),
                      // Rôle
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: roleColor.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                              color: roleColor.withOpacity(0.4)),
                        ),
                        child: Text(
                          roleLabel,
                          style: TextStyle(
                              fontSize: 11,
                              color: roleColor,
                              fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            // Actions
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert,
                  color: AppColors.textSecondary),
              onSelected: (value) {
                switch (value) {
                  case 'edit':
                    onEdit();
                    break;
                  case 'toggle':
                    onToggleActive();
                    break;
                  case 'delete':
                    onDelete();
                    break;
                }
              },
              itemBuilder: (_) => [
                const PopupMenuItem(
                  value: 'edit',
                  child: Row(
                    children: [
                      Icon(Icons.edit_outlined, size: 18,
                          color: AppColors.secondary),
                      SizedBox(width: 8),
                      Text('Modifier'),
                    ],
                  ),
                ),
                PopupMenuItem(
                  value: 'toggle',
                  child: Row(
                    children: [
                      Icon(
                        user.isActive
                            ? Icons.block_outlined
                            : Icons.check_circle_outline,
                        size: 18,
                        color: user.isActive
                            ? AppColors.warning
                            : AppColors.success,
                      ),
                      const SizedBox(width: 8),
                      Text(user.isActive ? 'Désactiver' : 'Activer'),
                    ],
                  ),
                ),
                const PopupMenuDivider(),
                const PopupMenuItem(
                  value: 'delete',
                  child: Row(
                    children: [
                      Icon(Icons.delete_outline,
                          size: 18, color: AppColors.error),
                      SizedBox(width: 8),
                      Text('Supprimer',
                          style: TextStyle(color: AppColors.error)),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _initials(String name) {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name.isNotEmpty ? name[0].toUpperCase() : '?';
  }
}
