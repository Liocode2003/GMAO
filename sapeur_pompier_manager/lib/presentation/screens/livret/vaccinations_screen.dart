import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_colors.dart';
import '../../../domain/entities/vaccination.dart';
import '../../providers/sapeur_pompier_provider.dart';
import '../../widgets/app_layout.dart';

/// Écran de gestion des vaccinations
class VaccinationsScreen extends ConsumerStatefulWidget {
  final String sapeurPompierId;

  const VaccinationsScreen({
    Key? key,
    required this.sapeurPompierId,
  }) : super(key: key);

  @override
  ConsumerState<VaccinationsScreen> createState() =>
      _VaccinationsScreenState();
}

class _VaccinationsScreenState extends ConsumerState<VaccinationsScreen> {
  List<Vaccination> _vaccinations = [];
  bool _isLoading = false;
  Vaccination? _editingVaccination;
  bool _showForm = false;
  String _statusFilter = 'Tous';
  String? _typeFilter;

  @override
  void initState() {
    super.initState();
    _loadVaccinations();
  }

  Future<void> _loadVaccinations() async {
    setState(() => _isLoading = true);

    final repository = ref.read(sapeurPompierRepositoryProvider);
    final result = await repository.getVaccinations(widget.sapeurPompierId);

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
      (vaccinations) {
        if (mounted) {
          setState(() {
            _vaccinations = vaccinations;
            _isLoading = false;
          });
        }
      },
    );
  }

  void _showVaccinationForm([Vaccination? vaccination]) {
    setState(() {
      _editingVaccination = vaccination;
      _showForm = true;
    });
  }

  void _hideForm() {
    setState(() {
      _editingVaccination = null;
      _showForm = false;
    });
  }

  Future<void> _deleteVaccination(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmation'),
        content: const Text('Voulez-vous vraiment supprimer cette vaccination ?'),
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
      final result = await repository.deleteVaccination(id);

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
              content: Text('Vaccination supprimée avec succès'),
              backgroundColor: AppColors.success,
            ),
          );
          _loadVaccinations();
        },
      );
    }
  }

  List<Vaccination> get _filteredVaccinations {
    var filtered = _vaccinations;

    // Filtre par statut
    if (_statusFilter != 'Tous') {
      filtered = filtered.where((v) => v.statut == _statusFilter).toList();
    }

    // Filtre par type
    if (_typeFilter != null) {
      filtered = filtered.where((v) => v.typeVaccin == _typeFilter).toList();
    }

    return filtered;
  }

  int get _countExpires =>
      _vaccinations.where((v) => v.isExpire).length;

  int get _countProchesExpiration =>
      _vaccinations.where((v) => v.isProcheDExpiration).length;

  @override
  Widget build(BuildContext context) {
    return AppLayout(
      currentRoute: '/livret/vaccinations',
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: const Text('Vaccinations'),
          backgroundColor: AppColors.primary,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ),
        body: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _showForm
                ? _VaccinationForm(
                    sapeurPompierId: widget.sapeurPompierId,
                    vaccination: _editingVaccination,
                    onSaved: () {
                      _hideForm();
                      _loadVaccinations();
                    },
                    onCancel: _hideForm,
                  )
                : _buildVaccinationsList(),
        floatingActionButton: !_showForm
            ? FloatingActionButton.extended(
                onPressed: () => _showVaccinationForm(),
                backgroundColor: AppColors.primary,
                icon: const Icon(Icons.add),
                label: const Text('Ajouter une vaccination'),
              )
            : null,
      ),
    );
  }

  Widget _buildVaccinationsList() {
    return Column(
      children: [
        _buildAlertsSection(),
        _buildFiltersSection(),
        Expanded(
          child: _filteredVaccinations.isEmpty
              ? _buildEmptyState()
              : ListView.builder(
                  padding: const EdgeInsets.all(24),
                  itemCount: _filteredVaccinations.length,
                  itemBuilder: (context, index) {
                    return _buildVaccinationCard(_filteredVaccinations[index]);
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildAlertsSection() {
    if (_countExpires == 0 && _countProchesExpiration == 0) {
      return const SizedBox.shrink();
    }

    return Container(
      margin: const EdgeInsets.all(24),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.error.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.error),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.warning, color: AppColors.error),
              SizedBox(width: 8),
              Text(
                'Alertes vaccinations',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppColors.error,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (_countExpires > 0)
            Text(
              '• $_countExpires vaccination(s) expirée(s)',
              style: const TextStyle(color: AppColors.error),
            ),
          if (_countProchesExpiration > 0)
            Text(
              '• $_countProchesExpiration vaccination(s) proche de l\'expiration',
              style: const TextStyle(color: AppColors.warning),
            ),
        ],
      ),
    );
  }

  Widget _buildFiltersSection() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      decoration: const BoxDecoration(
        color: AppColors.cardBackground,
        border: Border(
          bottom: BorderSide(color: AppColors.border),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: DropdownButtonFormField<String>(
              value: _statusFilter,
              decoration: const InputDecoration(
                labelText: 'Statut',
                border: OutlineInputBorder(),
                isDense: true,
              ),
              items: const [
                DropdownMenuItem(value: 'Tous', child: Text('Tous')),
                DropdownMenuItem(value: 'À jour', child: Text('À jour')),
                DropdownMenuItem(
                    value: 'Proche expiration',
                    child: Text('Proche expiration')),
                DropdownMenuItem(value: 'Expiré', child: Text('Expiré')),
              ],
              onChanged: (value) {
                setState(() => _statusFilter = value ?? 'Tous');
              },
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: DropdownButtonFormField<String?>(
              value: _typeFilter,
              decoration: const InputDecoration(
                labelText: 'Type de vaccin',
                border: OutlineInputBorder(),
                isDense: true,
              ),
              items: [
                const DropdownMenuItem(value: null, child: Text('Tous')),
                ...TypeVaccin.values.map(
                  (type) => DropdownMenuItem(
                    value: type.name,
                    child: Text(type.libelle),
                  ),
                ),
              ],
              onChanged: (value) {
                setState(() => _typeFilter = value);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.vaccines,
            size: 80,
            color: AppColors.textDisabled,
          ),
          const SizedBox(height: 16),
          const Text(
            'Aucune vaccination enregistrée',
            style: TextStyle(
              fontSize: 18,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVaccinationCard(Vaccination vaccination) {
    final statusColor = _getStatusColor(vaccination.statut);
    final statusIcon = _getStatusIcon(vaccination.statut);

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
                  child: Text(
                    vaccination.typeVaccinLibelle,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: statusColor.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(statusIcon, size: 16, color: statusColor),
                          const SizedBox(width: 4),
                          Text(
                            vaccination.statut,
                            style: TextStyle(
                              color: statusColor,
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
                      onPressed: () => _showVaccinationForm(vaccination),
                    ),
                    IconButton(
                      icon: const Icon(Icons.delete),
                      color: AppColors.error,
                      onPressed: () => _deleteVaccination(vaccination.id),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildInfoRow(
              'Date de vaccination',
              DateFormat('dd/MM/yyyy').format(vaccination.dateVaccination),
            ),
            if (vaccination.dateRappel != null)
              _buildInfoRow(
                'Date de rappel',
                DateFormat('dd/MM/yyyy').format(vaccination.dateRappel!),
              ),
            if (vaccination.nombreDoses != null)
              _buildInfoRow('Nombre de doses', vaccination.nombreDoses.toString()),
            if (vaccination.referenceLot != null)
              _buildInfoRow('Référence lot', vaccination.referenceLot!),
            if (vaccination.nomMedecin != null)
              _buildInfoRow('Médecin', vaccination.nomMedecin!),
            if (vaccination.observations != null &&
                vaccination.observations!.isNotEmpty)
              _buildInfoRow('Observations', vaccination.observations!),
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
            width: 140,
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

  Color _getStatusColor(String statut) {
    switch (statut) {
      case 'À jour':
        return AppColors.success;
      case 'Proche expiration':
        return AppColors.warning;
      case 'Expiré':
        return AppColors.error;
      default:
        return AppColors.textDisabled;
    }
  }

  IconData _getStatusIcon(String statut) {
    switch (statut) {
      case 'À jour':
        return Icons.check_circle;
      case 'Proche expiration':
        return Icons.warning;
      case 'Expiré':
        return Icons.cancel;
      default:
        return Icons.help;
    }
  }
}

class _VaccinationForm extends ConsumerStatefulWidget {
  final String sapeurPompierId;
  final Vaccination? vaccination;
  final VoidCallback onSaved;
  final VoidCallback onCancel;

  const _VaccinationForm({
    required this.sapeurPompierId,
    this.vaccination,
    required this.onSaved,
    required this.onCancel,
  });

  @override
  ConsumerState<_VaccinationForm> createState() => _VaccinationFormState();
}

class _VaccinationFormState extends ConsumerState<_VaccinationForm> {
  final _formKey = GlobalKey<FormState>();

  String? _typeVaccin;
  DateTime? _dateVaccination;
  final _nombreDosesController = TextEditingController();
  final _referenceLotController = TextEditingController();
  DateTime? _dateRappel;
  final _nomMedecinController = TextEditingController();
  final _observationsController = TextEditingController();
  String? _signaturePath;
  bool _useAutomaticRappel = true;

  bool _isLoading = false;

  @override
  void initState() {
    super.initState();

    if (widget.vaccination != null) {
      final v = widget.vaccination!;
      _typeVaccin = v.typeVaccin;
      _dateVaccination = v.dateVaccination;
      _nombreDosesController.text = v.nombreDoses?.toString() ?? '';
      _referenceLotController.text = v.referenceLot ?? '';
      _dateRappel = v.dateRappel;
      _nomMedecinController.text = v.nomMedecin ?? '';
      _observationsController.text = v.observations ?? '';
      _signaturePath = v.signaturePath;

      // Déterminer si le rappel est automatique ou manuel
      if (_dateRappel != null && _dateVaccination != null && _typeVaccin != null) {
        final autoRappel =
            Vaccination.calculateDateRappel(_typeVaccin!, _dateVaccination!);
        _useAutomaticRappel = autoRappel != null &&
            _dateRappel!.year == autoRappel.year &&
            _dateRappel!.month == autoRappel.month &&
            _dateRappel!.day == autoRappel.day;
      }
    }
  }

  @override
  void dispose() {
    _nombreDosesController.dispose();
    _referenceLotController.dispose();
    _nomMedecinController.dispose();
    _observationsController.dispose();
    super.dispose();
  }

  void _updateDateRappel() {
    if (_useAutomaticRappel &&
        _typeVaccin != null &&
        _dateVaccination != null) {
      final autoRappel =
          Vaccination.calculateDateRappel(_typeVaccin!, _dateVaccination!);
      if (autoRappel != null) {
        setState(() => _dateRappel = autoRappel);
      }
    }
  }

  Future<void> _saveVaccination() async {
    if (!_formKey.currentState!.validate()) return;

    if (_typeVaccin == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Veuillez sélectionner un type de vaccin'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    if (_dateVaccination == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Veuillez sélectionner une date de vaccination'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    // Validation date future
    if (_dateVaccination!.isAfter(DateTime.now())) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('La date de vaccination ne peut pas être dans le futur'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    final vaccination = Vaccination(
      id: widget.vaccination?.id ??
          DateTime.now().millisecondsSinceEpoch.toString(),
      sapeurPompierId: widget.sapeurPompierId,
      typeVaccin: _typeVaccin!,
      dateVaccination: _dateVaccination!,
      nombreDoses: int.tryParse(_nombreDosesController.text),
      referenceLot: _referenceLotController.text.trim().isEmpty
          ? null
          : _referenceLotController.text.trim(),
      nomMedecin: _nomMedecinController.text.trim().isEmpty
          ? null
          : _nomMedecinController.text.trim(),
      signaturePath: _signaturePath,
      observations: _observationsController.text.trim().isEmpty
          ? null
          : _observationsController.text.trim(),
      dateRappel: _dateRappel,
    );

    final repository = ref.read(sapeurPompierRepositoryProvider);
    final result = await repository.saveVaccination(vaccination);

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
        (savedVaccination) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Vaccination enregistrée avec succès'),
              backgroundColor: AppColors.success,
            ),
          );
          widget.onSaved();
        },
      );
    }
  }

  Future<void> _pickSignature() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);

    if (pickedFile != null) {
      setState(() {
        _signaturePath = pickedFile.path;
      });
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
              widget.vaccination != null
                  ? 'Modifier la vaccination'
                  : 'Nouvelle vaccination',
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
                    DropdownButtonFormField<String>(
                      value: _typeVaccin,
                      decoration: const InputDecoration(
                        labelText: 'Type de vaccin *',
                        border: OutlineInputBorder(),
                      ),
                      items: TypeVaccin.values.map((type) {
                        return DropdownMenuItem(
                          value: type.name,
                          child: Text(type.libelle),
                        );
                      }).toList(),
                      onChanged: (value) {
                        setState(() {
                          _typeVaccin = value;
                          _updateDateRappel();
                        });
                      },
                    ),
                    const SizedBox(height: 16),
                    InkWell(
                      onTap: () async {
                        final picked = await showDatePicker(
                          context: context,
                          initialDate: _dateVaccination ?? DateTime.now(),
                          firstDate: DateTime(1900),
                          lastDate: DateTime.now(),
                          locale: const Locale('fr', 'FR'),
                        );
                        if (picked != null) {
                          setState(() {
                            _dateVaccination = picked;
                            _updateDateRappel();
                          });
                        }
                      },
                      child: InputDecorator(
                        decoration: const InputDecoration(
                          labelText: 'Date de vaccination *',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.calendar_today),
                        ),
                        child: Text(
                          _dateVaccination != null
                              ? DateFormat('dd/MM/yyyy')
                                  .format(_dateVaccination!)
                              : 'Sélectionner une date',
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _nombreDosesController,
                      decoration: const InputDecoration(
                        labelText: 'Nombre de doses',
                        border: OutlineInputBorder(),
                      ),
                      keyboardType: TextInputType.number,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                      ],
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _referenceLotController,
                      decoration: const InputDecoration(
                        labelText: 'Référence du lot',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'Date de rappel',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: RadioListTile<bool>(
                            title: const Text('Automatique'),
                            value: true,
                            groupValue: _useAutomaticRappel,
                            onChanged: (value) {
                              setState(() {
                                _useAutomaticRappel = value ?? true;
                                if (_useAutomaticRappel) {
                                  _updateDateRappel();
                                }
                              });
                            },
                            activeColor: AppColors.primary,
                          ),
                        ),
                        Expanded(
                          child: RadioListTile<bool>(
                            title: const Text('Manuelle'),
                            value: false,
                            groupValue: _useAutomaticRappel,
                            onChanged: (value) {
                              setState(() {
                                _useAutomaticRappel = value ?? false;
                              });
                            },
                            activeColor: AppColors.primary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    InkWell(
                      onTap: _useAutomaticRappel
                          ? null
                          : () async {
                              final picked = await showDatePicker(
                                context: context,
                                initialDate: _dateRappel ??
                                    DateTime.now().add(const Duration(days: 365)),
                                firstDate: DateTime.now(),
                                lastDate: DateTime(2100),
                                locale: const Locale('fr', 'FR'),
                              );
                              if (picked != null) {
                                setState(() => _dateRappel = picked);
                              }
                            },
                      child: InputDecorator(
                        decoration: InputDecoration(
                          labelText: 'Date de rappel',
                          border: const OutlineInputBorder(),
                          prefixIcon: const Icon(Icons.calendar_today),
                          enabled: !_useAutomaticRappel,
                        ),
                        child: Text(
                          _dateRappel != null
                              ? DateFormat('dd/MM/yyyy').format(_dateRappel!)
                              : 'Sélectionner une date',
                          style: TextStyle(
                            color: _useAutomaticRappel
                                ? AppColors.textDisabled
                                : AppColors.textPrimary,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _nomMedecinController,
                      decoration: const InputDecoration(
                        labelText: 'Nom du médecin',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _observationsController,
                      decoration: const InputDecoration(
                        labelText: 'Observations',
                        border: OutlineInputBorder(),
                      ),
                      maxLines: 3,
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'Signature du médecin',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    if (_signaturePath != null)
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
                    ElevatedButton.icon(
                      onPressed: _pickSignature,
                      icon: const Icon(Icons.upload),
                      label: Text(_signaturePath != null
                          ? 'Changer la signature'
                          : 'Ajouter une signature'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.secondary,
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
          onPressed: _isLoading ? null : _saveVaccination,
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
