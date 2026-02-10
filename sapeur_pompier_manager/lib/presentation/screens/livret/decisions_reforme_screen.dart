import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_colors.dart';
import '../../../domain/entities/decision_reforme.dart';
import '../../providers/sapeur_pompier_provider.dart';
import '../../widgets/app_layout.dart';

/// Écran de gestion des décisions de commission de réforme
class DecisionsReformeScreen extends ConsumerStatefulWidget {
  final String sapeurPompierId;

  const DecisionsReformeScreen({
    Key? key,
    required this.sapeurPompierId,
  }) : super(key: key);

  @override
  ConsumerState<DecisionsReformeScreen> createState() =>
      _DecisionsReformeScreenState();
}

class _DecisionsReformeScreenState
    extends ConsumerState<DecisionsReformeScreen> {
  List<DecisionReforme> _decisions = [];
  bool _isLoading = false;
  DecisionReforme? _editingDecision;
  bool _showForm = false;

  @override
  void initState() {
    super.initState();
    _loadDecisions();
  }

  Future<void> _loadDecisions() async {
    setState(() => _isLoading = true);

    final repository = ref.read(sapeurPompierRepositoryProvider);
    final result =
        await repository.getDecisionsReforme(widget.sapeurPompierId);

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
          list.sort((a, b) => b.dateDecision.compareTo(a.dateDecision));
          setState(() {
            _decisions = list;
            _isLoading = false;
          });
        }
      },
    );
  }

  void _showDecisionForm([DecisionReforme? decision]) {
    setState(() {
      _editingDecision = decision;
      _showForm = true;
    });
  }

  void _hideForm() {
    setState(() {
      _editingDecision = null;
      _showForm = false;
    });
  }

  Future<void> _deleteDecision(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmation'),
        content: const Text(
            'Voulez-vous vraiment supprimer cette décision ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style:
                ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final repository = ref.read(sapeurPompierRepositoryProvider);
      final result = await repository.deleteDecisionReforme(id);

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
                content: Text('Décision supprimée avec succès'),
                backgroundColor: AppColors.success,
              ),
            );
            _loadDecisions();
          }
        },
      );
    }
  }

  Color _getTypeColor(String type) {
    switch (type) {
      case 'reforme':
        return AppColors.error;
      case 'rengagement':
        return AppColors.success;
      case 'autre':
        return AppColors.secondary;
      default:
        return AppColors.textDisabled;
    }
  }

  IconData _getTypeIcon(String type) {
    switch (type) {
      case 'reforme':
        return Icons.gavel;
      case 'rengagement':
        return Icons.refresh;
      case 'autre':
        return Icons.article;
      default:
        return Icons.help;
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppLayout(
      currentRoute: '/livret/decisions-reforme',
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: const Text('Décisions de réforme'),
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
                ? _DecisionReformeForm(
                    sapeurPompierId: widget.sapeurPompierId,
                    decision: _editingDecision,
                    onSaved: () {
                      _hideForm();
                      _loadDecisions();
                    },
                    onCancel: _hideForm,
                  )
                : _buildList(),
        floatingActionButton: !_showForm
            ? FloatingActionButton.extended(
                onPressed: () => _showDecisionForm(),
                backgroundColor: AppColors.primary,
                icon: const Icon(Icons.add),
                label: const Text('Ajouter une décision'),
              )
            : null,
      ),
    );
  }

  Widget _buildList() {
    if (_decisions.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.gavel, size: 80, color: AppColors.textDisabled),
            const SizedBox(height: 16),
            const Text(
              'Aucune décision de réforme enregistrée',
              style: TextStyle(
                  fontSize: 18, color: AppColors.textSecondary),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(24),
      itemCount: _decisions.length,
      itemBuilder: (context, index) {
        return _buildDecisionCard(_decisions[index]);
      },
    );
  }

  Widget _buildDecisionCard(DecisionReforme decision) {
    final typeColor = _getTypeColor(decision.typeDecision);
    final typeIcon = _getTypeIcon(decision.typeDecision);

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
                            .format(decision.dateDecision),
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
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
                        color: typeColor.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                            color: typeColor.withOpacity(0.4)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(typeIcon, size: 14, color: typeColor),
                          const SizedBox(width: 4),
                          Text(
                            decision.typeDecisionLibelle,
                            style: TextStyle(
                              color: typeColor,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.edit),
                      color: AppColors.secondary,
                      onPressed: () => _showDecisionForm(decision),
                    ),
                    IconButton(
                      icon: const Icon(Icons.delete),
                      color: AppColors.error,
                      onPressed: () => _deleteDecision(decision.id),
                    ),
                  ],
                ),
              ],
            ),
            const Divider(height: 24),
            if (decision.diagnostic != null)
              _buildInfoRow('Diagnostic', decision.diagnostic!),
            if (decision.observations != null &&
                decision.observations!.isNotEmpty)
              _buildInfoRow('Observations', decision.observations!),
            if (decision.hasSignature)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Row(
                  children: [
                    const Icon(Icons.verified, size: 16,
                        color: AppColors.success),
                    const SizedBox(width: 6),
                    const Text(
                      'Signature de l\'autorité enregistrée',
                      style: TextStyle(
                          fontSize: 12, color: AppColors.success),
                    ),
                  ],
                ),
              ),
            if (decision.isComplete)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle,
                        size: 16, color: AppColors.success),
                    const SizedBox(width: 6),
                    const Text(
                      'Dossier complet',
                      style: TextStyle(
                          fontSize: 12, color: AppColors.success),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
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
// Formulaire de décision de réforme
// ─────────────────────────────────────────────────────────────────────────────

class _DecisionReformeForm extends ConsumerStatefulWidget {
  final String sapeurPompierId;
  final DecisionReforme? decision;
  final VoidCallback onSaved;
  final VoidCallback onCancel;

  const _DecisionReformeForm({
    required this.sapeurPompierId,
    this.decision,
    required this.onSaved,
    required this.onCancel,
  });

  @override
  ConsumerState<_DecisionReformeForm> createState() =>
      _DecisionReformeFormState();
}

class _DecisionReformeFormState
    extends ConsumerState<_DecisionReformeForm> {
  final _formKey = GlobalKey<FormState>();

  final _diagnosticController = TextEditingController();
  final _observationsController = TextEditingController();
  DateTime? _dateDecision;
  String _typeDecision = TypeDecisionReforme.reforme.name;
  String? _signatureAutoritePath;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    if (widget.decision != null) {
      final d = widget.decision!;
      _dateDecision = d.dateDecision;
      _diagnosticController.text = d.diagnostic ?? '';
      _typeDecision = d.typeDecision;
      _observationsController.text = d.observations ?? '';
      _signatureAutoritePath = d.signatureAutoritePath;
    }
  }

  @override
  void dispose() {
    _diagnosticController.dispose();
    _observationsController.dispose();
    super.dispose();
  }

  Future<void> _pickSignature() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() => _signatureAutoritePath = pickedFile.path);
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    if (_dateDecision == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Veuillez sélectionner une date de décision'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    final decision = DecisionReforme(
      id: widget.decision?.id ??
          DateTime.now().millisecondsSinceEpoch.toString(),
      sapeurPompierId: widget.sapeurPompierId,
      dateDecision: _dateDecision!,
      diagnostic: _diagnosticController.text.trim().isEmpty
          ? null
          : _diagnosticController.text.trim(),
      typeDecision: _typeDecision,
      observations: _observationsController.text.trim().isEmpty
          ? null
          : _observationsController.text.trim(),
      signatureAutoritePath: _signatureAutoritePath,
    );

    final repository = ref.read(sapeurPompierRepositoryProvider);
    final result = await repository.saveDecisionReforme(decision);

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
              content: Text('Décision enregistrée avec succès'),
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
              widget.decision != null
                  ? 'Modifier la décision'
                  : 'Nouvelle décision de réforme',
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
                    // Date décision
                    InkWell(
                      onTap: () async {
                        final picked = await showDatePicker(
                          context: context,
                          initialDate: _dateDecision ?? DateTime.now(),
                          firstDate: DateTime(1900),
                          lastDate: DateTime(2100),
                          locale: const Locale('fr', 'FR'),
                        );
                        if (picked != null) {
                          setState(() => _dateDecision = picked);
                        }
                      },
                      child: InputDecorator(
                        decoration: const InputDecoration(
                          labelText: 'Date de décision *',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.calendar_today),
                        ),
                        child: Text(
                          _dateDecision != null
                              ? DateFormat('dd/MM/yyyy')
                                  .format(_dateDecision!)
                              : 'Sélectionner une date',
                          style: TextStyle(
                            color: _dateDecision != null
                                ? AppColors.textPrimary
                                : AppColors.textHint,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Diagnostic
                    TextFormField(
                      controller: _diagnosticController,
                      decoration: const InputDecoration(
                        labelText: 'Diagnostic',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.medical_information),
                      ),
                      maxLines: 2,
                    ),
                    const SizedBox(height: 16),

                    // Type de décision
                    DropdownButtonFormField<String>(
                      value: _typeDecision,
                      decoration: const InputDecoration(
                        labelText: 'Type de décision *',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.category),
                      ),
                      items: TypeDecisionReforme.values.map((type) {
                        Color typeColor;
                        IconData typeIcon;
                        switch (type.name) {
                          case 'reforme':
                            typeColor = AppColors.error;
                            typeIcon = Icons.gavel;
                            break;
                          case 'rengagement':
                            typeColor = AppColors.success;
                            typeIcon = Icons.refresh;
                            break;
                          default:
                            typeColor = AppColors.secondary;
                            typeIcon = Icons.article;
                        }
                        return DropdownMenuItem(
                          value: type.name,
                          child: Row(
                            children: [
                              Icon(typeIcon, size: 16, color: typeColor),
                              const SizedBox(width: 8),
                              Text(
                                type.libelle,
                                style: TextStyle(color: typeColor),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                      onChanged: (value) {
                        if (value != null) {
                          setState(() => _typeDecision = value);
                        }
                      },
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
                    const SizedBox(height: 24),

                    // Signature autorité
                    const Text(
                      'Signature de l\'autorité',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    if (_signatureAutoritePath != null) ...[
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.file(
                          File(_signatureAutoritePath!),
                          width: 200,
                          height: 100,
                          fit: BoxFit.cover,
                        ),
                      ),
                      const SizedBox(height: 8),
                    ],
                    ElevatedButton.icon(
                      onPressed: _pickSignature,
                      icon: const Icon(Icons.upload),
                      label: Text(_signatureAutoritePath != null
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
                            valueColor: AlwaysStoppedAnimation<Color>(
                                Colors.white),
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
