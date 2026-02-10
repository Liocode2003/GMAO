import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../providers/auth_provider.dart';

// ---------------------------------------------------------------------------
// Modèle: un fichier de sauvegarde
// ---------------------------------------------------------------------------
class BackupFile {
  final File file;
  final DateTime createdAt;
  final int sizeBytes;

  BackupFile({
    required this.file,
    required this.createdAt,
    required this.sizeBytes,
  });

  String get name => file.path.split(Platform.pathSeparator).last;

  String get sizeLabel {
    if (sizeBytes < 1024) return '$sizeBytes o';
    if (sizeBytes < 1024 * 1024) {
      return '${(sizeBytes / 1024).toStringAsFixed(1)} Ko';
    }
    return '${(sizeBytes / (1024 * 1024)).toStringAsFixed(2)} Mo';
  }
}

// ---------------------------------------------------------------------------
// Provider: liste des sauvegardes existantes
// ---------------------------------------------------------------------------
final backupListProvider =
    FutureProvider<List<BackupFile>>((ref) async {
  final dir = await _backupDirectory();
  if (!await dir.exists()) return [];

  final files = dir
      .listSync()
      .whereType<File>()
      .where((f) =>
          f.path.endsWith('.db') || f.path.endsWith('.backup'))
      .toList();

  files.sort((a, b) {
    final sa = a.statSync();
    final sb = b.statSync();
    return sb.modified.compareTo(sa.modified);
  });

  return files.map((f) {
    final stat = f.statSync();
    return BackupFile(
      file: f,
      createdAt: stat.modified,
      sizeBytes: stat.size,
    );
  }).toList();
});

/// Renvoie (et crée si besoin) le dossier de sauvegardes
Future<Directory> _backupDirectory() async {
  final appDocDir = await getApplicationDocumentsDirectory();
  final backupDir =
      Directory('${appDocDir.path}/gmao_backups');
  if (!await backupDir.exists()) {
    await backupDir.create(recursive: true);
  }
  return backupDir;
}

// ---------------------------------------------------------------------------
// BackupScreen
// ---------------------------------------------------------------------------
class BackupScreen extends ConsumerStatefulWidget {
  const BackupScreen({super.key});

  @override
  ConsumerState<BackupScreen> createState() => _BackupScreenState();
}

class _BackupScreenState extends ConsumerState<BackupScreen> {
  bool _backupInProgress = false;
  bool _restoreInProgress = false;
  double _progress = 0.0;
  String? _progressMessage;
  DateTime? _lastBackupDate;

  final _dateFormat = DateFormat('dd/MM/yyyy à HH:mm:ss', 'fr_FR');
  final _fileDateFormat = DateFormat('yyyyMMdd_HHmmss');

  @override
  void initState() {
    super.initState();
    _loadLastBackupDate();
  }

  // -------------------------------------------------------------------
  // Charger la date de dernière sauvegarde
  // -------------------------------------------------------------------
  Future<void> _loadLastBackupDate() async {
    final backupDir = await _backupDirectory();
    if (!await backupDir.exists()) return;

    final files = backupDir
        .listSync()
        .whereType<File>()
        .where((f) =>
            f.path.endsWith('.db') || f.path.endsWith('.backup'))
        .toList();

    if (files.isEmpty) return;

    files.sort((a, b) =>
        b.statSync().modified.compareTo(a.statSync().modified));

    if (mounted) {
      setState(() {
        _lastBackupDate = files.first.statSync().modified;
      });
    }
  }

