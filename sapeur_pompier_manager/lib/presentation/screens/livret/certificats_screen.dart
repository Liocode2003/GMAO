import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_colors.dart';
import '../../../domain/entities/certificat.dart';
import '../../providers/sapeur_pompier_provider.dart';
import '../../widgets/app_layout.dart';

/// Écran de gestion des certificats médicaux
class CertificatsScreen extends ConsumerStatefulWidget {
  final String sapeurPompierId;

  const CertificatsScreen({
    Key? key,
    required this.sapeurPompierId,
  }) : super(key: key);

  @override
  ConsumerState<CertificatsScreen> createState() => _CertificatsScreenState();
}

class _CertificatsScreenState extends ConsumerState<CertificatsScreen> {
  List<Certificat> _certificats = [];
  bool _isLoading = false;
  Certificat? _editingCertificat;
  bool _showForm = false;

  @override
  void initState() {
    super.initState();
    _loadCertificats();
  }

  Future<void> _loadCertificats() async {
    setState(() => _isLoading = true);

    final repository = ref.read(sapeurPompierRepositoryProvider);
    final result = await repository.getCertificats(widget.sapeurPompierId);

    result.fold(
      (failure) {
        if (mounted) {
          setState(() => _isLoading = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Erreur: ${failure.message}'),
              backgroundColor: AppColors.error,
            ),
          );
        }
      },
      (list) {
        if (mounted) {
          list.sort((a, b) {
            final dateA = a.dateCertificat ?? DateTime(1900);
            final dateB = b.dateCertificat ?? DateTime(1900);
            return dateB.compareTo(dateA);
          });
          setState(() {
            _certificats = list;
            _isLoading = false;
          });
        }
      },
    );
  }

  void _showCertificatForm([Certificat? certificat]) {
    setState(() {
      _editingCertificat = certificat;
      _showForm = true;
    });
  }

  void _hideForm() {
    setState(() {
      _editingCertificat = null;
      _showForm = false;
    });
  }

  Future<void> _deleteCertificat(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmation'),
        content: const Text('Voulez-vous vraiment supprimer ce certificat ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final repository = ref.read(sapeurPompierRepositoryProvider);
      final result = await repository.deleteCertificat(id);

      result.fold(
        (failure) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Erreur: ${failure.message}'),
                backgroundColor: AppColors.error,
              ),
            );
          }
        },
        (_) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Certificat supprimé avec succès'),
                backgroundColor: AppColors.success,
              ),
            );
            _loadCertificats();
          }
        },
      );
    }
  }

  Color _getTypeColor(String type) {
    switch (type) {
      case 'blessure':
        return AppColors.error;
      case 'maladie':
        return AppColors.warning;
      case 'autre':
        return AppColors.secondary;
      default:
        return AppColors.textDisabled;
    }
  }

  IconData _getTypeIcon(String type) {
    switch (type) {
      case 'blessure':
        return Icons.personal_injury;
      case 'maladie':
        return Icons.sick;
      case 'autre':
        return Icons.description;
      default:
        return Icons.article;
    }
  }

  IconData _getFileIcon(Certificat certificat) {
    if (certificat.isPdf) return Icons.picture_as_pdf;
    if (certificat.isImage) return Icons.image;
    return Icons.insert_drive_file;
  }

  Color _getFileIconColor(Certificat certificat) {
    if (certificat.isPdf) return AppColors.error;
    if (certificat.isImage) return AppColors.success;
    return AppColors.textSecondary;
  }

  @override
  Widget build(BuildContext context) {
    return AppLayout(
      currentRoute: '/livret/certificats',
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: const Text('Certificats médicaux'),
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ),
        body: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _showForm
                ? _CertificatForm(
                    sapeurPompierId: widget.sapeurPompierId,
                    certificat: _editingCertificat,
                    onSaved: () {
                      _hideForm();
                      _loadCertificats();
                    },
                    onCancel: _hideForm,
                  )
                : _buildGrid(),
        floatingActionButton: !_showForm
            ? FloatingActionButton.extended(
                onPressed: () => _showCertificatForm(),
                backgroundColor: AppColors.primary,
                icon: const Icon(Icons.add),
                label: const Text('Ajouter un certificat'),
              )
            : null,
      ),
    );
  }

  Widget _buildGrid() {
    if (_certificats.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.folder_open, size: 80, color: AppColors.textDisabled),
            const SizedBox(height: 16),
            const Text(
              'Aucun certificat enregistré',
              style: TextStyle(fontSize: 18, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 8),
            const Text(
              'Ajoutez un certificat en appuyant sur le bouton ci-dessous',
              style: TextStyle(fontSize: 14, color: AppColors.textHint),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.all(24),
      gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
        maxCrossAxisExtent: 280,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 0.85,
      ),
      itemCount: _certificats.length,
      itemBuilder: (context, index) {
        return _buildCertificatCard(_certificats[index]);
      },
    );
  }

  Widget _buildCertificatCard(Certificat certificat) {
    final typeColor = _getTypeColor(certificat.typeCertificat);
    final fileIcon = _getFileIcon(certificat);
    final fileIconColor = _getFileIconColor(certificat);

    return Card(
      elevation: 2,
      child: InkWell(
        onTap: () => _showCertificatForm(certificat),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Icône fichier + badge type
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Icon(fileIcon, size: 40, color: fileIconColor),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: typeColor.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(10),
                      border:
                          Border.all(color: typeColor.withOpacity(0.5)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          _getTypeIcon(certificat.typeCertificat),
                          size: 12,
                          color: typeColor,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          certificat.typeCertificatLibelle,
                          style: TextStyle(
                            color: typeColor,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Titre
              Text(
                certificat.titre,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 6),

              // Date
              if (certificat.dateCertificat != null)
                Text(
                  DateFormat('dd/MM/yyyy').format(certificat.dateCertificat!),
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),

              // Notes
              if (certificat.notes != null && certificat.notes!.isNotEmpty) ...[
                const SizedBox(height: 6),
                Text(
                  certificat.notes!,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textHint,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],

              const Spacer(),

              // Chemin fichier + actions
              if (certificat.hasFichier)
                Row(
                  children: [
                    Icon(Icons.attach_file,
                        size: 12, color: AppColors.textSecondary),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        certificat.fichierPath!.split('/').last,
                        style: const TextStyle(
                          fontSize: 10,
                          color: AppColors.textSecondary,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  InkWell(
                    onTap: () => _showCertificatForm(certificat),
                    borderRadius: BorderRadius.circular(4),
                    child: const Padding(
                      padding: EdgeInsets.all(4),
                      child: Icon(Icons.edit,
                          size: 18, color: AppColors.secondary),
                    ),
                  ),
                  const SizedBox(width: 4),
                  InkWell(
                    onTap: () => _deleteCertificat(certificat.id),
                    borderRadius: BorderRadius.circular(4),
                    child: const Padding(
                      padding: EdgeInsets.all(4),
                      child:
                          Icon(Icons.delete, size: 18, color: AppColors.error),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Formulaire de certificat
// ─────────────────────────────────────────────────────────────────────────────

class _CertificatForm extends ConsumerStatefulWidget {
  final String sapeurPompierId;
  final Certificat? certificat;
  final VoidCallback onSaved;
  final VoidCallback onCancel;

  const _CertificatForm({
    required this.sapeurPompierId,
    this.certificat,
    required this.onSaved,
    required this.onCancel,
  });

  @override
  ConsumerState<_CertificatForm> createState() => _CertificatFormState();
}

class _CertificatFormState extends ConsumerState<_CertificatForm> {
  final _formKey = GlobalKey<FormState>();

  final _titreController = TextEditingController();
  final _fichierPathController = TextEditingController();
  final _notesController = TextEditingController();
  DateTime? _dateCertificat;
  String _typeCertificat = TypeCertificat.autre.name;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    if (widget.certificat != null) {
      final c = widget.certificat!;
      _titreController.text = c.titre;
      _fichierPathController.text = c.fichierPath ?? '';
      _notesController.text = c.notes ?? '';
      _dateCertificat = c.dateCertificat;
      _typeCertificat = c.typeCertificat;
    }
  }

  @override
  void dispose() {
    _titreController.dispose();
    _fichierPathController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  IconData _getPreviewIcon() {
    final path = _fichierPathController.text.trim().toLowerCase();
    if (path.endsWith('.pdf')) return Icons.picture_as_pdf;
    if (path.endsWith('.jpg') ||
        path.endsWith('.jpeg') ||
        path.endsWith('.png')) return Icons.image;
    if (path.isNotEmpty) return Icons.insert_drive_file;
    return Icons.upload_file;
  }

  Color _getPreviewColor() {
    final path = _fichierPathController.text.trim().toLowerCase();
    if (path.endsWith('.pdf')) return AppColors.error;
    if (path.endsWith('.jpg') ||
        path.endsWith('.jpeg') ||
        path.endsWith('.png')) return AppColors.success;
    if (path.isNotEmpty) return AppColors.secondary;
    return AppColors.textDisabled;
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final certificat = Certificat(
      id: widget.certificat?.id ??
          DateTime.now().millisecondsSinceEpoch.toString(),
      sapeurPompierId: widget.sapeurPompierId,
      titre: _titreController.text.trim(),
      dateCertificat: _dateCertificat,
      typeCertificat: _typeCertificat,
      fichierPath: _fichierPathController.text.trim().isEmpty
          ? null
          : _fichierPathController.text.trim(),
      notes: _notesController.text.trim().isEmpty
          ? null
          : _notesController.text.trim(),
    );

    final repository = ref.read(sapeurPompierRepositoryProvider);
    final result = await repository.saveCertificat(certificat);

    if (mounted) {
      setState(() => _isLoading = false);
      result.fold(
        (failure) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Erreur: ${failure.message}'),
              backgroundColor: AppColors.error,
            ),
          );
        },
        (_) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Certificat enregistré avec succès'),
              backgroundColor: AppColors.success,
            ),
          );
          widget.onSaved();
        },
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.certificat != null
                  ? 'Modifier le certificat'
                  : 'Nouveau certificat',
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 24),
            Card(
              elevation: 2,
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Titre
                    TextFormField(
                      controller: _titreController,
                      decoration: const InputDecoration(
                        labelText: 'Titre *',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.title),
                        hintText: 'Ex: Certificat médical initial',
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Le titre est requis';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // Date + Type en ligne
                    Row(
                      children: [
                        Expanded(
                          child: InkWell(
                            onTap: () async {
                              final picked = await showDatePicker(
                                context: context,
                                initialDate:
                                    _dateCertificat ?? DateTime.now(),
                                firstDate: DateTime(1900),
                                lastDate: DateTime(2100),
                                locale: const Locale('fr', 'FR'),
                              );
                              if (picked != null) {
                                setState(() => _dateCertificat = picked);
                              }
                            },
                            child: InputDecorator(
                              decoration: const InputDecoration(
                                labelText: 'Date',
                                border: OutlineInputBorder(),
                                prefixIcon: Icon(Icons.calendar_today),
                              ),
                              child: Text(
                                _dateCertificat != null
                                    ? DateFormat('dd/MM/yyyy')
                                        .format(_dateCertificat!)
                                    : 'Sélectionner',
                                style: TextStyle(
                                  color: _dateCertificat != null
                                      ? AppColors.textPrimary
                                      : AppColors.textHint,
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: _typeCertificat,
                            decoration: const InputDecoration(
                              labelText: 'Type',
                              border: OutlineInputBorder(),
                              prefixIcon: Icon(Icons.category),
                            ),
                            items: TypeCertificat.values.map((type) {
                              return DropdownMenuItem(
                                value: type.name,
                                child: Text(type.libelle),
                              );
                            }).toList(),
                            onChanged: (value) {
                              if (value != null) {
                                setState(() => _typeCertificat = value);
                              }
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Upload fichier (simulé avec TextFormField)
                    const Text(
                      'Fichier',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _fichierPathController,
                            decoration: const InputDecoration(
                              labelText: 'Chemin du fichier',
                              border: OutlineInputBorder(),
                              hintText:
                                  'Ex: /documents/certificat.pdf',
                              prefixIcon: Icon(Icons.attach_file),
                            ),
                            onChanged: (_) => setState(() {}),
                          ),
                        ),
                        const SizedBox(width: 12),
                        // Aperçu icône selon type
                        Container(
                          width: 56,
                          height: 56,
                          decoration: BoxDecoration(
                            color: _getPreviewColor().withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                                color: _getPreviewColor().withOpacity(0.4)),
                          ),
                          child: Icon(
                            _getPreviewIcon(),
                            color: _getPreviewColor(),
                            size: 28,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Notes
                    TextFormField(
                      controller: _notesController,
                      decoration: const InputDecoration(
                        labelText: 'Notes',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.notes),
                      ),
                      maxLines: 3,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 40),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                OutlinedButton(
                  onPressed: _isLoading ? null : widget.onCancel,
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 32, vertical: 16),
                  ),
                  child: const Text('Annuler'),
                ),
                const SizedBox(width: 16),
                ElevatedButton(
                  onPressed: _isLoading ? null : _save,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 32, vertical: 16),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor:
                                AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Text('Enregistrer'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
