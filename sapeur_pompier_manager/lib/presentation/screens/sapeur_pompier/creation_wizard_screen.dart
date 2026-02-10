import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../domain/entities/sapeur_pompier.dart';
import '../../../domain/entities/etat_civil.dart';
import '../../providers/auth_provider.dart';
import '../../providers/sapeur_pompier_provider.dart';

// ---------------------------------------------------------------------------
// State pour le wizard de création
// ---------------------------------------------------------------------------
class _WizardState {
  final int currentStep;
  final String matricule;
  final String nom;
  final String prenoms;
  final DateTime? dateNaissance;
  final String lieuNaissance;
  final String nomPere;
  final String nomMere;
  final bool isLoading;
  final String? matriculeError;

  const _WizardState({
    this.currentStep = 0,
    this.matricule = '',
    this.nom = '',
    this.prenoms = '',
    this.dateNaissance,
    this.lieuNaissance = '',
    this.nomPere = '',
    this.nomMere = '',
    this.isLoading = false,
    this.matriculeError,
  });

  _WizardState copyWith({
    int? currentStep,
    String? matricule,
    String? nom,
    String? prenoms,
    DateTime? dateNaissance,
    String? lieuNaissance,
    String? nomPere,
    String? nomMere,
    bool? isLoading,
    String? matriculeError,
    bool clearMatriculeError = false,
  }) {
    return _WizardState(
      currentStep: currentStep ?? this.currentStep,
      matricule: matricule ?? this.matricule,
      nom: nom ?? this.nom,
      prenoms: prenoms ?? this.prenoms,
      dateNaissance: dateNaissance ?? this.dateNaissance,
      lieuNaissance: lieuNaissance ?? this.lieuNaissance,
      nomPere: nomPere ?? this.nomPere,
      nomMere: nomMere ?? this.nomMere,
      isLoading: isLoading ?? this.isLoading,
      matriculeError: clearMatriculeError ? null : matriculeError ?? this.matriculeError,
    );
  }
}

// ---------------------------------------------------------------------------
// Wizard principal
// ---------------------------------------------------------------------------
class CreationWizardScreen extends ConsumerStatefulWidget {
  const CreationWizardScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<CreationWizardScreen> createState() =>
      _CreationWizardScreenState();
}

class _CreationWizardScreenState extends ConsumerState<CreationWizardScreen> {
  _WizardState _wizardState = const _WizardState();

  // Formulaire étape 1
  final _formKeyStep1 = GlobalKey<FormState>();
  final _matriculeController = TextEditingController();

  // Formulaire étape 2
  final _formKeyStep2 = GlobalKey<FormState>();
  final _nomController = TextEditingController();
  final _prenomsController = TextEditingController();
  final _lieuNaissanceController = TextEditingController();
  final _nomPereController = TextEditingController();
  final _nomMereController = TextEditingController();
  DateTime? _selectedDate;

  @override
  void dispose() {
    _matriculeController.dispose();
    _nomController.dispose();
    _prenomsController.dispose();
    _lieuNaissanceController.dispose();
    _nomPereController.dispose();
    _nomMereController.dispose();
    super.dispose();
  }