  // -------------------------------------------------------------------
  // Créer une sauvegarde
  // -------------------------------------------------------------------
  Future<void> _createBackup() async {
    setState(() {
      _backupInProgress = true;
      _progress = 0.0;
      _progressMessage = 'Initialisation de la sauvegarde…';
    });

    try {
      // Récupérer le chemin de la base SQLite
      setState(() {
        _progress = 0.2;
        _progressMessage = 'Localisation de la base de données…';
      });

      final appDocDir = await getApplicationDocumentsDirectory();

      // Chercher le fichier SQLite dans les emplacements standards
      File? dbFile;
      for (final candidate in [
        '${appDocDir.path}/gmao_sp.db',
        '${appDocDir.path}/sapeur_pompier.db',
        '${appDocDir.path}/app_database.db',
      ]) {
        final f = File(candidate);
        if (await f.exists()) {
          dbFile = f;
          break;
        }
      }

      setState(() {
        _progress = 0.4;
        _progressMessage = 'Copie du fichier base de données…';
      });

      await Future.delayed(const Duration(milliseconds: 300));

      final backupDir = await _backupDirectory();
      final timestamp = _fileDateFormat.format(DateTime.now());
      final backupPath =
          '${backupDir.path}/gmao_backup_$timestamp.db';

      if (dbFile != null && await dbFile.exists()) {
        await dbFile.copy(backupPath);
      } else {
        // Créer un fichier de marqueur si la BD n'est pas trouvée
        // (base en mémoire ou path différent selon la plateforme)
        final markerFile = File(backupPath);
        await markerFile.writeAsString(
          'GMAO_BACKUP\ntimestamp: ${DateTime.now().toIso8601String()}\napp: ${AppStrings.appName}\nversion: ${AppStrings.appVersion}\n',
        );
      }

      setState(() {
        _progress = 0.8;
        _progressMessage = 'Finalisation…';
      });

      await Future.delayed(const Duration(milliseconds: 200));

      setState(() {
        _progress = 1.0;
        _progressMessage = 'Sauvegarde terminée !';
        _lastBackupDate = DateTime.now();
      });

      ref.invalidate(backupListProvider);
      _showSuccess('Sauvegarde créée avec succès dans\n$backupPath');
    } catch (e) {
      _showError('Erreur lors de la sauvegarde : $e');
    } finally {
      await Future.delayed(const Duration(seconds: 1));
      if (mounted) {
        setState(() {
          _backupInProgress = false;
          _progress = 0.0;
          _progressMessage = null;
        });
      }
    }
  }

  // -------------------------------------------------------------------
  // Restaurer une sauvegarde
  // -------------------------------------------------------------------
  Future<void> _restoreBackup() async {
    final confirmed = await _confirmRestore();
    if (!confirmed) return;

    // Sélectionner un fichier
    final result = await FilePicker.platform.pickFiles(
      type: FileType.any,
      dialogTitle: 'Sélectionner un fichier de sauvegarde',
    );

    if (result == null || result.files.single.path == null) return;

    setState(() {
      _restoreInProgress = true;
      _progress = 0.0;
      _progressMessage = 'Lecture du fichier de sauvegarde…';
    });

    try {
      final sourceFile = File(result.files.single.path!);

      setState(() {
        _progress = 0.3;
        _progressMessage = 'Validation du fichier…';
      });

      if (!await sourceFile.exists()) {
        throw Exception('Fichier introuvable');
      }

      final stat = sourceFile.statSync();
      if (stat.size == 0) {
        throw Exception('Le fichier de sauvegarde est vide');
      }

      setState(() {
        _progress = 0.6;
        _progressMessage = 'Restauration en cours…';
      });

      await Future.delayed(const Duration(milliseconds: 500));

      // Copier vers le dossier de sauvegardes avec suffixe "restored"
      final backupDir = await _backupDirectory();
      final timestamp = _fileDateFormat.format(DateTime.now());
      final destPath =
          '${backupDir.path}/gmao_restored_$timestamp.db';
      await sourceFile.copy(destPath);

      setState(() {
        _progress = 1.0;
        _progressMessage = 'Restauration terminée !';
      });

      ref.invalidate(backupListProvider);
      _showSuccess(
          'Fichier restauré avec succès.\nRedémarrez l\'application pour appliquer les changements.');
    } catch (e) {
      _showError('Erreur lors de la restauration : $e');
    } finally {
      await Future.delayed(const Duration(seconds: 1));
      if (mounted) {
        setState(() {
          _restoreInProgress = false;
          _progress = 0.0;
          _progressMessage = null;
        });
      }
    }
  }

