import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_colors.dart';
import '../../../domain/entities/operation.dart';
import '../../providers/sapeur_pompier_provider.dart';
import '../../widgets/app_layout.dart';

/// Écran de gestion des opérations OPEX/OPINT
class OperationsScreen extends ConsumerStatefulWidget {
  final String sapeurPompierId;

  const OperationsScreen({
    Key? key,
    required this.sapeurPompierId,
  }) : super(key: key);

  @override
  ConsumerState<OperationsScreen> createState() => _OperationsScreenState();
}

class _OperationsScreenState extends ConsumerState<OperationsScreen> {
  List<Operation> _operations = [];
  bool _isLoading = false;
  Operation? _editingOperation;
  bool _showForm = false;

  @override
  void initState() {
    super.initState();
    _loadOperations();
  }

  Future<void> _loadOperations() async {
    setState(() => _isLoading = true);

    final repository = ref.read(sapeurPompierRepositoryProvider);
    final result = await repository.getOperations(widget.sapeurPompierId);

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
      (operations) {
        if (mounted) {
          setState(() {
            _operations = operations;
            _isLoading = false;
          });
        }
      },
    );
  }

  void _showOperationForm([Operation? operation]) {
    setState(() {
      _editingOperation = operation;
      _showForm = true;
    });
  }

  void _hideForm() {
    setState(() {
      _editingOperation = null;
      _showForm = false;
    });
  }

  Future<void> _deleteOperation(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmation'),
        content: const Text('Voulez-vous vraiment supprimer cette opération ?'),
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
      final result = await repository.deleteOperation(id);

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
              content: Text('Opération supprimée avec succès'),
              backgroundColor: AppColors.success,
            ),
          );
          _loadOperations();
        },
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppLayout(
      currentRoute: '/livret/operations',
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: const Text('Opérations OPEX/OPINT'),
          backgroundColor: AppColors.primary,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ),
        body: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _showForm
                ? _OperationForm(
                    sapeurPompierId: widget.sapeurPompierId,
                    operation: _editingOperation,
                    onSaved: () {
                      _hideForm();
                      _loadOperations();
                    },
                    onCancel: _hideForm,
                  )
                : _buildOperationsList(),
        floatingActionButton: !_showForm && _operations.length < 6
            ? FloatingActionButton.extended(
                onPressed: () => _showOperationForm(),
                backgroundColor: AppColors.primary,
                icon: const Icon(Icons.add),
                label: const Text('Ajouter une opération'),
              )
            : null,
      ),
    );
  }

  Widget _buildOperationsList() {
    if (_operations.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.flight_takeoff,
              size: 80,
              color: AppColors.textDisabled,
            ),
            const SizedBox(height: 16),
            const Text(
              'Aucune opération enregistrée',
              style: TextStyle(
                fontSize: 18,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        if (_operations.length >= 6)
          Container(
            padding: const EdgeInsets.all(16),
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: AppColors.warning.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.warning),
            ),
            child: Row(
              children: const [
                Icon(Icons.info, color: AppColors.warning),
                SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Nombre maximum d\'opérations atteint (6)',
                    style: TextStyle(color: AppColors.warning),
                  ),
                ),
              ],
            ),
          ),
        ..._operations.map((operation) => _buildOperationCard(operation)).toList(),
      ],
    );
  }

  Widget _buildOperationCard(Operation operation) {
    final variationPoids = operation.variationPoids;
    final hasRetour = operation.isRetourComplete;

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
                Text(
                  'Séjour ${operation.numeroSejour}',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                  ),
                ),
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.edit),
                      color: AppColors.secondary,
                      onPressed: () => _showOperationForm(operation),
                    ),
                    IconButton(
                      icon: const Icon(Icons.delete),
                      color: AppColors.error,
                      onPressed: () => _deleteOperation(operation.id),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (operation.lieuSejour != null)
              _buildInfoRow('Lieu', operation.lieuSejour!),
            if (operation.dateDepart != null)
              _buildInfoRow(
                'Date de départ',
                DateFormat('dd/MM/yyyy').format(operation.dateDepart!),
              ),
            if (operation.dateRetour != null)
              _buildInfoRow(
                'Date de retour',
                DateFormat('dd/MM/yyyy').format(operation.dateRetour!),
              ),
            if (operation.dureeSejour != null)
              _buildInfoRow(
                'Durée',
                '${operation.dureeSejour} jours',
              ),
            if (variationPoids != null) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: variationPoids >= 0
                      ? AppColors.success.withOpacity(0.1)
                      : AppColors.warning.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(
                      variationPoids >= 0
                          ? Icons.trending_up
                          : Icons.trending_down,
                      color: variationPoids >= 0
                          ? AppColors.success
                          : AppColors.warning,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Variation de poids: ${variationPoids > 0 ? '+' : ''}${variationPoids.toStringAsFixed(1)} kg',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: variationPoids >= 0
                            ? AppColors.success
                            : AppColors.warning,
                      ),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 12),
            Row(
              children: [
                Chip(
                  label: Text(
                    hasRetour ? 'Terminée' : 'En cours',
                    style: const TextStyle(color: Colors.white),
                  ),
                  backgroundColor:
                      hasRetour ? AppColors.success : AppColors.statusEnCours,
                ),
              ],
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
            width: 120,
            child: Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.w500,
                color: AppColors.textSecondary,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                color: AppColors.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _OperationForm extends ConsumerStatefulWidget {
  final String sapeurPompierId;
  final Operation? operation;
  final VoidCallback onSaved;
  final VoidCallback onCancel;

  const _OperationForm({
    required this.sapeurPompierId,
    this.operation,
    required this.onSaved,
    required this.onCancel,
  });

  @override
  ConsumerState<_OperationForm> createState() => _OperationFormState();
}

class _OperationFormState extends ConsumerState<_OperationForm> {
  final _formKey = GlobalKey<FormState>();

  late int _numeroSejour;

  // Au départ
  final _lieuSejourController = TextEditingController();
  DateTime? _dateDepart;
  final _etatSanteDepartController = TextEditingController();
  final _poidsDepartController = TextEditingController();
  final _taDepartController = TextEditingController();
  final _avDepartController = TextEditingController();
  final _glycemieDepartController = TextEditingController();
  final _aaDepartController = TextEditingController();
  final _observationsDepartController = TextEditingController();
  final _lieuSignatureDepartController = TextEditingController();
  DateTime? _dateSignatureDepart;
  final _nomMedecinDepartController = TextEditingController();

  // Au retour
  DateTime? _dateRetour;
  final _etatSanteRetourController = TextEditingController();
  final _poidsRetourController = TextEditingController();
  final _taRetourController = TextEditingController();
  final _avRetourController = TextEditingController();
  final _glycemieRetourController = TextEditingController();
  final _aaRetourController = TextEditingController();
  final _observationsRetourController = TextEditingController();
  final _lieuSignatureRetourController = TextEditingController();
  DateTime? _dateSignatureRetour;
  final _nomMedecinRetourController = TextEditingController();

  bool _isLoading = false;

  @override
  void initState() {
    super.initState();

    if (widget.operation != null) {
      final op = widget.operation!;
      _numeroSejour = op.numeroSejour;
      _lieuSejourController.text = op.lieuSejour ?? '';
      _dateDepart = op.dateDepart;
      _etatSanteDepartController.text = op.etatSanteDepart ?? '';
      _poidsDepartController.text = op.poidsDepart?.toString() ?? '';
      _taDepartController.text = op.taDepart ?? '';
      _avDepartController.text = op.avDepart ?? '';
      _glycemieDepartController.text = op.glycemieDepart ?? '';
      _aaDepartController.text = op.aaDepart ?? '';
      _observationsDepartController.text = op.observationsDepart ?? '';
      _lieuSignatureDepartController.text = op.lieuSignatureDepart ?? '';
      _dateSignatureDepart = op.dateSignatureDepart;
      _nomMedecinDepartController.text = op.nomMedecinDepart ?? '';

      _dateRetour = op.dateRetour;
      _etatSanteRetourController.text = op.etatSanteRetour ?? '';
      _poidsRetourController.text = op.poidsRetour?.toString() ?? '';
      _taRetourController.text = op.taRetour ?? '';
      _avRetourController.text = op.avRetour ?? '';
      _glycemieRetourController.text = op.glycemieRetour ?? '';
      _aaRetourController.text = op.aaRetour ?? '';
      _observationsRetourController.text = op.observationsRetour ?? '';
      _lieuSignatureRetourController.text = op.lieuSignatureRetour ?? '';
      _dateSignatureRetour = op.dateSignatureRetour;
      _nomMedecinRetourController.text = op.nomMedecinRetour ?? '';
    } else {
      _numeroSejour = 1;
    }
  }

  @override
  void dispose() {
    _lieuSejourController.dispose();
    _etatSanteDepartController.dispose();
    _poidsDepartController.dispose();
    _taDepartController.dispose();
    _avDepartController.dispose();
    _glycemieDepartController.dispose();
    _aaDepartController.dispose();
    _observationsDepartController.dispose();
    _lieuSignatureDepartController.dispose();
    _nomMedecinDepartController.dispose();
    _etatSanteRetourController.dispose();
    _poidsRetourController.dispose();
    _taRetourController.dispose();
    _avRetourController.dispose();
    _glycemieRetourController.dispose();
    _aaRetourController.dispose();
    _observationsRetourController.dispose();
    _lieuSignatureRetourController.dispose();
    _nomMedecinRetourController.dispose();
    super.dispose();
  }

  Future<void> _saveOperation() async {
    if (!_formKey.currentState!.validate()) return;

    // Validation date retour > date départ
    if (_dateDepart != null && _dateRetour != null) {
      if (_dateRetour!.isBefore(_dateDepart!)) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('La date de retour doit être après la date de départ'),
            backgroundColor: AppColors.error,
          ),
        );
        return;
      }
    }

    setState(() => _isLoading = true);

    final operation = Operation(
      id: widget.operation?.id ??
          DateTime.now().millisecondsSinceEpoch.toString(),
      sapeurPompierId: widget.sapeurPompierId,
      numeroSejour: _numeroSejour,
      lieuSejour: _lieuSejourController.text.trim(),
      dateDepart: _dateDepart,
      etatSanteDepart: _etatSanteDepartController.text.trim(),
      poidsDepart: double.tryParse(_poidsDepartController.text),
      taDepart: _taDepartController.text.trim(),
      avDepart: _avDepartController.text.trim(),
      glycemieDepart: _glycemieDepartController.text.trim(),
      aaDepart: _aaDepartController.text.trim(),
      observationsDepart: _observationsDepartController.text.trim(),
      lieuSignatureDepart: _lieuSignatureDepartController.text.trim(),
      dateSignatureDepart: _dateSignatureDepart,
      nomMedecinDepart: _nomMedecinDepartController.text.trim(),
      dateRetour: _dateRetour,
      etatSanteRetour: _etatSanteRetourController.text.trim(),
      poidsRetour: double.tryParse(_poidsRetourController.text),
      taRetour: _taRetourController.text.trim(),
      avRetour: _avRetourController.text.trim(),
      glycemieRetour: _glycemieRetourController.text.trim(),
      aaRetour: _aaRetourController.text.trim(),
      observationsRetour: _observationsRetourController.text.trim(),
      lieuSignatureRetour: _lieuSignatureRetourController.text.trim(),
      dateSignatureRetour: _dateSignatureRetour,
      nomMedecinRetour: _nomMedecinRetourController.text.trim(),
    );

    final repository = ref.read(sapeurPompierRepositoryProvider);
    final result = await repository.saveOperation(operation);

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
        (savedOperation) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Opération enregistrée avec succès'),
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
    final variationPoids = _calculateVariation();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.operation != null
                  ? 'Modifier l\'opération'
                  : 'Nouvelle opération',
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 24),
            DropdownButtonFormField<int>(
              value: _numeroSejour,
              decoration: const InputDecoration(
                labelText: 'Numéro de séjour *',
                border: OutlineInputBorder(),
              ),
              items: List.generate(
                6,
                (index) => DropdownMenuItem(
                  value: index + 1,
                  child: Text('Séjour ${index + 1}'),
                ),
              ),
              onChanged: (value) => setState(() => _numeroSejour = value!),
            ),
            const SizedBox(height: 32),
            _buildDepartSection(),
            const SizedBox(height: 32),
            _buildRetourSection(),
            if (variationPoids != null) ...[
              const SizedBox(height: 24),
              _buildVariationPoidsCard(variationPoids),
            ],
            const SizedBox(height: 40),
            _buildActionButtons(),
          ],
        ),
      ),
    );
  }

  Widget _buildDepartSection() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Au départ',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _lieuSejourController,
              decoration: const InputDecoration(
                labelText: 'Lieu du séjour',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            InkWell(
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: _dateDepart ?? DateTime.now(),
                  firstDate: DateTime(2000),
                  lastDate: DateTime(2100),
                  locale: const Locale('fr', 'FR'),
                );
                if (picked != null) {
                  setState(() => _dateDepart = picked);
                }
              },
              child: InputDecorator(
                decoration: const InputDecoration(
                  labelText: 'Date de départ',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.calendar_today),
                ),
                child: Text(
                  _dateDepart != null
                      ? DateFormat('dd/MM/yyyy').format(_dateDepart!)
                      : 'Sélectionner une date',
                ),
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _etatSanteDepartController,
              decoration: const InputDecoration(
                labelText: 'État de santé',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _poidsDepartController,
                    decoration: const InputDecoration(
                      labelText: 'Poids (kg)',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}')),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: TextFormField(
                    controller: _taDepartController,
                    decoration: const InputDecoration(
                      labelText: 'TA',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _avDepartController,
                    decoration: const InputDecoration(
                      labelText: 'Acuité visuelle',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: TextFormField(
                    controller: _glycemieDepartController,
                    decoration: const InputDecoration(
                      labelText: 'Glycémie',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _aaDepartController,
              decoration: const InputDecoration(
                labelText: 'Acuité auditive',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _observationsDepartController,
              decoration: const InputDecoration(
                labelText: 'Observations',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _lieuSignatureDepartController,
                    decoration: const InputDecoration(
                      labelText: 'Lieu signature',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: InkWell(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: _dateSignatureDepart ?? DateTime.now(),
                        firstDate: DateTime(2000),
                        lastDate: DateTime.now(),
                        locale: const Locale('fr', 'FR'),
                      );
                      if (picked != null) {
                        setState(() => _dateSignatureDepart = picked);
                      }
                    },
                    child: InputDecorator(
                      decoration: const InputDecoration(
                        labelText: 'Date signature',
                        border: OutlineInputBorder(),
                      ),
                      child: Text(
                        _dateSignatureDepart != null
                            ? DateFormat('dd/MM/yyyy')
                                .format(_dateSignatureDepart!)
                            : 'Sélectionner',
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _nomMedecinDepartController,
              decoration: const InputDecoration(
                labelText: 'Nom du médecin',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRetourSection() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Au retour',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 16),
            InkWell(
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: _dateRetour ?? DateTime.now(),
                  firstDate: _dateDepart ?? DateTime(2000),
                  lastDate: DateTime(2100),
                  locale: const Locale('fr', 'FR'),
                );
                if (picked != null) {
                  setState(() => _dateRetour = picked);
                }
              },
              child: InputDecorator(
                decoration: const InputDecoration(
                  labelText: 'Date de retour',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.calendar_today),
                ),
                child: Text(
                  _dateRetour != null
                      ? DateFormat('dd/MM/yyyy').format(_dateRetour!)
                      : 'Sélectionner une date',
                ),
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _etatSanteRetourController,
              decoration: const InputDecoration(
                labelText: 'État de santé',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _poidsRetourController,
                    decoration: const InputDecoration(
                      labelText: 'Poids (kg)',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}')),
                    ],
                    onChanged: (_) => setState(() {}),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: TextFormField(
                    controller: _taRetourController,
                    decoration: const InputDecoration(
                      labelText: 'TA',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _avRetourController,
                    decoration: const InputDecoration(
                      labelText: 'Acuité visuelle',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: TextFormField(
                    controller: _glycemieRetourController,
                    decoration: const InputDecoration(
                      labelText: 'Glycémie',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _aaRetourController,
              decoration: const InputDecoration(
                labelText: 'Acuité auditive',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _observationsRetourController,
              decoration: const InputDecoration(
                labelText: 'Observations',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _lieuSignatureRetourController,
                    decoration: const InputDecoration(
                      labelText: 'Lieu signature',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: InkWell(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: _dateSignatureRetour ?? DateTime.now(),
                        firstDate: DateTime(2000),
                        lastDate: DateTime.now(),
                        locale: const Locale('fr', 'FR'),
                      );
                      if (picked != null) {
                        setState(() => _dateSignatureRetour = picked);
                      }
                    },
                    child: InputDecorator(
                      decoration: const InputDecoration(
                        labelText: 'Date signature',
                        border: OutlineInputBorder(),
                      ),
                      child: Text(
                        _dateSignatureRetour != null
                            ? DateFormat('dd/MM/yyyy')
                                .format(_dateSignatureRetour!)
                            : 'Sélectionner',
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _nomMedecinRetourController,
              decoration: const InputDecoration(
                labelText: 'Nom du médecin',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  double? _calculateVariation() {
    final poidsDepart = double.tryParse(_poidsDepartController.text);
    final poidsRetour = double.tryParse(_poidsRetourController.text);

    if (poidsDepart != null && poidsRetour != null) {
      return poidsRetour - poidsDepart;
    }
    return null;
  }

  Widget _buildVariationPoidsCard(double variation) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: variation >= 0
            ? AppColors.success.withOpacity(0.1)
            : AppColors.warning.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: variation >= 0 ? AppColors.success : AppColors.warning,
          width: 2,
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            variation >= 0 ? Icons.trending_up : Icons.trending_down,
            size: 32,
            color: variation >= 0 ? AppColors.success : AppColors.warning,
          ),
          const SizedBox(width: 12),
          Text(
            'Variation de poids: ${variation > 0 ? '+' : ''}${variation.toStringAsFixed(1)} kg',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: variation >= 0 ? AppColors.success : AppColors.warning,
            ),
          ),
        ],
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
          onPressed: _isLoading ? null : _saveOperation,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
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