  // ---------------------------------------------------------------------------
  // Navigation entre étapes
  // ---------------------------------------------------------------------------
  Future<void> _goToNextStep() async {
    if (_wizardState.currentStep == 0) {
      if (!_formKeyStep1.currentState!.validate()) return;
      final matricule = _matriculeController.text.trim().toUpperCase();

      // Vérifier l'unicité du matricule
      setState(() {
        _wizardState = _wizardState.copyWith(isLoading: true, clearMatriculeError: true);
      });

      final repo = ref.read(sapeurPompierRepositoryProvider);
      final result = await repo.searchSapeursPompiers(matricule);

      final exists = result.fold(
        (_) => false,
        (list) => list.any(
          (sp) => sp.matricule.toUpperCase() == matricule,
        ),
      );

      if (exists) {
        setState(() {
          _wizardState = _wizardState.copyWith(
            isLoading: false,
            matriculeError: 'Ce matricule existe déjà dans le système.',
          );
        });
        return;
      }

      setState(() {
        _wizardState = _wizardState.copyWith(
          isLoading: false,
          currentStep: 1,
          matricule: matricule,
          clearMatriculeError: true,
        );
      });
      return;
    }

    if (_wizardState.currentStep == 1) {
      if (!_formKeyStep2.currentState!.validate()) return;
      if (_selectedDate == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Veuillez sélectionner une date de naissance.'),
            backgroundColor: AppColors.error,
          ),
        );
        return;
      }
      setState(() {
        _wizardState = _wizardState.copyWith(
          currentStep: 2,
          nom: _nomController.text.trim().toUpperCase(),
          prenoms: _prenomsController.text.trim(),
          dateNaissance: _selectedDate,
          lieuNaissance: _lieuNaissanceController.text.trim(),
          nomPere: _nomPereController.text.trim(),
          nomMere: _nomMereController.text.trim(),
        );
      });
    }
  }

  void _goToPreviousStep() {
    if (_wizardState.currentStep > 0) {
      setState(() {
        _wizardState =
            _wizardState.copyWith(currentStep: _wizardState.currentStep - 1);
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Création finale du dossier
  // ---------------------------------------------------------------------------
  Future<void> _createDossier() async {
    setState(() {
      _wizardState = _wizardState.copyWith(isLoading: true);
    });

    final now = DateTime.now();
    final currentUser = ref.read(authProvider).user;

    final newSP = SapeurPompier(
      id: '', // Sera assigné par le repository
      matricule: _wizardState.matricule,
      createdAt: now,
      updatedAt: now,
      createdBy: currentUser?.id,
      updatedBy: currentUser?.id,
      etatCivil: EtatCivil(
        id: '',
        sapeurPompierId: '',
        nom: _wizardState.nom,
        prenoms: _wizardState.prenoms,
        dateNaissance: _wizardState.dateNaissance!,
        lieuNaissance: _wizardState.lieuNaissance,
        nomPere: _wizardState.nomPere.isNotEmpty ? _wizardState.nomPere : null,
        nomMere: _wizardState.nomMere.isNotEmpty ? _wizardState.nomMere : null,
      ),
    );

    final success = await ref
        .read(sapeursPompiersProvider.notifier)
        .createSapeurPompier(newSP);

    if (!mounted) return;

    setState(() {
      _wizardState = _wizardState.copyWith(isLoading: false);
    });

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.white),
              const SizedBox(width: 12),
              Text(
                'Dossier de ${_wizardState.prenoms} ${_wizardState.nom} créé avec succès.',
              ),
            ],
          ),
          backgroundColor: AppColors.success,
          duration: const Duration(seconds: 3),
        ),
      );

      // Recharger la liste et naviguer vers la liste
      await ref.read(sapeursPompiersProvider.notifier).loadSapeursPompiers();

      if (mounted) {
        Navigator.of(context).pushReplacementNamed('/liste');
      }
    } else {
      final error =
          ref.read(sapeursPompiersProvider).error ?? AppStrings.saveError;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Sélection de date
  // ---------------------------------------------------------------------------
  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate ??
          DateTime.now().subtract(const Duration(days: 365 * 25)),
      firstDate: DateTime(1940),
      lastDate: DateTime.now().subtract(const Duration(days: 365 * 16)),
      locale: const Locale('fr', 'FR'),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: const ColorScheme.light(primary: AppColors.primary),
        ),
        child: child!,
      ),
    );
    if (picked != null) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------------
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        title: const Text(
          'Nouveau dossier sapeur-pompier',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
        elevation: 0,
      ),
      body: Column(
        children: [
          _buildStepperHeader(),
          Expanded(
            child: _wizardState.isLoading
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircularProgressIndicator(color: AppColors.primary),
                        SizedBox(height: 16),
                        Text(
                          'Traitement en cours...',
                          style: TextStyle(color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  )
                : SingleChildScrollView(
                    padding: const EdgeInsets.all(24),
                    child: _buildCurrentStep(),
                  ),
          ),
          _buildNavigationButtons(),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Indicateur de progression (stepper horizontal)
  // ---------------------------------------------------------------------------
  Widget _buildStepperHeader() {
    final steps = ['Matricule', 'État civil', 'Résumé'];

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 24),
      child: Row(
        children: List.generate(steps.length * 2 - 1, (index) {
          if (index.isOdd) {
            // Connecteur
            final stepIdx = index ~/ 2;
            final isCompleted = _wizardState.currentStep > stepIdx;
            return Expanded(
              child: Container(
                height: 2,
                color: isCompleted ? AppColors.primary : AppColors.border,
              ),
            );
          }
          final stepIdx = index ~/ 2;
          final isActive = _wizardState.currentStep == stepIdx;
          final isCompleted = _wizardState.currentStep > stepIdx;

          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: isCompleted
                      ? AppColors.success
                      : isActive
                          ? AppColors.primary
                          : AppColors.border,
                  shape: BoxShape.circle,
                  boxShadow: isActive
                      ? [
                          BoxShadow(
                            color: AppColors.primary.withOpacity(0.3),
                            blurRadius: 8,
                            spreadRadius: 2,
                          )
                        ]
                      : null,
                ),
                child: Center(
                  child: isCompleted
                      ? const Icon(Icons.check, color: Colors.white, size: 20)
                      : Text(
                          '${stepIdx + 1}',
                          style: TextStyle(
                            color: isActive ? Colors.white : AppColors.textSecondary,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                steps[stepIdx],
                style: TextStyle(
                  fontSize: 12,
                  fontWeight:
                      isActive ? FontWeight.bold : FontWeight.normal,
                  color: isActive
                      ? AppColors.primary
                      : isCompleted
                          ? AppColors.success
                          : AppColors.textSecondary,
                ),
              ),
            ],
          );
        }),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Étape courante
  // ---------------------------------------------------------------------------
  Widget _buildCurrentStep() {
    switch (_wizardState.currentStep) {
      case 0:
        return _buildStep1();
      case 1:
        return _buildStep2();
      case 2:
        return _buildStep3();
      default:
        return const SizedBox.shrink();
    }
  }

  // ---------------------------------------------------------------------------
  // Étape 1 — Matricule
  // ---------------------------------------------------------------------------
  Widget _buildStep1() {
    return Form(
      key: _formKeyStep1,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionTitle(
            icon: Icons.badge,
            title: 'Étape 1 — Matricule',
            subtitle: 'Saisissez le matricule unique du sapeur-pompier',
          ),
          const SizedBox(height: 24),
          _buildInfoCard(
            icon: Icons.info_outline,
            color: AppColors.info,
            text:
                'Le matricule doit respecter le format SPR-XXXXX (ex: SPR-00123). '
                'Il doit être unique dans le système.',
          ),
          const SizedBox(height: 24),
          TextFormField(
            controller: _matriculeController,
            decoration: _inputDecoration(
              label: 'Matricule *',
              hint: 'SPR-00123',
              icon: Icons.badge,
              errorText: _wizardState.matriculeError,
            ),
            textCapitalization: TextCapitalization.characters,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 18,
              letterSpacing: 2,
            ),
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return AppStrings.matriculeRequired;
              }
              final pattern = RegExp(r'^SPR-\d{5}$');
              if (!pattern.hasMatch(value.trim().toUpperCase())) {
                return 'Format invalide. Utilisez: SPR-XXXXX (5 chiffres)';
              }
              return null;
            },
            onChanged: (_) {
              if (_wizardState.matriculeError != null) {
                setState(() {
                  _wizardState =
                      _wizardState.copyWith(clearMatriculeError: true);
                });
              }
            },
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Étape 2 — État civil
  // ---------------------------------------------------------------------------
  Widget _buildStep2() {
    return Form(
      key: _formKeyStep2,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionTitle(
            icon: Icons.person,
            title: 'Étape 2 — État civil',
            subtitle: 'Renseignez les informations personnelles',
          ),
          const SizedBox(height: 24),

          // Nom
          TextFormField(
            controller: _nomController,
            decoration: _inputDecoration(
              label: 'Nom *',
              hint: 'DUPONT',
              icon: Icons.person,
            ),
            textCapitalization: TextCapitalization.characters,
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return AppStrings.nomRequired;
              }
              return null;
            },
          ),
          const SizedBox(height: 16),

          // Prénoms
          TextFormField(
            controller: _prenomsController,
            decoration: _inputDecoration(
              label: 'Prénoms *',
              hint: 'Jean-Baptiste',
              icon: Icons.person_outline,
            ),
            textCapitalization: TextCapitalization.words,
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return AppStrings.prenomsRequired;
              }
              return null;
            },
          ),
          const SizedBox(height: 16),

          // Date de naissance
          GestureDetector(
            onTap: _pickDate,
            child: AbsorbPointer(
              child: TextFormField(
                decoration: _inputDecoration(
                  label: 'Date de naissance *',
                  hint: 'Toucher pour sélectionner',
                  icon: Icons.calendar_today,
                ).copyWith(
                  suffixIcon: const Icon(Icons.calendar_month,
                      color: AppColors.primary),
                ),
                controller: TextEditingController(
                  text: _selectedDate != null
                      ? DateFormat('dd/MM/yyyy').format(_selectedDate!)
                      : '',
                ),
                validator: (value) {
                  if (_selectedDate == null) {
                    return AppStrings.dateNaissanceRequired;
                  }
                  return null;
                },
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Lieu de naissance
          TextFormField(
            controller: _lieuNaissanceController,
            decoration: _inputDecoration(
              label: 'Lieu de naissance *',
              hint: 'Ouagadougou',
              icon: Icons.location_on,
            ),
            textCapitalization: TextCapitalization.words,
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Le lieu de naissance est obligatoire';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),

          // Nom du père
          TextFormField(
            controller: _nomPereController,
            decoration: _inputDecoration(
              label: 'Nom du père',
              hint: 'Facultatif',
              icon: Icons.man,
            ),
            textCapitalization: TextCapitalization.words,
          ),
          const SizedBox(height: 16),

          // Nom de la mère
          TextFormField(
            controller: _nomMereController,
            decoration: _inputDecoration(
              label: 'Nom de la mère',
              hint: 'Facultatif',
              icon: Icons.woman,
            ),
            textCapitalization: TextCapitalization.words,
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Étape 3 — Résumé
  // ---------------------------------------------------------------------------
  Widget _buildStep3() {
    final dateStr = _wizardState.dateNaissance != null
        ? DateFormat('dd MMMM yyyy', 'fr').format(_wizardState.dateNaissance!)
        : '-';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionTitle(
          icon: Icons.summarize,
          title: 'Étape 3 — Récapitulatif',
          subtitle: 'Vérifiez les informations avant de créer le dossier',
        ),
        const SizedBox(height: 24),
        Card(
          elevation: 2,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                // En-tête avec avatar
                Row(
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.person,
                          color: AppColors.primary, size: 36),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${_wizardState.prenoms} ${_wizardState.nom}',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              _wizardState.matricule,
                              style: const TextStyle(
                                color: AppColors.primary,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 1.5,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const Divider(height: 32),

                // Détails
                _summaryRow(
                    Icons.badge, 'Matricule', _wizardState.matricule),
                _summaryRow(
                    Icons.person, 'Nom', _wizardState.nom),
                _summaryRow(
                    Icons.person_outline, 'Prénoms', _wizardState.prenoms),
                _summaryRow(
                    Icons.calendar_today, 'Date de naissance', dateStr),
                _summaryRow(Icons.location_on, 'Lieu de naissance',
                    _wizardState.lieuNaissance),
                if (_wizardState.nomPere.isNotEmpty)
                  _summaryRow(
                      Icons.man, 'Nom du père', _wizardState.nomPere),
                if (_wizardState.nomMere.isNotEmpty)
                  _summaryRow(
                      Icons.woman, 'Nom de la mère', _wizardState.nomMere),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        _buildInfoCard(
          icon: Icons.check_circle_outline,
          color: AppColors.success,
          text:
              'En cliquant sur "Créer le dossier", vous allez créer un nouveau dossier '
              'pour ce sapeur-pompier. Vous pourrez compléter les autres sections '
              '(constantes, vaccinations, etc.) depuis la fiche détaillée.',
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // Boutons de navigation
  // ---------------------------------------------------------------------------
  Widget _buildNavigationButtons() {
    final isFirstStep = _wizardState.currentStep == 0;
    final isLastStep = _wizardState.currentStep == 2;

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            if (!isFirstStep)
              Expanded(
                child: OutlinedButton.icon(
                  onPressed:
                      _wizardState.isLoading ? null : _goToPreviousStep,
                  icon: const Icon(Icons.arrow_back),
                  label: const Text(AppStrings.previous),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    side: const BorderSide(color: AppColors.primary),
                    foregroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
            if (!isFirstStep) const SizedBox(width: 12),
            Expanded(
              flex: isFirstStep ? 1 : 1,
              child: ElevatedButton.icon(
                onPressed: _wizardState.isLoading
                    ? null
                    : isLastStep
                        ? _createDossier
                        : _goToNextStep,
                icon: Icon(
                  isLastStep ? Icons.create_new_folder : Icons.arrow_forward,
                ),
                label: Text(
                  isLastStep ? 'Créer le dossier' : AppStrings.next,
                  style: const TextStyle(
                      fontSize: 16, fontWeight: FontWeight.bold),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor:
                      isLastStep ? AppColors.success : AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  elevation: 2,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Widgets helpers
  // ---------------------------------------------------------------------------
  Widget _sectionTitle(
      {required IconData icon,
      required String title,
      required String subtitle}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: AppColors.primary, size: 24),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildInfoCard(
      {required IconData icon,
      required Color color,
      required String text}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                color: color.withOpacity(0.85),
                fontSize: 13,
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }

  InputDecoration _inputDecoration({
    required String label,
    required String hint,
    required IconData icon,
    String? errorText,
  }) {
    return InputDecoration(
      labelText: label,
      hintText: hint,
      errorText: errorText,
      prefixIcon: Icon(icon, color: AppColors.primary, size: 20),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.primary, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.error),
      ),
      filled: true,
      fillColor: Colors.white,
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    );
  }

  Widget _summaryRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: AppColors.primary),
          const SizedBox(width: 10),
          SizedBox(
            width: 140,
            child: Text(
              label,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 14,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value.isNotEmpty ? value : '-',
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
