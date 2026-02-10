import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_colors.dart';
import '../../../domain/entities/visite_sanitaire.dart';
import '../../providers/sapeur_pompier_provider.dart';
import '../../widgets/app_layout.dart';

/// Écran de gestion des visites sanitaires
class VisitesSanitairesScreen extends ConsumerStatefulWidget {
  final String sapeurPompierId;

  const VisitesSanitairesScreen({
    Key? key,
    required this.sapeurPompierId,
  }) : super(key: key);

  @override
  ConsumerState<VisitesSanitairesScreen> createState() =>
      _VisitesSanitairesScreenState();
}

class _VisitesSanitairesScreenState
    extends ConsumerState<VisitesSanitairesScreen> {
  List<VisiteSanitaire> _visites = [];
  bool _isLoading = false;
  VisiteSanitaire? _editingVisite;
  bool _showForm = false;

  @override
  void initState() {
    super.initState();
    _loadVisites();
  }

  Future<void> _loadVisites() async {
    setState(() => _isLoading = true);

    final repository = ref.read(sapeurPompierRepositoryProvider);
    final result =
        await repository.getVisitesSanitaires(widget.sapeurPompierId);

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
      (visites) {
        if (mounted) {
          // Tri par date décroissante
          visites.sort((a, b) => b.dateVisite.compareTo(a.dateVisite));
          setState(() {
            _visites = visites;
            _isLoading = false;
          });
        }
      },
    );
  }

  void _showVisiteForm([VisiteSanitaire? visite]) {
    setState(() {
      _editingVisite = visite;
      _showForm = true;
    });
  }

  void _hideForm() {
    setState(() {
      _editingVisite = null;
      _showForm = false;
    });
  }

  Future<void> _deleteVisite(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmation'),
        content:
            const Text('Voulez-vous vraiment supprimer cette visite sanitaire ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
            ),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final repository = ref.read(sapeurPompierRepositoryProvider);
      final result = await repository.deleteVisiteSanitaire(id);

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
                content: Text('Visite supprimée avec succès'),
                backgroundColor: AppColors.success,
              ),
            );
            _loadVisites();
          }
        },
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppLayout(
      currentRoute: '/livret/visites-sanitaires',
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: const Text('Visites sanitaires'),
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
                ? _VisiteSanitaireForm(
                    sapeurPompierId: widget.sapeurPompierId,
                    visite: _editingVisite,
                    onSaved: () {
                      _hideForm();
                      _loadVisites();
                    },
                    onCancel: _hideForm,
                  )
                : _buildVisitesList(),
        floatingActionButton: !_showForm
            ? FloatingActionButton.extended(
                onPressed: () => _showVisiteForm(),
                backgroundColor: AppColors.primary,
                icon: const Icon(Icons.add),
                label: const Text('Ajouter une visite'),
              )
            : null,
      ),
    );
  }

  Widget _buildVisitesList() {
    if (_visites.isEmpty) {
      return _buildEmptyState();
    }

    return ListView.builder(
      padding: const EdgeInsets.all(24),
      itemCount: _visites.length,
      itemBuilder: (context, index) {
        return _buildVisiteCard(_visites[index]);
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.medical_services_outlined,
            size: 80,
            color: AppColors.textDisabled,
          ),
          const SizedBox(height: 16),
          const Text(
            'Aucune visite sanitaire enregistrée',
            style: TextStyle(
              fontSize: 18,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Ajoutez une visite en appuyant sur le bouton ci-dessous',
            style: TextStyle(
              fontSize: 14,
              color: AppColors.textHint,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVisiteCard(VisiteSanitaire visite) {
    final isComplete = visite.isComplete;
    final statusColor = isComplete ? AppColors.success : AppColors.warning;
    final joursDepuis = visite.joursDepuisVisite;

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        DateFormat('dd MMMM yyyy', 'fr_FR')
                            .format(visite.dateVisite),
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Il y a $joursDepuis jour${joursDepuis > 1 ? 's' : ''}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: statusColor.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: statusColor.withOpacity(0.4)),
                      ),
                      child: Text(
                        isComplete ? 'Complète' : 'Incomplète',
                        style: TextStyle(
                          color: statusColor,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.edit),
                      color: AppColors.secondary,
                      tooltip: 'Modifier',
                      onPressed: () => _showVisiteForm(visite),
                    ),
                    IconButton(
                      icon: const Icon(Icons.delete),
                      color: AppColors.error,
                      tooltip: 'Supprimer',
                      onPressed: () => _deleteVisite(visite.id),
                    ),
                  ],
                ),
              ],
            ),
            const Divider(height: 24),
            if (visite.entiteCorps != null)
              _buildInfoRow(
                Icons.business,
                'Corps / Entité',
                visite.entiteCorps!,
              ),
            if (visite.resultats != null)
              _buildInfoRow(
                Icons.fact_check,
                'Résultats',
                visite.resultats!,
              ),
            if (visite.nomMedecin != null)
              _buildInfoRow(
                Icons.person,
                'Médecin',
                visite.nomMedecin!,
              ),
            if (visite.observations != null && visite.observations!.isNotEmpty)
              _buildInfoRow(
                Icons.notes,
                'Observations',
                visite.observations!,
              ),
            if (visite.hasSignature)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Row(
                  children: [
                    Icon(Icons.verified, size: 16, color: AppColors.success),
                    const SizedBox(width: 6),
                    const Text(
                      'Signature enregistrée',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.success,
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: AppColors.textSecondary),
          const SizedBox(width: 8),
          SizedBox(
            width: 130,
            child: Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.w500,
                color: AppColors.textSecondary,
                fontSize: 13,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 13,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Formulaire de visite sanitaire
// ─────────────────────────────────────────────────────────────────────────────

class _VisiteSanitaireForm extends ConsumerStatefulWidget {
  final String sapeurPompierId;
  final VisiteSanitaire? visite;
  final VoidCallback onSaved;
  final VoidCallback onCancel;

  const _VisiteSanitaireForm({
    required this.sapeurPompierId,
    this.visite,
    required this.onSaved,
    required this.onCancel,
  });

  @override
  ConsumerState<_VisiteSanitaireForm> createState() =>
      _VisiteSanitaireFormState();
}

class _VisiteSanitaireFormState extends ConsumerState<_VisiteSanitaireForm> {
  final _formKey = GlobalKey<FormState>();

  final _entiteCorpsController = TextEditingController();
  final _resultatsController = TextEditingController();
  final _observationsController = TextEditingController();
  final _nomMedecinController = TextEditingController();
  DateTime? _dateVisite;
  String? _signaturePath;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    if (widget.visite != null) {
      final v = widget.visite!;
      _entiteCorpsController.text = v.entiteCorps ?? '';
      _dateVisite = v.dateVisite;
      _resultatsController.text = v.resultats ?? '';
      _observationsController.text = v.observations ?? '';
      _nomMedecinController.text = v.nomMedecin ?? '';
      _signaturePath = v.signaturePath;
    }
  }

  @override
  void dispose() {
    _entiteCorpsController.dispose();
    _resultatsController.dispose();
    _observationsController.dispose();
    _nomMedecinController.dispose();
    super.dispose();
  }

  Future<void> _pickSignature() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() => _signaturePath = pickedFile.path);
    }
  }

  Future<void> _saveVisite() async {
    if (!_formKey.currentState!.validate()) return;

    if (_dateVisite == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Veuillez sélectionner une date de visite'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    final visite = VisiteSanitaire(
      id: widget.visite?.id ??
          DateTime.now().millisecondsSinceEpoch.toString(),
      sapeurPompierId: widget.sapeurPompierId,
      entiteCorps: _entiteCorpsController.text.trim().isEmpty
          ? null
          : _entiteCorpsController.text.trim(),
      dateVisite: _dateVisite!,
      resultats: _resultatsController.text.trim().isEmpty
          ? null
          : _resultatsController.text.trim(),
      observations: _observationsController.text.trim().isEmpty
          ? null
          : _observationsController.text.trim(),
      nomMedecin: _nomMedecinController.text.trim().isEmpty
          ? null
          : _nomMedecinController.text.trim(),
      signaturePath: _signaturePath,
    );

    final repository = ref.read(sapeurPompierRepositoryProvider);
    final result = await repository.saveVisiteSanitaire(visite);

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
              content: Text('Visite sanitaire enregistrée avec succès'),
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
              widget.visite != null
                  ? 'Modifier la visite sanitaire'
                  : 'Nouvelle visite sanitaire',
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
                    // Corps / Entité
                    TextFormField(
                      controller: _entiteCorpsController,
                      decoration: const InputDecoration(
                        labelText: 'Corps / Entité',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.business),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Date de visite
                    InkWell(
                      onTap: () async {
                        final picked = await showDatePicker(
                          context: context,
                          initialDate: _dateVisite ?? DateTime.now(),
                          firstDate: DateTime(1900),
                          lastDate: DateTime.now(),
                          locale: const Locale('fr', 'FR'),
                        );
                        if (picked != null) {
                          setState(() => _dateVisite = picked);
                        }
                      },
                      child: InputDecorator(
                        decoration: InputDecoration(
                          labelText: 'Date de visite *',
                          border: const OutlineInputBorder(),
                          prefixIcon: const Icon(Icons.calendar_today),
                          errorText: _dateVisite == null ? null : null,
                        ),
                        child: Text(
                          _dateVisite != null
                              ? DateFormat('dd/MM/yyyy').format(_dateVisite!)
                              : 'Sélectionner une date',
                          style: TextStyle(
                            color: _dateVisite != null
                                ? AppColors.textPrimary
                                : AppColors.textHint,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Résultats
                    TextFormField(
                      controller: _resultatsController,
                      decoration: const InputDecoration(
                        labelText: 'Résultats',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.fact_check),
                        hintText: 'Ex: Apte, Inapte, Apte avec restrictions...',
                      ),
                      maxLines: 2,
                    ),
                    const SizedBox(height: 16),

                    // Observations
                    TextFormField(
                      controller: _observationsController,
                      decoration: const InputDecoration(
                        labelText: 'Observations',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.notes),
                      ),
                      maxLines: 3,
                    ),
                    const SizedBox(height: 16),

                    // Nom médecin
                    TextFormField(
                      controller: _nomMedecinController,
                      decoration: const InputDecoration(
                        labelText: 'Nom du médecin',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.person),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Signature
                    const Text(
                      'Signature du médecin',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    if (_signaturePath != null) ...[
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.file(
                          File(_signaturePath!),
                          width: 200,
                          height: 100,
                          fit: BoxFit.cover,
                        ),
                      ),
                      const SizedBox(height: 12),
                    ],
                    ElevatedButton.icon(
                      onPressed: _pickSignature,
                      icon: const Icon(Icons.upload),
                      label: Text(_signaturePath != null
                          ? 'Changer la signature'
                          : 'Ajouter une signature'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.secondary,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 40),
            _buildActionButtons(),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButtons() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        OutlinedButton(
          onPressed: _isLoading ? null : widget.onCancel,
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
          ),
          child: const Text('Annuler'),
        ),
        const SizedBox(width: 16),
        ElevatedButton(
          onPressed: _isLoading ? null : _saveVisite,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
          ),
          child: _isLoading
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                )
              : const Text('Enregistrer'),
        ),
      ],
    );
  }
}
