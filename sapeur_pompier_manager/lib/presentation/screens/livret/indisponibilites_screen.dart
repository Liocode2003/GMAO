import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_colors.dart';
import '../../../domain/entities/indisponibilite.dart';
import '../../providers/sapeur_pompier_provider.dart';
import '../../widgets/app_layout.dart';

/// Écran de gestion des indisponibilités pour raison de santé
class IndisponibilitesScreen extends ConsumerStatefulWidget {
  final String sapeurPompierId;

  const IndisponibilitesScreen({
    Key? key,
    required this.sapeurPompierId,
  }) : super(key: key);

  @override
  ConsumerState<IndisponibilitesScreen> createState() =>
      _IndisponibilitesScreenState();
}

class _IndisponibilitesScreenState
    extends ConsumerState<IndisponibilitesScreen> {
  List<Indisponibilite> _indisponibilites = [];
  bool _isLoading = false;
  Indisponibilite? _editingIndisponibilite;
  bool _showForm = false;

  @override
  void initState() {
    super.initState();
    _loadIndisponibilites();
  }

  Future<void> _loadIndisponibilites() async {
    setState(() => _isLoading = true);

    final repository = ref.read(sapeurPompierRepositoryProvider);
    final result =
        await repository.getIndisponibilites(widget.sapeurPompierId);

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
          list.sort((a, b) => b.dateDebut.compareTo(a.dateDebut));
          setState(() {
            _indisponibilites = list;
            _isLoading = false;
          });
        }
      },
    );
  }

  void _showIndisponibiliteForm([Indisponibilite? indisponibilite]) {
    setState(() {
      _editingIndisponibilite = indisponibilite;
      _showForm = true;
    });
  }

  void _hideForm() {
    setState(() {
      _editingIndisponibilite = null;
      _showForm = false;
    });
  }

  Future<void> _deleteIndisponibilite(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmation'),
        content: const Text(
            'Voulez-vous vraiment supprimer cette indisponibilité ?'),
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
      final result = await repository.deleteIndisponibilite(id);

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
                content: Text('Indisponibilité supprimée avec succès'),
                backgroundColor: AppColors.success,
              ),
            );
            _loadIndisponibilites();
          }
        },
      );
    }
  }

  Color _getStatutColor(String statut) {
    switch (statut) {
      case 'En cours':
        return AppColors.error;
      case 'Terminée':
        return AppColors.success;
      case 'Future':
        return AppColors.secondary;
      default:
        return AppColors.textDisabled;
    }
  }

  IconData _getStatutIcon(String statut) {
    switch (statut) {
      case 'En cours':
        return Icons.local_hospital;
      case 'Terminée':
        return Icons.check_circle;
      case 'Future':
        return Icons.schedule;
      default:
        return Icons.help;
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppLayout(
      currentRoute: '/livret/indisponibilites',
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: const Text('Indisponibilités'),
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
                ? _IndisponibiliteForm(
                    sapeurPompierId: widget.sapeurPompierId,
                    indisponibilite: _editingIndisponibilite,
                    onSaved: () {
                      _hideForm();
                      _loadIndisponibilites();
                    },
                    onCancel: _hideForm,
                  )
                : _buildList(),
        floatingActionButton: !_showForm
            ? FloatingActionButton.extended(
                onPressed: () => _showIndisponibiliteForm(),
                backgroundColor: AppColors.primary,
                icon: const Icon(Icons.add),
                label: const Text('Ajouter'),
              )
            : null,
      ),
    );
  }

  Widget _buildList() {
    if (_indisponibilites.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.healing_outlined, size: 80, color: AppColors.textDisabled),
            const SizedBox(height: 16),
            const Text(
              'Aucune indisponibilité enregistrée',
              style: TextStyle(fontSize: 18, color: AppColors.textSecondary),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(24),
      itemCount: _indisponibilites.length,
      itemBuilder: (context, index) {
        return _buildIndisponibiliteCard(_indisponibilites[index]);
      },
    );
  }

  Widget _buildIndisponibiliteCard(Indisponibilite indisponibilite) {
    final statut = indisponibilite.statut;
    final statutColor = _getStatutColor(statut);
    final statutIcon = _getStatutIcon(statut);
    final fmt = DateFormat('dd/MM/yyyy');

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
                        '${fmt.format(indisponibilite.dateDebut)}  →  ${fmt.format(indisponibilite.dateFin)}',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${indisponibilite.dureeTotale} jour${indisponibilite.dureeTotale > 1 ? 's' : ''} au total',
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
                        color: statutColor.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(12),
                        border:
                            Border.all(color: statutColor.withOpacity(0.4)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(statutIcon, size: 14, color: statutColor),
                          const SizedBox(width: 4),
                          Text(
                            statut,
                            style: TextStyle(
                              color: statutColor,
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
                      onPressed: () =>
                          _showIndisponibiliteForm(indisponibilite),
                    ),
                    IconButton(
                      icon: const Icon(Icons.delete),
                      color: AppColors.error,
                      onPressed: () =>
                          _deleteIndisponibilite(indisponibilite.id),
                    ),
                  ],
                ),
              ],
            ),
            const Divider(height: 24),
            if (indisponibilite.corpsEntite != null)
              _buildInfoRow('Corps / Entité', indisponibilite.corpsEntite!),
            if (indisponibilite.diagnostic != null)
              _buildInfoRow('Diagnostic', indisponibilite.diagnostic!),
            if (indisponibilite.nomMedecin != null)
              _buildInfoRow('Médecin', indisponibilite.nomMedecin!),
            _buildDureeRow(indisponibilite),
            if (indisponibilite.observations != null &&
                indisponibilite.observations!.isNotEmpty)
              _buildInfoRow('Observations', indisponibilite.observations!),
          ],
        ),
      ),
    );
  }

  Widget _buildDureeRow(Indisponibilite indisponibilite) {
    final parts = <String>[];
    if (indisponibilite.dureeHopital != null && indisponibilite.dureeHopital! > 0)
      parts.add('Hôpital: ${indisponibilite.dureeHopital!}j');
    if (indisponibilite.dureeInfirmerie != null &&
        indisponibilite.dureeInfirmerie! > 0)
      parts.add('Infirmerie: ${indisponibilite.dureeInfirmerie!}j');
    if (indisponibilite.dureeChambre != null && indisponibilite.dureeChambre! > 0)
      parts.add('Chambre: ${indisponibilite.dureeChambre!}j');

    if (parts.isEmpty) return const SizedBox.shrink();

    return _buildInfoRow('Répartition', parts.join('  |  '));
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
// Formulaire d'indisponibilité
// ─────────────────────────────────────────────────────────────────────────────

class _IndisponibiliteForm extends ConsumerStatefulWidget {
  final String sapeurPompierId;
  final Indisponibilite? indisponibilite;
  final VoidCallback onSaved;
  final VoidCallback onCancel;

  const _IndisponibiliteForm({
    required this.sapeurPompierId,
    this.indisponibilite,
    required this.onSaved,
    required this.onCancel,
  });

  @override
  ConsumerState<_IndisponibiliteForm> createState() =>
      _IndisponibiliteFormState();
}

class _IndisponibiliteFormState extends ConsumerState<_IndisponibiliteForm> {
  final _formKey = GlobalKey<FormState>();

  final _corpsEntiteController = TextEditingController();
  final _diagnosticController = TextEditingController();
  final _dureeHopitalController = TextEditingController();
  final _dureeInfirmerieController = TextEditingController();
  final _dureeChambreController = TextEditingController();
  final _observationsController = TextEditingController();
  final _nomMedecinController = TextEditingController();
  DateTime? _dateDebut;
  DateTime? _dateFin;
  String? _visaSignaturePath;
  bool _isLoading = false;

  // Durée totale calculée
  int _dureeTotaleCalculee = 0;

  @override
  void initState() {
    super.initState();
    if (widget.indisponibilite != null) {
      final i = widget.indisponibilite!;
      _corpsEntiteController.text = i.corpsEntite ?? '';
      _dateDebut = i.dateDebut;
      _dateFin = i.dateFin;
      _diagnosticController.text = i.diagnostic ?? '';
      _dureeHopitalController.text = i.dureeHopital?.toString() ?? '';
      _dureeInfirmerieController.text = i.dureeInfirmerie?.toString() ?? '';
      _dureeChambreController.text = i.dureeChambre?.toString() ?? '';
      _observationsController.text = i.observations ?? '';
      _nomMedecinController.text = i.nomMedecin ?? '';
      _visaSignaturePath = i.visaSignaturePath;
      _recalculerDuree();
    }

    _dureeHopitalController.addListener(_recalculerDuree);
    _dureeInfirmerieController.addListener(_recalculerDuree);
    _dureeChambreController.addListener(_recalculerDuree);
  }

  @override
  void dispose() {
    _corpsEntiteController.dispose();
    _diagnosticController.dispose();
    _dureeHopitalController.dispose();
    _dureeInfirmerieController.dispose();
    _dureeChambreController.dispose();
    _observationsController.dispose();
    _nomMedecinController.dispose();
    super.dispose();
  }

  void _recalculerDuree() {
    if (_dateDebut != null && _dateFin != null) {
      setState(() {
        _dureeTotaleCalculee =
            _dateFin!.difference(_dateDebut!).inDays + 1;
      });
    } else {
      final hopital = int.tryParse(_dureeHopitalController.text) ?? 0;
      final infirmerie =
          int.tryParse(_dureeInfirmerieController.text) ?? 0;
      final chambre = int.tryParse(_dureeChambreController.text) ?? 0;
      setState(() {
        _dureeTotaleCalculee = hopital + infirmerie + chambre;
      });
    }
  }

  Future<void> _pickSignature() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() => _visaSignaturePath = pickedFile.path);
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    if (_dateDebut == null || _dateFin == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Veuillez sélectionner les dates de début et de fin'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    if (_dateFin!.isBefore(_dateDebut!)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('La date de fin doit être après la date de début'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    final indisponibilite = Indisponibilite(
      id: widget.indisponibilite?.id ??
          DateTime.now().millisecondsSinceEpoch.toString(),
      sapeurPompierId: widget.sapeurPompierId,
      corpsEntite: _corpsEntiteController.text.trim().isEmpty
          ? null
          : _corpsEntiteController.text.trim(),
      dateDebut: _dateDebut!,
      dateFin: _dateFin!,
      diagnostic: _diagnosticController.text.trim().isEmpty
          ? null
          : _diagnosticController.text.trim(),
      dureeHopital: int.tryParse(_dureeHopitalController.text),
      dureeInfirmerie: int.tryParse(_dureeInfirmerieController.text),
      dureeChambre: int.tryParse(_dureeChambreController.text),
      observations: _observationsController.text.trim().isEmpty
          ? null
          : _observationsController.text.trim(),
      nomMedecin: _nomMedecinController.text.trim().isEmpty
          ? null
          : _nomMedecinController.text.trim(),
      visaSignaturePath: _visaSignaturePath,
    );

    final repository = ref.read(sapeurPompierRepositoryProvider);
    final result = await repository.saveIndisponibilite(indisponibilite);

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
              content: Text('Indisponibilité enregistrée avec succès'),
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
              widget.indisponibilite != null
                  ? 'Modifier l\'indisponibilité'
                  : 'Nouvelle indisponibilité',
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 24),

            // ── Section informations générales ──
            _buildSectionCard(
              title: 'Informations générales',
              children: [
                TextFormField(
                  controller: _corpsEntiteController,
                  decoration: const InputDecoration(
                    labelText: 'Corps / Entité',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.business),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: _buildDatePicker(
                        label: 'Date de début *',
                        date: _dateDebut,
                        onPicked: (date) {
                          setState(() => _dateDebut = date);
                          _recalculerDuree();
                        },
                        lastDate: DateTime(2100),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _buildDatePicker(
                        label: 'Date de fin *',
                        date: _dateFin,
                        onPicked: (date) {
                          setState(() => _dateFin = date);
                          _recalculerDuree();
                        },
                        lastDate: DateTime(2100),
                      ),
                    ),
                  ],
                ),
                if (_dureeTotaleCalculee > 0) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.info.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                          color: AppColors.info.withOpacity(0.4)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.timer, color: AppColors.info, size: 18),
                        const SizedBox(width: 8),
                        Text(
                          'Durée totale : $_dureeTotaleCalculee jour${_dureeTotaleCalculee > 1 ? 's' : ''}',
                          style: const TextStyle(
                            color: AppColors.info,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                TextFormField(
                  controller: _diagnosticController,
                  decoration: const InputDecoration(
                    labelText: 'Diagnostic',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.medical_information),
                  ),
                  maxLines: 2,
                ),
              ],
            ),
            const SizedBox(height: 16),

            // ── Section durées par lieu ──
            _buildSectionCard(
              title: 'Durées par lieu (jours)',
              children: [
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _dureeHopitalController,
                        decoration: const InputDecoration(
                          labelText: 'Hôpital',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.local_hospital),
                          suffixText: 'j',
                        ),
                        keyboardType: TextInputType.number,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextFormField(
                        controller: _dureeInfirmerieController,
                        decoration: const InputDecoration(
                          labelText: 'Infirmerie',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.healing),
                          suffixText: 'j',
                        ),
                        keyboardType: TextInputType.number,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextFormField(
                        controller: _dureeChambreController,
                        decoration: const InputDecoration(
                          labelText: 'Chambre',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.bed),
                          suffixText: 'j',
                        ),
                        keyboardType: TextInputType.number,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),

            // ── Section médecin & signature ──
            _buildSectionCard(
              title: 'Médecin & Signature',
              children: [
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
                TextFormField(
                  controller: _nomMedecinController,
                  decoration: const InputDecoration(
                    labelText: 'Nom du médecin',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.person),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Visa / Signature',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                if (_visaSignaturePath != null) ...[
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.file(
                      File(_visaSignaturePath!),
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
                  label: Text(_visaSignaturePath != null
                      ? 'Changer le visa/signature'
                      : 'Ajouter un visa/signature'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.secondary,
                    foregroundColor: Colors.white,
                  ),
                ),
              ],
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

  Widget _buildSectionCard({
    required String title,
    required List<Widget> children,
  }) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const Divider(height: 20),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _buildDatePicker({
    required String label,
    required DateTime? date,
    required void Function(DateTime) onPicked,
    DateTime? lastDate,
  }) {
    return InkWell(
      onTap: () async {
        final picked = await showDatePicker(
          context: context,
          initialDate: date ?? DateTime.now(),
          firstDate: DateTime(1900),
          lastDate: lastDate ?? DateTime.now(),
          locale: const Locale('fr', 'FR'),
        );
        if (picked != null) onPicked(picked);
      },
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          border: const OutlineInputBorder(),
          prefixIcon: const Icon(Icons.calendar_today),
        ),
        child: Text(
          date != null
              ? DateFormat('dd/MM/yyyy').format(date)
              : 'Sélectionner',
          style: TextStyle(
            color: date != null ? AppColors.textPrimary : AppColors.textHint,
          ),
        ),
      ),
    );
  }
}
