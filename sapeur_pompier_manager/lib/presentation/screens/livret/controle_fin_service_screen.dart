import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_colors.dart';
import '../../../domain/entities/controle_fin_service.dart';
import '../../providers/livret_providers.dart';
import '../../widgets/app_layout.dart';

/// Écran du contrôle de fin de service (visite médicale de radiation)
class ControleFinServiceScreen extends ConsumerStatefulWidget {
  final String sapeurPompierId;

  const ControleFinServiceScreen({
    Key? key,
    required this.sapeurPompierId,
  }) : super(key: key);

  @override
  ConsumerState<ControleFinServiceScreen> createState() =>
      _ControleFinServiceScreenState();
}

class _ControleFinServiceScreenState
    extends ConsumerState<ControleFinServiceScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isEditing = false;

  // ── Informations générales ──────────────────────────────────────────────────
  DateTime? _dateRadiation;
  final _lieuExamenController = TextEditingController();
  String _etatSante = EtatSanteFinService.bonneSante.name;
  final _atteintDeController = TextEditingController();
  final _hospitaliseAController = TextEditingController();

  // ── Examen clinique ─────────────────────────────────────────────────────────
  final _poidsController = TextEditingController();
  final _tailleController = TextEditingController();
  final _taController = TextEditingController();
  final _sucreController = TextEditingController();
  final _albumineController = TextEditingController();

  // ── Vision ──────────────────────────────────────────────────────────────────
  final _avOdSansController = TextEditingController();
  final _avOdAvecController = TextEditingController();
  final _avOgSansController = TextEditingController();
  final _avOgAvecController = TextEditingController();

  // ── Audition ────────────────────────────────────────────────────────────────
  final _aaOdHauteController = TextEditingController();
  final _aaOdChuchoteeController = TextEditingController();
  final _aaOgHauteController = TextEditingController();
  final _aaOgChuchoteeController = TextEditingController();

  // ── Profil SIGYCOP (notes textuelles finales) ───────────────────────────────
  final _noteEController = TextEditingController();
  final _noteVController = TextEditingController();
  final _noteAController = TextEditingController();
  final _noteSController = TextEditingController();
  final _noteIController = TextEditingController();
  final _noteFController = TextEditingController();
  final _noteXController = TextEditingController();

  // ── Signature ───────────────────────────────────────────────────────────────
  final _nomMedecinController = TextEditingController();
  DateTime? _dateSignature;
  String? _signaturePath;

  @override
  void dispose() {
    _lieuExamenController.dispose();
    _atteintDeController.dispose();
    _hospitaliseAController.dispose();
    _poidsController.dispose();
    _tailleController.dispose();
    _taController.dispose();
    _sucreController.dispose();
    _albumineController.dispose();
    _avOdSansController.dispose();
    _avOdAvecController.dispose();
    _avOgSansController.dispose();
    _avOgAvecController.dispose();
    _aaOdHauteController.dispose();
    _aaOdChuchoteeController.dispose();
    _aaOgHauteController.dispose();
    _aaOgChuchoteeController.dispose();
    _noteEController.dispose();
    _noteVController.dispose();
    _noteAController.dispose();
    _noteSController.dispose();
    _noteIController.dispose();
    _noteFController.dispose();
    _noteXController.dispose();
    _nomMedecinController.dispose();
    super.dispose();
  }

  void _loadFromEntity(ControleFinService controle) {
    _dateRadiation = controle.dateRadiation;
    _lieuExamenController.text = controle.lieuExamen ?? '';
    _etatSante =
        controle.etatSante ?? EtatSanteFinService.bonneSante.name;
    _atteintDeController.text = controle.atteintDe ?? '';
    _hospitaliseAController.text = controle.hospitaliseA ?? '';
    _poidsController.text = controle.poids?.toString() ?? '';
    _tailleController.text = controle.taille?.toString() ?? '';
    _taController.text = controle.ta ?? '';
    _sucreController.text = controle.sucre ?? '';
    _albumineController.text = controle.albumine ?? '';
    _avOdSansController.text = controle.avOdSans ?? '';
    _avOdAvecController.text = controle.avOdAvec ?? '';
    _avOgSansController.text = controle.avOgSans ?? '';
    _avOgAvecController.text = controle.avOgAvec ?? '';
    _aaOdHauteController.text = controle.aaOdHaute ?? '';
    _aaOdChuchoteeController.text = controle.aaOdChuchotee ?? '';
    _aaOgHauteController.text = controle.aaOgHaute ?? '';
    _aaOgChuchoteeController.text = controle.aaOgChuchotee ?? '';
    _noteEController.text = controle.noteE ?? '';
    _noteVController.text = controle.noteV ?? '';
    _noteAController.text = controle.noteA ?? '';
    _noteSController.text = controle.noteS ?? '';
    _noteIController.text = controle.noteI ?? '';
    _noteFController.text = controle.noteF ?? '';
    _noteXController.text = controle.noteX ?? '';
    _nomMedecinController.text = controle.nomMedecin ?? '';
    _dateSignature = controle.dateSignature;
    _signaturePath = controle.signaturePath;
  }

  Future<void> _pickSignature() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery);
    if (picked != null) {
      setState(() => _signaturePath = picked.path);
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    final notifier =
        ref.read(controleFinServiceProvider(widget.sapeurPompierId).notifier);

    final existing = ref
        .read(controleFinServiceProvider(widget.sapeurPompierId))
        .controleFinService;

    final poids = double.tryParse(_poidsController.text.trim());
    final taille = double.tryParse(_tailleController.text.trim());

    final controle = ControleFinService(
      id: existing?.id ??
          DateTime.now().millisecondsSinceEpoch.toString(),
      sapeurPompierId: widget.sapeurPompierId,
      dateRadiation: _dateRadiation,
      lieuExamen: _lieuExamenController.text.trim().isEmpty
          ? null
          : _lieuExamenController.text.trim(),
      etatSante: _etatSante,
      atteintDe:
          _etatSante == EtatSanteFinService.atteintDe.name &&
                  _atteintDeController.text.trim().isNotEmpty
              ? _atteintDeController.text.trim()
              : null,
      hospitaliseA: _hospitaliseAController.text.trim().isEmpty
          ? null
          : _hospitaliseAController.text.trim(),
      poids: poids,
      taille: taille,
      indicePignet: null,
      ta: _taController.text.trim().isEmpty
          ? null
          : _taController.text.trim(),
      sucre: _sucreController.text.trim().isEmpty
          ? null
          : _sucreController.text.trim(),
      albumine: _albumineController.text.trim().isEmpty
          ? null
          : _albumineController.text.trim(),
      avOdSans: _avOdSansController.text.trim().isEmpty
          ? null
          : _avOdSansController.text.trim(),
      avOdAvec: _avOdAvecController.text.trim().isEmpty
          ? null
          : _avOdAvecController.text.trim(),
      avOgSans: _avOgSansController.text.trim().isEmpty
          ? null
          : _avOgSansController.text.trim(),
      avOgAvec: _avOgAvecController.text.trim().isEmpty
          ? null
          : _avOgAvecController.text.trim(),
      aaOdHaute: _aaOdHauteController.text.trim().isEmpty
          ? null
          : _aaOdHauteController.text.trim(),
      aaOdChuchotee: _aaOdChuchoteeController.text.trim().isEmpty
          ? null
          : _aaOdChuchoteeController.text.trim(),
      aaOgHaute: _aaOgHauteController.text.trim().isEmpty
          ? null
          : _aaOgHauteController.text.trim(),
      aaOgChuchotee: _aaOgChuchoteeController.text.trim().isEmpty
          ? null
          : _aaOgChuchoteeController.text.trim(),
      noteE: _noteEController.text.trim().isEmpty
          ? null
          : _noteEController.text.trim(),
      noteV: _noteVController.text.trim().isEmpty
          ? null
          : _noteVController.text.trim(),
      noteA: _noteAController.text.trim().isEmpty
          ? null
          : _noteAController.text.trim(),
      noteS: _noteSController.text.trim().isEmpty
          ? null
          : _noteSController.text.trim(),
      noteI: _noteIController.text.trim().isEmpty
          ? null
          : _noteIController.text.trim(),
      noteF: _noteFController.text.trim().isEmpty
          ? null
          : _noteFController.text.trim(),
      noteX: _noteXController.text.trim().isEmpty
          ? null
          : _noteXController.text.trim(),
      nomMedecin: _nomMedecinController.text.trim().isEmpty
          ? null
          : _nomMedecinController.text.trim(),
      dateSignature: _dateSignature,
      signaturePath: _signaturePath,
    );

    final success = await notifier.save(controle);

    if (mounted) {
      if (success) {
        setState(() => _isEditing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Contrôle de fin de service enregistré avec succès'),
            backgroundColor: AppColors.success,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              ref
                      .read(controleFinServiceProvider(
                          widget.sapeurPompierId))
                      .error ??
                  'Erreur lors de l\'enregistrement',
            ),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final state =
        ref.watch(controleFinServiceProvider(widget.sapeurPompierId));

    return AppLayout(
      currentRoute: '/livret/controle-fin-service',
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: const Text('Contrôle de Fin de Service'),
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => Navigator.of(context).pop(),
          ),
          actions: [
            if (!_isEditing && state.controleFinService != null)
              IconButton(
                icon: const Icon(Icons.edit),
                tooltip: 'Modifier',
                onPressed: () {
                  _loadFromEntity(state.controleFinService!);
                  setState(() => _isEditing = true);
                },
              ),
          ],
        ),
        body: state.isLoading
            ? const Center(child: CircularProgressIndicator())
            : _isEditing
                ? _buildForm(state)
                : _buildReadView(state),
        floatingActionButton:
            !_isEditing && state.controleFinService == null
                ? FloatingActionButton.extended(
                    onPressed: () => setState(() => _isEditing = true),
                    backgroundColor: AppColors.primary,
                    icon: const Icon(Icons.add),
                    label: const Text('Saisir le contrôle'),
                  )
                : null,
      ),
    );
  }

  // ── Vue en lecture ──────────────────────────────────────────────────────────

  Widget _buildReadView(ControleFinServiceState state) {
    final controle = state.controleFinService;

    if (controle == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.medical_services_outlined,
                size: 80, color: AppColors.textDisabled),
            const SizedBox(height: 16),
            const Text(
              'Aucun contrôle de fin de service enregistré',
              style: TextStyle(
                fontSize: 18,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Ce contrôle est réalisé lors de la radiation du sapeur-pompier.',
              style:
                  TextStyle(fontSize: 14, color: AppColors.textDisabled),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // En-tête statut
          _buildStatusBanner(controle),
          const SizedBox(height: 24),

          // Informations générales
          _SectionCard(
            title: 'Informations Générales',
            icon: Icons.info_outline,
            children: [
              if (controle.dateRadiation != null)
                _InfoRow(
                  label: 'Date de radiation',
                  value: DateFormat('dd/MM/yyyy')
                      .format(controle.dateRadiation!),
                ),
              if (controle.lieuExamen != null)
                _InfoRow(
                    label: "Lieu d'examen", value: controle.lieuExamen!),
              _InfoRow(
                label: 'État de santé',
                value: controle.isBonneSante
                    ? 'Bonne santé'
                    : 'Atteint de pathologie',
                valueColor: controle.isBonneSante
                    ? AppColors.success
                    : AppColors.warning,
              ),
              if (!controle.isBonneSante && controle.atteintDe != null)
                _InfoRow(label: 'Pathologie', value: controle.atteintDe!),
              if (controle.hospitaliseA != null)
                _InfoRow(
                    label: 'Hospitalisé à',
                    value: controle.hospitaliseA!),
            ],
          ),
          const SizedBox(height: 16),

          // Examen clinique
          _SectionCard(
            title: 'Examen Clinique',
            icon: Icons.monitor_heart_outlined,
            children: [
              if (controle.poids != null)
                _InfoRow(
                    label: 'Poids',
                    value: '${controle.poids!.toStringAsFixed(1)} kg'),
              if (controle.taille != null)
                _InfoRow(
                    label: 'Taille',
                    value: '${controle.taille!.toStringAsFixed(1)} cm'),
              if (controle.indicePignet != null)
                _InfoRow(
                  label: 'Indice Pignet',
                  value:
                      '${controle.indicePignet!.toStringAsFixed(1)} — ${controle.indicePignetInterpretation}',
                ),
              if (controle.ta != null)
                _InfoRow(label: 'Tension artérielle', value: controle.ta!),
              if (controle.sucre != null)
                _InfoRow(label: 'Glycémie', value: controle.sucre!),
              if (controle.albumine != null)
                _InfoRow(label: 'Albumine', value: controle.albumine!),
            ],
          ),
          const SizedBox(height: 16),

          // Vision
          _SectionCard(
            title: 'Acuité Visuelle',
            icon: Icons.visibility_outlined,
            children: [
              _buildVisionRow(
                  'Œil droit', controle.avOdSans, controle.avOdAvec),
              _buildVisionRow(
                  'Œil gauche', controle.avOgSans, controle.avOgAvec),
            ],
          ),
          const SizedBox(height: 16),

          // Audition
          _SectionCard(
            title: 'Acuité Auditive',
            icon: Icons.hearing_outlined,
            children: [
              _buildAuditionRow('Oreille droite', controle.aaOdHaute,
                  controle.aaOdChuchotee),
              _buildAuditionRow('Oreille gauche', controle.aaOgHaute,
                  controle.aaOgChuchotee),
            ],
          ),
          const SizedBox(height: 16),

          // Profil SIGYCOP
          _SectionCard(
            title: 'Profil SIGYCOP Final',
            icon: Icons.tune_outlined,
            children: [
              _buildSigycopGrid(controle),
            ],
          ),
          const SizedBox(height: 16),

          // Médecin & Signature
          _SectionCard(
            title: 'Médecin Contrôleur',
            icon: Icons.local_hospital_outlined,
            children: [
              if (controle.nomMedecin != null)
                _InfoRow(
                    label: 'Médecin', value: controle.nomMedecin!),
              if (controle.dateSignature != null)
                _InfoRow(
                  label: 'Date de signature',
                  value: DateFormat('dd/MM/yyyy')
                      .format(controle.dateSignature!),
                ),
              if (controle.hasSignature) ...[
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.file(
                    File(controle.signaturePath!),
                    width: 200,
                    height: 100,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const Icon(
                      Icons.broken_image,
                      size: 60,
                      color: AppColors.textDisabled,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBanner(ControleFinService controle) {
    final isComplete = controle.isComplete;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isComplete
            ? AppColors.success.withOpacity(0.1)
            : AppColors.warning.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isComplete
              ? AppColors.success.withOpacity(0.4)
              : AppColors.warning.withOpacity(0.4),
        ),
      ),
      child: Row(
        children: [
          Icon(
            isComplete ? Icons.check_circle : Icons.pending_actions,
            color: isComplete ? AppColors.success : AppColors.warning,
            size: 28,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isComplete
                      ? 'Contrôle complet'
                      : 'Contrôle incomplet',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: isComplete
                        ? AppColors.success
                        : AppColors.warning,
                  ),
                ),
                Text(
                  isComplete
                      ? 'Tous les champs obligatoires sont renseignés.'
                      : 'Certains champs obligatoires sont manquants.',
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVisionRow(
      String label, String? sans, String? avec) {
    if (sans == null && avec == null) {
      return _InfoRow(label: label, value: 'Non renseigné');
    }
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
              'Sans correction: ${sans ?? '-'}   Avec correction: ${avec ?? '-'}',
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

  Widget _buildAuditionRow(
      String label, String? haute, String? chuchotee) {
    if (haute == null && chuchotee == null) {
      return _InfoRow(label: label, value: 'Non renseigné');
    }
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
              'Voix haute: ${haute ?? '-'}   Voix chuchotée: ${chuchotee ?? '-'}',
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

  Widget _buildSigycopGrid(ControleFinService controle) {
    final notes = {
      'E': controle.noteE,
      'V': controle.noteV,
      'A': controle.noteA,
      'S': controle.noteS,
      'I': controle.noteI,
      'F': controle.noteF,
      'X': controle.noteX,
    };
    final hasAny = notes.values.any((v) => v != null && v.isNotEmpty);
    if (!hasAny) {
      return const Text(
        'Aucun profil SIGYCOP renseigné',
        style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
      );
    }
    return Wrap(
      spacing: 16,
      runSpacing: 8,
      children: notes.entries
          .where((e) => e.value != null && e.value!.isNotEmpty)
          .map(
            (e) => Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.secondary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                    color: AppColors.secondary.withOpacity(0.3)),
              ),
              child: Text(
                '${e.key}: ${e.value}',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  color: AppColors.secondary,
                  fontSize: 13,
                ),
              ),
            ),
          )
          .toList(),
    );
  }

  // ── Formulaire de saisie ────────────────────────────────────────────────────

  Widget _buildForm(ControleFinServiceState state) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Titre
            Text(
              state.controleFinService != null
                  ? 'Modifier le contrôle de fin de service'
                  : 'Nouveau contrôle de fin de service',
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 24),

            // ── Section 1 : Informations générales ─────────────────────────
            _SectionCard(
              title: 'Informations Générales',
              icon: Icons.info_outline,
              children: [
                // Date de radiation
                InkWell(
                  onTap: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: _dateRadiation ?? DateTime.now(),
                      firstDate: DateTime(1900),
                      lastDate: DateTime(2100),
                      locale: const Locale('fr', 'FR'),
                    );
                    if (picked != null) {
                      setState(() => _dateRadiation = picked);
                    }
                  },
                  child: InputDecorator(
                    decoration: const InputDecoration(
                      labelText: 'Date de radiation',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.calendar_today),
                    ),
                    child: Text(
                      _dateRadiation != null
                          ? DateFormat('dd/MM/yyyy')
                              .format(_dateRadiation!)
                          : 'Sélectionner une date',
                      style: TextStyle(
                        color: _dateRadiation != null
                            ? AppColors.textPrimary
                            : AppColors.textHint,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Lieu d'examen
                TextFormField(
                  controller: _lieuExamenController,
                  decoration: const InputDecoration(
                    labelText: "Lieu d'examen",
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.location_on_outlined),
                  ),
                ),
                const SizedBox(height: 16),

                // État de santé
                DropdownButtonFormField<String>(
                  value: _etatSante,
                  decoration: const InputDecoration(
                    labelText: 'État de santé *',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.health_and_safety_outlined),
                  ),
                  items: EtatSanteFinService.values.map((e) {
                    final color = e == EtatSanteFinService.bonneSante
                        ? AppColors.success
                        : AppColors.warning;
                    final icon = e == EtatSanteFinService.bonneSante
                        ? Icons.check_circle_outline
                        : Icons.warning_amber_outlined;
                    return DropdownMenuItem(
                      value: e.name,
                      child: Row(
                        children: [
                          Icon(icon, size: 16, color: color),
                          const SizedBox(width: 8),
                          Text(
                            e.libelle,
                            style: TextStyle(color: color),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                  onChanged: (value) {
                    if (value != null) {
                      setState(() => _etatSante = value);
                    }
                  },
                  validator: (value) =>
                      value == null ? 'Veuillez sélectionner un état' : null,
                ),
                const SizedBox(height: 16),

                // Champ conditionnel : atteint de
                if (_etatSante == EtatSanteFinService.atteintDe.name) ...[
                  TextFormField(
                    controller: _atteintDeController,
                    decoration: const InputDecoration(
                      labelText: 'Atteint de (pathologie)',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.medical_information_outlined),
                    ),
                    maxLines: 2,
                  ),
                  const SizedBox(height: 16),
                ],

                // Hospitalisé à
                TextFormField(
                  controller: _hospitaliseAController,
                  decoration: const InputDecoration(
                    labelText: 'Hospitalisé à (si applicable)',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.local_hospital_outlined),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // ── Section 2 : Examen clinique ────────────────────────────────
            _SectionCard(
              title: 'Examen Clinique',
              icon: Icons.monitor_heart_outlined,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _poidsController,
                        decoration: const InputDecoration(
                          labelText: 'Poids (kg)',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.monitor_weight_outlined),
                        ),
                        keyboardType: const TextInputType.numberWithOptions(
                            decimal: true),
                        inputFormatters: [
                          FilteringTextInputFormatter.allow(
                              RegExp(r'^\d*\.?\d*')),
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: TextFormField(
                        controller: _tailleController,
                        decoration: const InputDecoration(
                          labelText: 'Taille (cm)',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.height),
                        ),
                        keyboardType: const TextInputType.numberWithOptions(
                            decimal: true),
                        inputFormatters: [
                          FilteringTextInputFormatter.allow(
                              RegExp(r'^\d*\.?\d*')),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _taController,
                        decoration: const InputDecoration(
                          labelText: 'Tension artérielle',
                          border: OutlineInputBorder(),
                          prefixIcon:
                              Icon(Icons.favorite_border),
                          hintText: 'ex: 12/8',
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: TextFormField(
                        controller: _sucreController,
                        decoration: const InputDecoration(
                          labelText: 'Glycémie',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.science_outlined),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _albumineController,
                  decoration: const InputDecoration(
                    labelText: 'Albumine',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.biotech_outlined),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // ── Section 3 : Vision ─────────────────────────────────────────
            _SectionCard(
              title: 'Acuité Visuelle',
              icon: Icons.visibility_outlined,
              children: [
                const Text(
                  'Œil droit',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _avOdSansController,
                        decoration: const InputDecoration(
                          labelText: 'Sans correction',
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: TextFormField(
                        controller: _avOdAvecController,
                        decoration: const InputDecoration(
                          labelText: 'Avec correction',
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Text(
                  'Œil gauche',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _avOgSansController,
                        decoration: const InputDecoration(
                          labelText: 'Sans correction',
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: TextFormField(
                        controller: _avOgAvecController,
                        decoration: const InputDecoration(
                          labelText: 'Avec correction',
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),

            // ── Section 4 : Audition ───────────────────────────────────────
            _SectionCard(
              title: 'Acuité Auditive',
              icon: Icons.hearing_outlined,
              children: [
                const Text(
                  'Oreille droite',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _aaOdHauteController,
                        decoration: const InputDecoration(
                          labelText: 'Voix haute',
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: TextFormField(
                        controller: _aaOdChuchoteeController,
                        decoration: const InputDecoration(
                          labelText: 'Voix chuchotée',
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Text(
                  'Oreille gauche',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _aaOgHauteController,
                        decoration: const InputDecoration(
                          labelText: 'Voix haute',
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: TextFormField(
                        controller: _aaOgChuchoteeController,
                        decoration: const InputDecoration(
                          labelText: 'Voix chuchotée',
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),

            // ── Section 5 : Profil SIGYCOP final ──────────────────────────
            _SectionCard(
              title: 'Profil SIGYCOP Final',
              icon: Icons.tune_outlined,
              children: [
                const Text(
                  'Notes textuelles complémentaires au profil SIGYCOP',
                  style: TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _noteEController,
                        decoration: const InputDecoration(
                          labelText: 'E',
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextFormField(
                        controller: _noteVController,
                        decoration: const InputDecoration(
                          labelText: 'V',
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextFormField(
                        controller: _noteAController,
                        decoration: const InputDecoration(
                          labelText: 'A',
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextFormField(
                        controller: _noteSController,
                        decoration: const InputDecoration(
                          labelText: 'S',
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _noteIController,
                        decoration: const InputDecoration(
                          labelText: 'I',
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextFormField(
                        controller: _noteFController,
                        decoration: const InputDecoration(
                          labelText: 'F',
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextFormField(
                        controller: _noteXController,
                        decoration: const InputDecoration(
                          labelText: 'X',
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),
                    const Expanded(child: SizedBox()),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),

            // ── Section 6 : Médecin et signature ──────────────────────────
            _SectionCard(
              title: 'Médecin Contrôleur',
              icon: Icons.local_hospital_outlined,
              children: [
                TextFormField(
                  controller: _nomMedecinController,
                  decoration: const InputDecoration(
                    labelText: 'Nom du médecin contrôleur',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.person_outlined),
                  ),
                ),
                const SizedBox(height: 16),

                // Date de signature
                InkWell(
                  onTap: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: _dateSignature ?? DateTime.now(),
                      firstDate: DateTime(1900),
                      lastDate: DateTime(2100),
                      locale: const Locale('fr', 'FR'),
                    );
                    if (picked != null) {
                      setState(() => _dateSignature = picked);
                    }
                  },
                  child: InputDecorator(
                    decoration: const InputDecoration(
                      labelText: 'Date de signature',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.calendar_today),
                    ),
                    child: Text(
                      _dateSignature != null
                          ? DateFormat('dd/MM/yyyy')
                              .format(_dateSignature!)
                          : 'Sélectionner une date',
                      style: TextStyle(
                        color: _dateSignature != null
                            ? AppColors.textPrimary
                            : AppColors.textHint,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Signature image
                const Text(
                  'Signature du médecin',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                if (_signaturePath != null) ...[
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.file(
                      File(_signaturePath!),
                      width: 200,
                      height: 100,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => const Icon(
                        Icons.broken_image,
                        size: 60,
                        color: AppColors.textDisabled,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
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
            const SizedBox(height: 40),

            // ── Boutons d'action ───────────────────────────────────────────
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                OutlinedButton(
                  onPressed: state.isLoading
                      ? null
                      : () => setState(() => _isEditing = false),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 32, vertical: 16),
                  ),
                  child: const Text('Annuler'),
                ),
                const SizedBox(width: 16),
                ElevatedButton(
                  onPressed: state.isLoading ? null : _save,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 32, vertical: 16),
                  ),
                  child: state.isLoading
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

// ─────────────────────────────────────────────────────────────────────────────
// Widgets utilitaires partagés
// ─────────────────────────────────────────────────────────────────────────────

/// Carte de section avec titre et icône
class _SectionCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final List<Widget> children;

  const _SectionCard({
    required this.title,
    required this.icon,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: AppColors.primary, size: 20),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
            const Divider(height: 24),
            ...children,
          ],
        ),
      ),
    );
  }
}

/// Ligne d'information label/valeur en lecture seule
class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  const _InfoRow({
    required this.label,
    required this.value,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 160,
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
              style: TextStyle(
                color: valueColor ?? AppColors.textPrimary,
                fontSize: 13,
                fontWeight: valueColor != null
                    ? FontWeight.w600
                    : FontWeight.normal,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