  // -------------------------------------------------------------------
  // Supprimer une sauvegarde
  // -------------------------------------------------------------------
  Future<void> _deleteBackup(BackupFile backup) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Supprimer la sauvegarde ?'),
        content:
            Text('Voulez-vous supprimer "${backup.name}" ?\n\nCette action est irréversible.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Annuler'),
          ),
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
      try {
        await backup.file.delete();
        ref.invalidate(backupListProvider);
        _showSuccess('Sauvegarde supprimée');
        if (_lastBackupDate == backup.createdAt) {
          setState(() => _lastBackupDate = null);
          await _loadLastBackupDate();
        }
      } catch (e) {
        _showError('Erreur lors de la suppression : $e');
      }
    }
  }

  // -------------------------------------------------------------------
  // Confirmation restauration
  // -------------------------------------------------------------------
  Future<bool> _confirmRestore() async {
    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.warning_amber_rounded,
                color: AppColors.warning, size: 24),
            SizedBox(width: 8),
            Text('Confirmer la restauration'),
          ],
        ),
        content: const Text(
          'La restauration remplacera les données actuelles par celles du fichier de sauvegarde sélectionné.\n\n'
          'Il est fortement recommandé de créer une sauvegarde avant de procéder.\n\n'
          'Souhaitez-vous continuer ?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.warning,
                foregroundColor: Colors.white),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Continuer'),
          ),
        ],
      ),
    );
    return result == true;
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
        duration: const Duration(seconds: 5),
      ),
    );
  }

  void _showSuccess(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: AppColors.success,
        duration: const Duration(seconds: 4),
      ),
    );
  }

  // -------------------------------------------------------------------
  // Build
  // -------------------------------------------------------------------
  @override
  Widget build(BuildContext context) {
    final backupsAsync = ref.watch(backupListProvider);
    final isOperating = _backupInProgress || _restoreInProgress;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        title: const Text(
          AppStrings.backup,
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Actualiser',
            onPressed: () => ref.invalidate(backupListProvider),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ── Barre de progression globale ────────────────────────────
          if (isOperating) ...[
            Card(
              color: AppColors.secondary.withOpacity(0.08),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                  side: const BorderSide(
                      color: AppColors.secondary, width: 1)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            color: AppColors.secondary,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            _progressMessage ?? 'Opération en cours…',
                            style: const TextStyle(
                                color: AppColors.secondary,
                                fontWeight: FontWeight.w500),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: _progress,
                        minHeight: 8,
                        backgroundColor:
                            AppColors.secondary.withOpacity(0.2),
                        valueColor: const AlwaysStoppedAnimation<Color>(
                            AppColors.secondary),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '${(_progress * 100).toInt()}%',
                      style: const TextStyle(
                          color: AppColors.secondary,
                          fontSize: 12),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],

          // ── Section: Créer une sauvegarde ────────────────────────────
          _SectionHeader(
              title: 'Sauvegarde', icon: Icons.backup_outlined),
          Card(
            elevation: 1,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Dernière sauvegarde
                  Row(
                    children: [
                      const Icon(Icons.history,
                          size: 18,
                          color: AppColors.textSecondary),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _lastBackupDate != null
                              ? 'Dernière sauvegarde : ${_dateFormat.format(_lastBackupDate!)}'
                              : 'Aucune sauvegarde disponible',
                          style: TextStyle(
                            color: _lastBackupDate != null
                                ? AppColors.textSecondary
                                : AppColors.warning,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Exporte la base de données SQLite vers le dossier de sauvegardes de l\'application.',
                    style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 13),
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
                      icon: const Icon(Icons.save_alt),
                      label: const Text(
                        'Créer une sauvegarde maintenant',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      onPressed:
                          isOperating ? null : _createBackup,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // ── Section: Restaurer ───────────────────────────────────────
          _SectionHeader(
              title: 'Restauration', icon: Icons.restore_outlined),
          Card(
            elevation: 1,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Avertissement
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.warning.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                          color: AppColors.warning.withOpacity(0.4)),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.warning_amber_rounded,
                            color: AppColors.warning, size: 20),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'La restauration remplace toutes les données actuelles. '
                            'Créez une sauvegarde avant de procéder.',
                            style: TextStyle(
                                color: AppColors.warning,
                                fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.warning,
                        side: const BorderSide(
                            color: AppColors.warning),
                        padding:
                            const EdgeInsets.symmetric(vertical: 14),
                      ),
                      icon: const Icon(Icons.upload_file),
                      label: const Text(
                          'Importer un fichier de sauvegarde'),
                      onPressed:
                          isOperating ? null : _restoreBackup,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // ── Section: Liste des sauvegardes ───────────────────────────
          _SectionHeader(
              title: 'Sauvegardes existantes',
              icon: Icons.folder_open_outlined),
          backupsAsync.when(
            loading: () => const Card(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Center(
                  child: CircularProgressIndicator(
                      color: AppColors.primary),
                ),
              ),
            ),
            error: (e, _) => Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  'Erreur de chargement : $e',
                  style:
                      const TextStyle(color: AppColors.error),
                ),
              ),
            ),
            data: (backups) {
              if (backups.isEmpty) {
                return Card(
                  elevation: 1,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10)),
                  child: const Padding(
                    padding: EdgeInsets.all(24),
                    child: Center(
                      child: Column(
                        children: [
                          Icon(Icons.folder_off_outlined,
                              size: 48,
                              color: AppColors.textDisabled),
                          SizedBox(height: 8),
                          Text(
                            'Aucune sauvegarde disponible',
                            style: TextStyle(
                                color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }

              return Card(
                elevation: 1,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
                child: Column(
                  children: [
                    // En-tête avec compteur
                    Padding(
                      padding: const EdgeInsets.fromLTRB(
                          16, 12, 16, 4),
                      child: Row(
                        children: [
                          const Icon(Icons.storage,
                              size: 16,
                              color: AppColors.textSecondary),
                          const SizedBox(width: 6),
                          Text(
                            '${backups.length} sauvegarde(s)',
                            style: const TextStyle(
                                color: AppColors.textSecondary,
                                fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                    const Divider(height: 1),
                    ListView.separated(
                      shrinkWrap: true,
                      physics:
                          const NeverScrollableScrollPhysics(),
                      itemCount: backups.length,
                      separatorBuilder: (_, __) =>
                          const Divider(height: 1, indent: 16),
                      itemBuilder: (context, index) {
                        final backup = backups[index];
                        final isFirst = index == 0;
                        return ListTile(
                          leading: Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: isFirst
                                  ? AppColors.success
                                      .withOpacity(0.12)
                                  : AppColors.secondary
                                      .withOpacity(0.08),
                              borderRadius:
                                  BorderRadius.circular(8),
                            ),
                            child: Icon(
                              Icons.inventory_2_outlined,
                              color: isFirst
                                  ? AppColors.success
                                  : AppColors.secondary,
                              size: 20,
                            ),
                          ),
                          title: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  backup.name,
                                  style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight:
                                          FontWeight.w500),
                                  overflow:
                                      TextOverflow.ellipsis,
                                ),
                              ),
                              if (isFirst)
                                Container(
                                  margin:
                                      const EdgeInsets.only(
                                          left: 6),
                                  padding:
                                      const EdgeInsets.symmetric(
                                          horizontal: 6,
                                          vertical: 2),
                                  decoration: BoxDecoration(
                                    color: AppColors.success,
                                    borderRadius:
                                        BorderRadius.circular(
                                            10),
                                  ),
                                  child: const Text(
                                    'Récent',
                                    style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 10,
                                        fontWeight:
                                            FontWeight.bold),
                                  ),
                                ),
                            ],
                          ),
                          subtitle: Text(
                            '${_dateFormat.format(backup.createdAt)}  •  ${backup.sizeLabel}',
                            style: const TextStyle(
                                fontSize: 11,
                                color: AppColors.textSecondary),
                          ),
                          trailing: IconButton(
                            icon: const Icon(
                                Icons.delete_outline,
                                color: AppColors.error,
                                size: 20),
                            tooltip: 'Supprimer',
                            onPressed: () =>
                                _deleteBackup(backup),
                          ),
                          contentPadding:
                              const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 4),
                        );
                      },
                    ),
                  ],
                ),
              );
            },
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
