import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_colors.dart';
import '../../../domain/entities/examen_incorporation.dart';
import '../../providers/sapeur_pompier_provider.dart';
import '../../widgets/app_layout.dart';

/// Écran de saisie de l'examen d'incorporation
class ExamenIncorporationScreen extends ConsumerStatefulWidget {
  final String sapeurPompierId;

  const ExamenIncorporationScreen({
    Key? key,
    required this.sapeurPompierId,
  }) : super(key: key);

  @override
  ConsumerState<ExamenIncorporationScreen> createState() =>
      _ExamenIncorporationScreenState();
}

class _ExamenIncorporationScreenState
    extends ConsumerState<ExamenIncorporationScreen> {
  final _formKey = GlobalKey<FormState>();
  int _currentStep = 0;

  // Antécédents
  final _antecedentsHereditairesController = TextEditingController();
  final _antecedentsPersonnelsController = TextEditingController();
  final _antecedentsCollaterauxController = TextEditingController();

  // Examens cliniques
  final _appareilRespiratoireController = TextEditingController();
  final _radiographieController = TextEditingController();
  final _appareilGenitoUrinaireController = TextEditingController();
  final _appareilDigestifController = TextEditingController();
  final _appareilCirculatoireController = TextEditingController();
  final _systemeNerveuxController = TextEditingController();
  final _dentureEtatController = TextEditingController();
  final _coefficientMasticationController = TextEditingController();
  final _peauAnnexesController = TextEditingController();
  final _fcController = TextEditingController();
  final _taController = TextEditingController();
  final _sucreController = TextEditingController();
  final _albumineController = TextEditingController();

  // Vision
  final _avOdSansController = TextEditingController();
  final _avOdAvecController = TextEditingController();
  final _avOgSansController = TextEditingController();
  final _avOgAvecController = TextEditingController();
  final _sensChromatiqueController = TextEditingController();

  // Audition
  final _aaOdHauteController = TextEditingController();
  final _aaOdChuchoteeController = TextEditingController();
  final _aaOgHauteController = TextEditingController();
  final _aaOgChuchoteeController = TextEditingController();

  // Profil SIGYCOP
  double _s = 0;
  double _i = 0;
  double _g = 0;
  double _y = 0;
  double _c = 0;
  double _o = 0;
  double _p = 0;

  // Notes additionnelles VAESIFX
  final _noteVController = TextEditingController();
  final _noteAController = TextEditingController();
  final _noteEController = TextEditingController();
  final _noteSController = TextEditingController();
  final _noteIController = TextEditingController();
  final _noteFController = TextEditingController();
  final _noteXController = TextEditingController();

  // Conclusions
  DateTime? _dateCloture;
  String? _decision;
  final _aSurveillerController = TextEditingController();
  final _mentionsSpecialesController = TextEditingController();
  bool _entrainementSpecial = false;
  final _entrainementSpecialDetailsController = TextEditingController();
  final _utilisationPreferentielleController = TextEditingController();
  final _nomMedecinController = TextEditingController();
  String? _signatureMedecinPath;

  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadExamen();
  }

  @override
  void dispose() {
    _antecedentsHereditairesController.dispose();
    _antecedentsPersonnelsController.dispose();
    _antecedentsCollaterauxController.dispose();
    _appareilRespiratoireController.dispose();
    _radiographieController.dispose();
    _appareilGenitoUrinaireController.dispose();
    _appareilDigestifController.dispose();
    _appareilCirculatoireController.dispose();
    _systemeNerveuxController.dispose();
    _dentureEtatController.dispose();
    _coefficientMasticationController.dispose();
    _peauAnnexesController.dispose();
    _fcController.dispose();
    _taController.dispose();
    _sucreController.dispose();
    _albumineController.dispose();
    _avOdSansController.dispose();
    _avOdAvecController.dispose();
    _avOgSansController.dispose();
    _avOgAvecController.dispose();
    _sensChromatiqueController.dispose();
    _aaOdHauteController.dispose();
    _aaOdChuchoteeController.dispose();
    _aaOgHauteController.dispose();
    _aaOgChuchoteeController.dispose();
    _noteVController.dispose();
    _noteAController.dispose();
    _noteEController.dispose();
    _noteSController.dispose();
    _noteIController.dispose();
    _noteFController.dispose();
    _noteXController.dispose();
    _aSurveillerController.dispose();
    _mentionsSpecialesController.dispose();
    _entrainementSpecialDetailsController.dispose();
    _utilisationPreferentielleController.dispose();
    _nomMedecinController.dispose();
    super.dispose();
  }

  Future<void> _loadExamen() async {
    setState(() => _isLoading = true);

    final repository = ref.read(sapeurPompierRepositoryProvider);
    final result =
        await repository.getExamenIncorporation(widget.sapeurPompierId);

    result.fold(
      (failure) {
        if (mounted) {
          setState(() => _isLoading = false);
        }
      },
      (examen) {
        if (examen != null && mounted) {
          setState(() {
            _antecedentsHereditairesController.text =
                examen.antecedentsHereditaires ?? '';
            _antecedentsPersonnelsController.text =
                examen.antecedentsPersonnels ?? '';
            _antecedentsCollaterauxController.text =
                examen.antecedentsCollateraux ?? '';
            _appareilRespiratoireController.text =
                examen.appareilRespiratoire ?? '';
            _radiographieController.text = examen.radiographie ?? '';
            _appareilGenitoUrinaireController.text =
                examen.appareilGenitoUrinaire ?? '';
            _appareilDigestifController.text = examen.appareilDigestif ?? '';
            _appareilCirculatoireController.text =
                examen.appareilCirculatoire ?? '';
            _systemeNerveuxController.text = examen.systemeNerveux ?? '';
            _dentureEtatController.text = examen.dentureEtat ?? '';
            _coefficientMasticationController.text =
                examen.coefficientMastication ?? '';
            _peauAnnexesController.text = examen.peauAnnexes ?? '';
            _fcController.text = examen.fc?.toString() ?? '';
            _taController.text = examen.ta ?? '';
            _sucreController.text = examen.sucre ?? '';
            _albumineController.text = examen.albumine ?? '';
            _avOdSansController.text = examen.avOdSans ?? '';
            _avOdAvecController.text = examen.avOdAvec ?? '';
            _avOgSansController.text = examen.avOgSans ?? '';
            _avOgAvecController.text = examen.avOgAvec ?? '';
            _sensChromatiqueController.text = examen.sensChromatique ?? '';
            _aaOdHauteController.text = examen.aaOdHaute ?? '';
            _aaOdChuchoteeController.text = examen.aaOdChuchotee ?? '';
            _aaOgHauteController.text = examen.aaOgHaute ?? '';
            _aaOgChuchoteeController.text = examen.aaOgChuchotee ?? '';

            _s = examen.profilSigycop.s.toDouble();
            _i = examen.profilSigycop.i.toDouble();
            _g = examen.profilSigycop.g.toDouble();
            _y = examen.profilSigycop.y.toDouble();
            _c = examen.profilSigycop.c.toDouble();
            _o = examen.profilSigycop.o.toDouble();
            _p = examen.profilSigycop.p.toDouble();

            _noteVController.text = examen.notesAdditionnelles.v ?? '';
            _noteAController.text = examen.notesAdditionnelles.a ?? '';
            _noteEController.text = examen.notesAdditionnelles.e ?? '';
            _noteSController.text = examen.notesAdditionnelles.s ?? '';
            _noteIController.text = examen.notesAdditionnelles.i ?? '';
            _noteFController.text = examen.notesAdditionnelles.f ?? '';
            _noteXController.text = examen.notesAdditionnelles.x ?? '';

            _dateCloture = examen.dateCloture;
            _decision = examen.decision;
            _aSurveillerController.text = examen.aSurveiller ?? '';
            _mentionsSpecialesController.text = examen.mentionsSpeciales ?? '';
            _entrainementSpecial = examen.entrainementSpecial;
            _entrainementSpecialDetailsController.text =
                examen.entrainementSpecialDetails ?? '';
            _utilisationPreferentielleController.text =
                examen.utilisationPreferentielle ?? '';
            _nomMedecinController.text = examen.nomMedecin ?? '';
            _signatureMedecinPath = examen.signatureMedecinPath;

            _isLoading = false;
          });
        } else {
          setState(() => _isLoading = false);
        }
      },
    );
  }

  Future<void> _saveExamen() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final examen = ExamenIncorporation(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      sapeurPompierId: widget.sapeurPompierId,
      antecedentsHereditaires: _antecedentsHereditairesController.text.trim(),
      antecedentsPersonnels: _antecedentsPersonnelsController.text.trim(),
      antecedentsCollateraux: _antecedentsCollaterauxController.text.trim(),
      appareilRespiratoire: _appareilRespiratoireController.text.trim(),
      radiographie: _radiographieController.text.trim(),
      appareilGenitoUrinaire: _appareilGenitoUrinaireController.text.trim(),
      appareilDigestif: _appareilDigestifController.text.trim(),
      appareilCirculatoire: _appareilCirculatoireController.text.trim(),
      systemeNerveux: _systemeNerveuxController.text.trim(),
      dentureEtat: _dentureEtatController.text.trim(),
      coefficientMastication: _coefficientMasticationController.text.trim(),
      peauAnnexes: _peauAnnexesController.text.trim(),
      fc: int.tryParse(_fcController.text),
      ta: _taController.text.trim(),
      sucre: _sucreController.text.trim(),
      albumine: _albumineController.text.trim(),
      avOdSans: _avOdSansController.text.trim(),
      avOdAvec: _avOdAvecController.text.trim(),
      avOgSans: _avOgSansController.text.trim(),
      avOgAvec: _avOgAvecController.text.trim(),
      sensChromatique: _sensChromatiqueController.text.trim(),
      aaOdHaute: _aaOdHauteController.text.trim(),
      aaOdChuchotee: _aaOdChuchoteeController.text.trim(),
      aaOgHaute: _aaOgHauteController.text.trim(),
      aaOgChuchotee: _aaOgChuchoteeController.text.trim(),
      profilSigycop: ProfilSigycop(
        s: _s.round(),
        i: _i.round(),
        g: _g.round(),
        y: _y.round(),
        c: _c.round(),
        o: _o.round(),
        p: _p.round(),
      ),
      notesAdditionnelles: NotesAdditionnelles(
        v: _noteVController.text.trim(),
        a: _noteAController.text.trim(),
        e: _noteEController.text.trim(),
        s: _noteSController.text.trim(),
        i: _noteIController.text.trim(),
        f: _noteFController.text.trim(),
        x: _noteXController.text.trim(),
      ),
      dateCloture: _dateCloture,
      decision: _decision,
      aSurveiller: _aSurveillerController.text.trim(),
      mentionsSpeciales: _mentionsSpecialesController.text.trim(),
      entrainementSpecial: _entrainementSpecial,
      entrainementSpecialDetails:
          _entrainementSpecialDetailsController.text.trim(),
      utilisationPreferentielle:
          _utilisationPreferentielleController.text.trim(),
      nomMedecin: _nomMedecinController.text.trim(),
      signatureMedecinPath: _signatureMedecinPath,
    );

    final repository = ref.read(sapeurPompierRepositoryProvider);
    final result = await repository.saveExamenIncorporation(examen);

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
        (savedExamen) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Examen d\'incorporation enregistré avec succès'),
              backgroundColor: AppColors.success,
            ),
          );
          Navigator.of(context).pop();
        },
      );
    }
  }

  Future<void> _pickSignature() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);

    if (pickedFile != null) {
      setState(() {
        _signatureMedecinPath = pickedFile.path;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppLayout(
      currentRoute: '/livret/examen-incorporation',
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: const Text('Examen d\'Incorporation'),
          backgroundColor: AppColors.primary,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ),
        body: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : Form(
                key: _formKey,
                child: Stepper(
                  currentStep: _currentStep,
                  onStepContinue: () {
                    if (_currentStep < 5) {
                      setState(() => _currentStep++);
                    } else {
                      _saveExamen();
                    }
                  },
                  onStepCancel: () {
                    if (_currentStep > 0) {
                      setState(() => _currentStep--);
                    }
                  },
                  controlsBuilder: (context, details) {
                    return Padding(
                      padding: const EdgeInsets.only(top: 16),
                      child: Row(
                        children: [
                          if (_currentStep > 0)
                            OutlinedButton(
                              onPressed: details.onStepCancel,
                              child: const Text('Précédent'),
                            ),
                          const SizedBox(width: 16),
                          ElevatedButton(
                            onPressed: details.onStepContinue,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                            ),
                            child: Text(_currentStep < 5 ? 'Suivant' : 'Enregistrer'),
                          ),
                        ],
                      ),
                    );
                  },
                  steps: [
                    Step(
                      title: const Text('Antécédents'),
                      content: _buildAntecedentsStep(),
                      isActive: _currentStep >= 0,
                    ),
                    Step(
                      title: const Text('Examens Cliniques'),
                      content: _buildExamensCliniquesStep(),
                      isActive: _currentStep >= 1,
                    ),
                    Step(
                      title: const Text('Vision & Audition'),
                      content: _buildVisionAuditionStep(),
                      isActive: _currentStep >= 2,
                    ),
                    Step(
                      title: const Text('Profil SIGYCOP'),
                      content: _buildSigycopStep(),
                      isActive: _currentStep >= 3,
                    ),
                    Step(
                      title: const Text('Notes VAESIFX'),
                      content: _buildNotesStep(),
                      isActive: _currentStep >= 4,
                    ),
                    Step(
                      title: const Text('Conclusions'),
                      content: _buildConclusionsStep(),
                      isActive: _currentStep >= 5,
                    ),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildAntecedentsStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextFormField(
          controller: _antecedentsHereditairesController,
          decoration: const InputDecoration(
            labelText: 'Antécédents héréditaires',
            border: OutlineInputBorder(),
          ),
          maxLines: 3,
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _antecedentsPersonnelsController,
          decoration: const InputDecoration(
            labelText: 'Antécédents personnels',
            border: OutlineInputBorder(),
          ),
          maxLines: 3,
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _antecedentsCollaterauxController,
          decoration: const InputDecoration(
            labelText: 'Antécédents collatéraux',
            border: OutlineInputBorder(),
          ),
          maxLines: 3,
        ),
      ],
    );
  }

  Widget _buildExamensCliniquesStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextFormField(
          controller: _appareilRespiratoireController,
          decoration: const InputDecoration(
            labelText: 'Appareil respiratoire',
            border: OutlineInputBorder(),
          ),
          maxLines: 2,
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _radiographieController,
          decoration: const InputDecoration(
            labelText: 'Radiographie',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _appareilGenitoUrinaireController,
          decoration: const InputDecoration(
            labelText: 'Appareil génito-urinaire',
            border: OutlineInputBorder(),
          ),
          maxLines: 2,
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _appareilDigestifController,
          decoration: const InputDecoration(
            labelText: 'Appareil digestif',
            border: OutlineInputBorder(),
          ),
          maxLines: 2,
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _appareilCirculatoireController,
          decoration: const InputDecoration(
            labelText: 'Appareil circulatoire',
            border: OutlineInputBorder(),
          ),
          maxLines: 2,
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _systemeNerveuxController,
          decoration: const InputDecoration(
            labelText: 'Système nerveux',
            border: OutlineInputBorder(),
          ),
          maxLines: 2,
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: TextFormField(
                controller: _dentureEtatController,
                decoration: const InputDecoration(
                  labelText: 'État de la denture',
                  border: OutlineInputBorder(),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: TextFormField(
                controller: _coefficientMasticationController,
                decoration: const InputDecoration(
                  labelText: 'Coefficient mastication',
                  border: OutlineInputBorder(),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _peauAnnexesController,
          decoration: const InputDecoration(
            labelText: 'Peau et annexes',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: TextFormField(
                controller: _fcController,
                decoration: const InputDecoration(
                  labelText: 'FC (bpm)',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: TextFormField(
                controller: _taController,
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
                controller: _sucreController,
                decoration: const InputDecoration(
                  labelText: 'Sucre',
                  border: OutlineInputBorder(),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: TextFormField(
                controller: _albumineController,
                decoration: const InputDecoration(
                  labelText: 'Albumine',
                  border: OutlineInputBorder(),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildVisionAuditionStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Vision',
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
              child: TextFormField(
                controller: _avOdSansController,
                decoration: const InputDecoration(
                  labelText: 'AV OD sans correction',
                  border: OutlineInputBorder(),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: TextFormField(
                controller: _avOdAvecController,
                decoration: const InputDecoration(
                  labelText: 'AV OD avec correction',
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
                controller: _avOgSansController,
                decoration: const InputDecoration(
                  labelText: 'AV OG sans correction',
                  border: OutlineInputBorder(),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: TextFormField(
                controller: _avOgAvecController,
                decoration: const InputDecoration(
                  labelText: 'AV OG avec correction',
                  border: OutlineInputBorder(),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _sensChromatiqueController,
          decoration: const InputDecoration(
            labelText: 'Sens chromatique',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 24),
        const Text(
          'Audition',
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
              child: TextFormField(
                controller: _aaOdHauteController,
                decoration: const InputDecoration(
                  labelText: 'AA OD voix haute',
                  border: OutlineInputBorder(),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: TextFormField(
                controller: _aaOdChuchoteeController,
                decoration: const InputDecoration(
                  labelText: 'AA OD voix chuchotée',
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
                controller: _aaOgHauteController,
                decoration: const InputDecoration(
                  labelText: 'AA OG voix haute',
                  border: OutlineInputBorder(),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: TextFormField(
                controller: _aaOgChuchoteeController,
                decoration: const InputDecoration(
                  labelText: 'AA OG voix chuchotée',
                  border: OutlineInputBorder(),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSigycopStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Profil SIGYCOP (0-5)',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 16),
        _buildSlider('S - État général', _s, (value) => setState(() => _s = value)),
        _buildSlider('I - Membres inférieurs', _i, (value) => setState(() => _i = value)),
        _buildSlider('G - Membres supérieurs', _g, (value) => setState(() => _g = value)),
        _buildSlider('Y - Yeux (vision)', _y, (value) => setState(() => _y = value)),
        _buildSlider('C - Appareil circulatoire', _c, (value) => setState(() => _c = value)),
        _buildSlider('O - Oreilles (audition)', _o, (value) => setState(() => _o = value)),
        _buildSlider('P - Psychisme', _p, (value) => setState(() => _p = value)),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.info.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppColors.info),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Score total SIGYCOP:',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                '${(_s + _i + _g + _y + _c + _o + _p).round()}/35',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSlider(String label, double value, ValueChanged<double> onChanged) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label),
              Text(
                value.round().toString(),
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ],
          ),
          Slider(
            value: value,
            min: 0,
            max: 5,
            divisions: 5,
            onChanged: onChanged,
            activeColor: AppColors.primary,
          ),
        ],
      ),
    );
  }

  Widget _buildNotesStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Notes additionnelles VAESIFX',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _noteVController,
          decoration: const InputDecoration(
            labelText: 'V',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _noteAController,
          decoration: const InputDecoration(
            labelText: 'A',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _noteEController,
          decoration: const InputDecoration(
            labelText: 'E',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _noteSController,
          decoration: const InputDecoration(
            labelText: 'S',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _noteIController,
          decoration: const InputDecoration(
            labelText: 'I',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _noteFController,
          decoration: const InputDecoration(
            labelText: 'F',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _noteXController,
          decoration: const InputDecoration(
            labelText: 'X',
            border: OutlineInputBorder(),
          ),
        ),
      ],
    );
  }

  Widget _buildConclusionsStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        InkWell(
          onTap: () async {
            final picked = await showDatePicker(
              context: context,
              initialDate: _dateCloture ?? DateTime.now(),
              firstDate: DateTime(2000),
              lastDate: DateTime(2100),
              locale: const Locale('fr', 'FR'),
            );
            if (picked != null) {
              setState(() => _dateCloture = picked);
            }
          },
          child: InputDecorator(
            decoration: const InputDecoration(
              labelText: 'Date de clôture',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.calendar_today),
            ),
            child: Text(
              _dateCloture != null
                  ? DateFormat('dd/MM/yyyy').format(_dateCloture!)
                  : 'Sélectionner une date',
            ),
          ),
        ),
        const SizedBox(height: 16),
        DropdownButtonFormField<String>(
          value: _decision,
          decoration: const InputDecoration(
            labelText: 'Décision *',
            border: OutlineInputBorder(),
          ),
          items: const [
            DropdownMenuItem(value: 'Apte', child: Text('Apte')),
            DropdownMenuItem(value: 'Inapte définitif', child: Text('Inapte définitif')),
            DropdownMenuItem(value: 'Inapte temporaire', child: Text('Inapte temporaire')),
            DropdownMenuItem(value: 'À surveiller', child: Text('À surveiller')),
          ],
          onChanged: (value) => setState(() => _decision = value),
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _aSurveillerController,
          decoration: const InputDecoration(
            labelText: 'À surveiller',
            border: OutlineInputBorder(),
          ),
          maxLines: 2,
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _mentionsSpecialesController,
          decoration: const InputDecoration(
            labelText: 'Mentions spéciales',
            border: OutlineInputBorder(),
          ),
          maxLines: 2,
        ),
        const SizedBox(height: 16),
        CheckboxListTile(
          title: const Text('Entraînement spécial requis'),
          value: _entrainementSpecial,
          onChanged: (value) => setState(() => _entrainementSpecial = value ?? false),
          activeColor: AppColors.primary,
        ),
        if (_entrainementSpecial) ...[
          const SizedBox(height: 8),
          TextFormField(
            controller: _entrainementSpecialDetailsController,
            decoration: const InputDecoration(
              labelText: 'Détails de l\'entraînement spécial',
              border: OutlineInputBorder(),
            ),
            maxLines: 2,
          ),
        ],
        const SizedBox(height: 16),
        TextFormField(
          controller: _utilisationPreferentielleController,
          decoration: const InputDecoration(
            labelText: 'Utilisation préférentielle',
            border: OutlineInputBorder(),
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
        if (_signatureMedecinPath != null)
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Image.file(
              File(_signatureMedecinPath!),
              width: 200,
              height: 100,
              fit: BoxFit.cover,
            ),
          ),
        const SizedBox(height: 8),
        ElevatedButton.icon(
          onPressed: _pickSignature,
          icon: const Icon(Icons.upload),
          label: Text(_signatureMedecinPath != null
              ? 'Changer la signature'
              : 'Ajouter une signature'),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.secondary,
          ),
        ),
      ],
    );
  }
}
