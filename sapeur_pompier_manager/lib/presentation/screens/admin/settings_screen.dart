import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../providers/auth_provider.dart';

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

/// Timeout de session (en minutes) sauvegardé dans SharedPreferences
final sessionTimeoutProvider =
    StateNotifierProvider<_SessionTimeoutNotifier, int>((ref) {
  return _SessionTimeoutNotifier();
});

class _SessionTimeoutNotifier extends StateNotifier<int> {
  static const _key = 'session_timeout_minutes';
  _SessionTimeoutNotifier() : super(30) {
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    state = prefs.getInt(_key) ?? 30;
  }

  Future<void> set(int minutes) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_key, minutes);
    state = minutes;
  }
}

// ---------------------------------------------------------------------------
// SettingsScreen
// ---------------------------------------------------------------------------
class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  // Changement de mot de passe
  final _pwFormKey = GlobalKey<FormState>();
  final _oldPwCtrl = TextEditingController();
  final _newPwCtrl = TextEditingController();
  final _confirmPwCtrl = TextEditingController();
  bool _oldPwVisible = false;
  bool _newPwVisible = false;
  bool _confirmPwVisible = false;
  bool _changingPw = false;

  // Statistiques base de données
  int _nbSapeurs = 0;
  String _dbSize = '—';
  bool _loadingStats = false;

  // Export JSON
  bool _exporting = false;

  @override
  void initState() {
    super.initState();
    _loadDbStats();
  }

  @override
  void dispose() {
    _oldPwCtrl.dispose();
    _newPwCtrl.dispose();
    _confirmPwCtrl.dispose();
    super.dispose();
  }

  // -------------------------------------------------------------------
  // Statistiques base de données
  // -------------------------------------------------------------------
  Future<void> _loadDbStats() async {
    setState(() => _loadingStats = true);
    try {
      final db = ref.read(localDatabaseProvider);
      final database = await db.database;
      final countResult = await database
          .rawQuery('SELECT COUNT(*) as count FROM sapeur_pompiers');
      _nbSapeurs =
          (countResult.first['count'] as int?) ?? 0;

      // Taille approximative en listant les tables
      int totalRows = _nbSapeurs;
      for (final table in [
        'visites_sanitaires',
        'vaccinations',
        'operations',
        'indisponibilites',
      ]) {
        try {
          final r = await database
              .rawQuery('SELECT COUNT(*) as count FROM $table');
          totalRows += (r.first['count'] as int?) ?? 0;
        } catch (_) {}
      }
      _dbSize = '~${(totalRows * 0.8).toStringAsFixed(1)} Ko';
    } catch (e) {
      _dbSize = 'Erreur';
    } finally {
      if (mounted) setState(() => _loadingStats = false);
    }
  }

  // -------------------------------------------------------------------
  // Changement de mot de passe
  // -------------------------------------------------------------------
  Future<void> _changePassword() async {
    if (!_pwFormKey.currentState!.validate()) return;

    setState(() => _changingPw = true);
    final authState = ref.read(authProvider);
    final userId = authState.user?.id;

    if (userId == null) {
      _showError('Utilisateur non authentifié');
      setState(() => _changingPw = false);
      return;
    }

    // Vérification de l'ancien mot de passe via login
    final loginOk = await ref
        .read(authProvider.notifier)
        .login(authState.user!.username, _oldPwCtrl.text);

    if (!loginOk) {
      _showError('L\'ancien mot de passe est incorrect');
      setState(() => _changingPw = false);
      return;
    }

    final ok = await ref
        .read(authProvider.notifier)
        .changePassword(userId, _newPwCtrl.text);

    setState(() => _changingPw = false);

    if (ok) {
      _oldPwCtrl.clear();
      _newPwCtrl.clear();
      _confirmPwCtrl.clear();
      _showSuccess('Mot de passe modifié avec succès');
    } else {
      _showError('Échec de la modification du mot de passe');
    }
  }

  // -------------------------------------------------------------------
  // Export JSON
  // -------------------------------------------------------------------
  Future<void> _exportJson() async {
    setState(() => _exporting = true);
    try {
      final db = ref.read(localDatabaseProvider);
      final database = await db.database;

      final Map<String, dynamic> backup = {};

      for (final table in [
        'sapeur_pompiers',
        'visites_sanitaires',
        'vaccinations',
        'operations',
        'indisponibilites',
        'users',
      ]) {
        try {
          backup[table] = await database.query(table);
        } catch (_) {
          backup[table] = [];
        }
      }

      backup['exported_at'] = DateTime.now().toIso8601String();
      backup['app_version'] = AppStrings.appVersion;

      final jsonStr =
          const JsonEncoder.withIndent('  ').convert(backup);

      // Afficher dans un dialogue (dans une vraie appli, on écrirait sur disque)
      if (mounted) {
        await showDialog<void>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Export JSON'),
            content: SingleChildScrollView(
              child: SelectableText(
                jsonStr.length > 2000
                    ? '${jsonStr.substring(0, 2000)}\n…[tronqué]'
                    : jsonStr,
                style:
                    const TextStyle(fontSize: 11, fontFamily: 'monospace'),
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(),
                child: const Text('Fermer'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      _showError('Erreur lors de l\'export : $e');
    } finally {
      if (mounted) setState(() => _exporting = false);
    }
  }

  // -------------------------------------------------------------------
  // Notifications
  // -------------------------------------------------------------------
  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
          content: Text(msg), backgroundColor: AppColors.error),
    );
  }

  void _showSuccess(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
          content: Text(msg), backgroundColor: AppColors.success),
    );
  }

  // -------------------------------------------------------------------
  // Build
  // -------------------------------------------------------------------
  @override
  Widget build(BuildContext context) {
    final sessionTimeout = ref.watch(sessionTimeoutProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        title: const Text(
          AppStrings.settings,
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ── Section: Informations application ──────────────────────
          _SectionHeader(
              title: 'Informations sur l\'application',
              icon: Icons.info_outline),
          Card(
            elevation: 1,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10)),
            child: Column(
              children: [
                ListTile(
                  leading:
                      const Icon(Icons.apps, color: AppColors.primary),
                  title: const Text('Nom de l\'application'),
                  subtitle: const Text('GMAO SP Burkina Faso'),
                ),
                const Divider(height: 1, indent: 56),
                ListTile(
                  leading: const Icon(Icons.new_releases_outlined,
                      color: AppColors.secondary),
                  title: const Text('Version'),
                  subtitle: const Text(AppStrings.appVersion),
                ),
                const Divider(height: 1, indent: 56),
                ListTile(
                  leading: const Icon(Icons.copyright,
                      color: AppColors.textSecondary),
                  title: const Text('Copyright'),
                  subtitle: const Text(AppStrings.copyright),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // ── Section: Session ────────────────────────────────────────
          _SectionHeader(
              title: 'Session', icon: Icons.timer_outlined),
          Card(
            elevation: 1,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10)),
            child: ListTile(
              leading: const Icon(Icons.access_time,
                  color: AppColors.primary),
              title: const Text('Délai d\'expiration de session'),
              subtitle:
                  Text('Actuellement : $sessionTimeout minutes'),
              trailing: DropdownButton<int>(
                value: sessionTimeout,
                underline: const SizedBox.shrink(),
                items: const [
                  DropdownMenuItem(value: 15, child: Text('15 min')),
                  DropdownMenuItem(value: 30, child: Text('30 min')),
                  DropdownMenuItem(value: 60, child: Text('60 min')),
                ],
                onChanged: (v) {
                  if (v != null) {
                    ref
                        .read(sessionTimeoutProvider.notifier)
                        .set(v);
                    _showSuccess(
                        'Délai de session mis à jour : $v minutes');
                  }
                },
              ),
            ),
          ),
          const SizedBox(height: 20),

          // ── Section: Thème ──────────────────────────────────────────
          _SectionHeader(
              title: 'Apparence', icon: Icons.palette_outlined),
          Card(
            elevation: 1,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10)),
            child: ListTile(
              leading: const Icon(Icons.light_mode_outlined,
                  color: AppColors.warning),
              title: const Text('Thème'),
              subtitle: const Text(
                'Mode clair uniquement (mode sombre à venir)',
              ),
              trailing: Chip(
                label: const Text(
                  'Clair',
                  style:
                      TextStyle(color: Colors.white, fontSize: 12),
                ),
                backgroundColor: AppColors.secondary,
                visualDensity: VisualDensity.compact,
              ),
            ),
          ),
          const SizedBox(height: 20),

          // ── Section: Base de données ────────────────────────────────
          _SectionHeader(
              title: 'Base de données', icon: Icons.storage_outlined),
          Card(
            elevation: 1,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10)),
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.people_outline,
                      color: AppColors.primary),
                  title: const Text('Nombre de sapeurs-pompiers'),
                  trailing: _loadingStats
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                              strokeWidth: 2),
                        )
                      : Text(
                          '$_nbSapeurs',
                          style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary),
                        ),
                ),
                const Divider(height: 1, indent: 56),
                ListTile(
                  leading: const Icon(Icons.folder_outlined,
                      color: AppColors.secondary),
                  title: const Text('Taille estimée de la base'),
                  trailing: Text(
                    _dbSize,
                    style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: AppColors.secondary),
                  ),
                ),
                const Divider(height: 1, indent: 56),
                ListTile(
                  leading: const Icon(Icons.refresh,
                      color: AppColors.info),
                  title: const Text('Actualiser les statistiques'),
                  onTap: _loadDbStats,
                  trailing: const Icon(Icons.chevron_right),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // ── Section: Sécurité ───────────────────────────────────────
          _SectionHeader(
              title: 'Sécurité', icon: Icons.security_outlined),
          Card(
            elevation: 1,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _pwFormKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Changer le mot de passe',
                      style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 16),
                    // Ancien mot de passe
                    TextFormField(
                      controller: _oldPwCtrl,
                      obscureText: !_oldPwVisible,
                      decoration: InputDecoration(
                        labelText: 'Ancien mot de passe',
                        prefixIcon:
                            const Icon(Icons.lock_outline),
                        border: const OutlineInputBorder(),
                        suffixIcon: IconButton(
                          icon: Icon(_oldPwVisible
                              ? Icons.visibility_off
                              : Icons.visibility),
                          onPressed: () => setState(
                              () => _oldPwVisible = !_oldPwVisible),
                        ),
                      ),
                      validator: (v) => (v == null || v.isEmpty)
                          ? 'Champ obligatoire'
                          : null,
                    ),
                    const SizedBox(height: 12),
                    // Nouveau mot de passe
                    TextFormField(
                      controller: _newPwCtrl,
                      obscureText: !_newPwVisible,
                      decoration: InputDecoration(
                        labelText: 'Nouveau mot de passe',
                        prefixIcon:
                            const Icon(Icons.lock_open_outlined),
                        border: const OutlineInputBorder(),
                        suffixIcon: IconButton(
                          icon: Icon(_newPwVisible
                              ? Icons.visibility_off
                              : Icons.visibility),
                          onPressed: () => setState(
                              () => _newPwVisible = !_newPwVisible),
                        ),
                      ),
                      validator: (v) {
                        if (v == null || v.isEmpty) {
                          return 'Champ obligatoire';
                        }
                        if (v.length < 6) {
                          return 'Minimum 6 caractères';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),
                    // Confirmation
                    TextFormField(
                      controller: _confirmPwCtrl,
                      obscureText: !_confirmPwVisible,
                      decoration: InputDecoration(
                        labelText: 'Confirmer le nouveau mot de passe',
                        prefixIcon: const Icon(Icons.check_circle_outline),
                        border: const OutlineInputBorder(),
                        suffixIcon: IconButton(
                          icon: Icon(_confirmPwVisible
                              ? Icons.visibility_off
                              : Icons.visibility),
                          onPressed: () => setState(() =>
                              _confirmPwVisible = !_confirmPwVisible),
                        ),
                      ),
                      validator: (v) {
                        if (v == null || v.isEmpty) {
                          return 'Champ obligatoire';
                        }
                        if (v != _newPwCtrl.text) {
                          return 'Les mots de passe ne correspondent pas';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding:
                              const EdgeInsets.symmetric(vertical: 14),
                        ),
                        icon: _changingPw
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white),
                              )
                            : const Icon(Icons.save_outlined),
                        label: Text(_changingPw
                            ? 'Modification en cours…'
                            : 'Modifier le mot de passe'),
                        onPressed:
                            _changingPw ? null : _changePassword,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // ── Section: Export ─────────────────────────────────────────
          _SectionHeader(
              title: 'Export des données', icon: Icons.upload_outlined),
          Card(
            elevation: 1,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Exporter toutes les données au format JSON pour archivage ou migration.',
                    style: TextStyle(
                        color: AppColors.textSecondary, fontSize: 13),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.secondary,
                        side: const BorderSide(
                            color: AppColors.secondary),
                        padding:
                            const EdgeInsets.symmetric(vertical: 14),
                      ),
                      icon: _exporting
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: AppColors.secondary),
                            )
                          : const Icon(Icons.download_outlined),
                      label: Text(_exporting
                          ? 'Export en cours…'
                          : 'Exporter en JSON'),
                      onPressed: _exporting ? null : _exportJson,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Widget: en-tête de section
// ---------------------------------------------------------------------------
class _SectionHeader extends StatelessWidget {
  final String title;
  final IconData icon;

  const _SectionHeader({required this.title, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, left: 4),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.primary),
          const SizedBox(width: 8),
          Text(
            title.toUpperCase(),
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.2,
              color: AppColors.primary,
            ),
          ),
        ],
      ),
    );
  }
}
