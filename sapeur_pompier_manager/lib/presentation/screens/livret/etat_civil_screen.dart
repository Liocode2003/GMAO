import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_colors.dart';
import '../../../domain/entities/etat_civil.dart';
import '../../providers/sapeur_pompier_provider.dart';
import '../../widgets/app_layout.dart';

/// Écran de saisie de l'état civil
class EtatCivilScreen extends ConsumerStatefulWidget {
  final String sapeurPompierId;

  const EtatCivilScreen({
    Key? key,
    required this.sapeurPompierId,
  }) : super(key: key);

  @override
  ConsumerState<EtatCivilScreen> createState() => _EtatCivilScreenState();
}

class _EtatCivilScreenState extends ConsumerState<EtatCivilScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nomController = TextEditingController();
  final _prenomsController = TextEditingController();
  final _lieuNaissanceController = TextEditingController();
  final _nomPereController = TextEditingController();
  final _nomMereController = TextEditingController();

  // Contacts d'urgence
  final _contact1NomController = TextEditingController();
  final _contact1TelController = TextEditingController();
  final _contact1LienController = TextEditingController();

  final _contact2NomController = TextEditingController();
  final _contact2TelController = TextEditingController();
  final _contact2LienController = TextEditingController();

  final _contact3NomController = TextEditingController();
  final _contact3TelController = TextEditingController();
  final _contact3LienController = TextEditingController();

  DateTime? _dateNaissance;
  String? _photoPath;
  bool _isLoading = false;
  bool _hasChanges = false;
  Timer? _autoSaveTimer;

  @override
  void initState() {
    super.initState();
    _loadEtatCivil();
    _setupAutoSave();

    // Marquer les changements
    _nomController.addListener(() => _hasChanges = true);
    _prenomsController.addListener(() => _hasChanges = true);
    _lieuNaissanceController.addListener(() => _hasChanges = true);
  }

  @override
  void dispose() {
    _autoSaveTimer?.cancel();
    _nomController.dispose();
    _prenomsController.dispose();
    _lieuNaissanceController.dispose();
    _nomPereController.dispose();
    _nomMereController.dispose();
    _contact1NomController.dispose();
    _contact1TelController.dispose();
    _contact1LienController.dispose();
    _contact2NomController.dispose();
    _contact2TelController.dispose();
    _contact2LienController.dispose();
    _contact3NomController.dispose();
    _contact3TelController.dispose();
    _contact3LienController.dispose();
    super.dispose();
  }

  void _setupAutoSave() {
    _autoSaveTimer = Timer.periodic(const Duration(minutes: 2), (timer) {
      if (_hasChanges && _formKey.currentState?.validate() == true) {
        _saveEtatCivil(showMessage: false);
      }
    });
  }

  Future<void> _loadEtatCivil() async {
    setState(() => _isLoading = true);

    final repository = ref.read(sapeurPompierRepositoryProvider);
    final result = await repository.getEtatCivil(widget.sapeurPompierId);

    result.fold(
      (failure) {
        if (mounted) {
          setState(() => _isLoading = false);
        }
      },
      (etatCivil) {
        if (etatCivil != null && mounted) {
          setState(() {
            _nomController.text = etatCivil.nom;
            _prenomsController.text = etatCivil.prenoms;
            _lieuNaissanceController.text = etatCivil.lieuNaissance;
            _nomPereController.text = etatCivil.nomPere ?? '';
            _nomMereController.text = etatCivil.nomMere ?? '';
            _dateNaissance = etatCivil.dateNaissance;
            _photoPath = etatCivil.photoPath;

            if (etatCivil.contactUrgence1 != null) {
              _contact1NomController.text = etatCivil.contactUrgence1!.nom;
              _contact1TelController.text = etatCivil.contactUrgence1!.telephone;
              _contact1LienController.text = etatCivil.contactUrgence1!.lien;
            }

            if (etatCivil.contactUrgence2 != null) {
              _contact2NomController.text = etatCivil.contactUrgence2!.nom;
              _contact2TelController.text = etatCivil.contactUrgence2!.telephone;
              _contact2LienController.text = etatCivil.contactUrgence2!.lien;
            }

            if (etatCivil.contactUrgence3 != null) {
              _contact3NomController.text = etatCivil.contactUrgence3!.nom;
              _contact3TelController.text = etatCivil.contactUrgence3!.telephone;
              _contact3LienController.text = etatCivil.contactUrgence3!.lien;
            }

            _isLoading = false;
            _hasChanges = false;
          });
        } else {
          setState(() => _isLoading = false);
        }
      },
    );
  }

  Future<void> _saveEtatCivil({bool showMessage = true}) async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final etatCivil = EtatCivil(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      sapeurPompierId: widget.sapeurPompierId,
      nom: _nomController.text.trim(),
      prenoms: _prenomsController.text.trim(),
      dateNaissance: _dateNaissance!,
      lieuNaissance: _lieuNaissanceController.text.trim(),
      nomPere: _nomPereController.text.trim().isEmpty ? null : _nomPereController.text.trim(),
      nomMere: _nomMereController.text.trim().isEmpty ? null : _nomMereController.text.trim(),
      photoPath: _photoPath,
      contactUrgence1: _contact1NomController.text.trim().isNotEmpty
          ? ContactUrgence(
              nom: _contact1NomController.text.trim(),
              telephone: _contact1TelController.text.trim(),
              lien: _contact1LienController.text.trim(),
            )
          : null,
      contactUrgence2: _contact2NomController.text.trim().isNotEmpty
          ? ContactUrgence(
              nom: _contact2NomController.text.trim(),
              telephone: _contact2TelController.text.trim(),
              lien: _contact2LienController.text.trim(),
            )
          : null,
      contactUrgence3: _contact3NomController.text.trim().isNotEmpty
          ? ContactUrgence(
              nom: _contact3NomController.text.trim(),
              telephone: _contact3TelController.text.trim(),
              lien: _contact3LienController.text.trim(),
            )
          : null,
    );

    final repository = ref.read(sapeurPompierRepositoryProvider);
    final result = await repository.saveEtatCivil(etatCivil);

    if (mounted) {
      setState(() => _isLoading = false);

      result.fold(
        (failure) {
          if (showMessage) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Erreur: ${failure.message}'),
                backgroundColor: AppColors.error,
              ),
            );
          }
        },
        (savedEtatCivil) {
          _hasChanges = false;
          if (showMessage) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('État civil enregistré avec succès'),
                backgroundColor: AppColors.success,
              ),
            );
            Navigator.of(context).pop();
          }
        },
      );
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);

    if (pickedFile != null) {
      setState(() {
        _photoPath = pickedFile.path;
        _hasChanges = true;
      });
    }
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _dateNaissance ?? DateTime(1990),
      firstDate: DateTime(1940),
      lastDate: DateTime.now(),
      locale: const Locale('fr', 'FR'),
    );

    if (picked != null) {
      setState(() {
        _dateNaissance = picked;
        _hasChanges = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppLayout(
      currentRoute: '/livret/etat-civil',
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: const Text('État Civil'),
          backgroundColor: AppColors.primary,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ),
        body: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildPhotoSection(),
                      const SizedBox(height: 32),
                      _buildPersonalInfoSection(),
                      const SizedBox(height: 32),
                      _buildParentsSection(),
                      const SizedBox(height: 32),
                      _buildContactsSection(),
                      const SizedBox(height: 40),
                      _buildActionButtons(),
                    ],
                  ),
                ),
              ),
      ),
    );
  }

  Widget _buildPhotoSection() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Photo',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 16),
            Center(
              child: Column(
                children: [
                  if (_photoPath != null)
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.file(
                        File(_photoPath!),
                        width: 200,
                        height: 200,
                        fit: BoxFit.cover,
                      ),
                    )
                  else
                    Container(
                      width: 200,
                      height: 200,
                      decoration: BoxDecoration(
                        color: AppColors.surfaceBackground,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: const Icon(
                        Icons.person,
                        size: 80,
                        color: AppColors.textDisabled,
                      ),
                    ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: _pickImage,
                    icon: const Icon(Icons.upload),
                    label: Text(_photoPath != null ? 'Changer la photo' : 'Ajouter une photo'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.secondary,
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

  Widget _buildPersonalInfoSection() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Informations personnelles',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _nomController,
              decoration: const InputDecoration(
                labelText: 'Nom *',
                border: OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Le nom est requis';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _prenomsController,
              decoration: const InputDecoration(
                labelText: 'Prénoms *',
                border: OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Les prénoms sont requis';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            InkWell(
              onTap: _selectDate,
              child: InputDecorator(
                decoration: InputDecoration(
                  labelText: 'Date de naissance *',
                  border: const OutlineInputBorder(),
                  errorText: _dateNaissance == null && _hasChanges
                      ? 'La date de naissance est requise'
                      : null,
                ),
                child: Text(
                  _dateNaissance != null
                      ? DateFormat('dd/MM/yyyy').format(_dateNaissance!)
                      : 'Sélectionner une date',
                  style: TextStyle(
                    color: _dateNaissance != null
                        ? AppColors.textPrimary
                        : AppColors.textHint,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _lieuNaissanceController,
              decoration: const InputDecoration(
                labelText: 'Lieu de naissance',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildParentsSection() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Parents',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _nomPereController,
              decoration: const InputDecoration(
                labelText: 'Nom du père',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _nomMereController,
              decoration: const InputDecoration(
                labelText: 'Nom de la mère',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContactsSection() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Contacts d\'urgence',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 16),
            _buildContactForm('Contact 1', _contact1NomController,
                _contact1TelController, _contact1LienController),
            const SizedBox(height: 24),
            _buildContactForm('Contact 2', _contact2NomController,
                _contact2TelController, _contact2LienController),
            const SizedBox(height: 24),
            _buildContactForm('Contact 3', _contact3NomController,
                _contact3TelController, _contact3LienController),
          ],
        ),
      ),
    );
  }

  Widget _buildContactForm(
    String title,
    TextEditingController nomController,
    TextEditingController telController,
    TextEditingController lienController,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 12),
        TextFormField(
          controller: nomController,
          decoration: const InputDecoration(
            labelText: 'Nom complet',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 12),
        TextFormField(
          controller: telController,
          decoration: const InputDecoration(
            labelText: 'Téléphone',
            border: OutlineInputBorder(),
            prefixIcon: Icon(Icons.phone),
          ),
          keyboardType: TextInputType.phone,
        ),
        const SizedBox(height: 12),
        TextFormField(
          controller: lienController,
          decoration: const InputDecoration(
            labelText: 'Lien de parenté',
            border: OutlineInputBorder(),
          ),
        ),
      ],
    );
  }

  Widget _buildActionButtons() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        OutlinedButton(
          onPressed: _isLoading ? null : () => Navigator.of(context).pop(),
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
          ),
          child: const Text('Annuler'),
        ),
        const SizedBox(width: 16),
        ElevatedButton(
          onPressed: _isLoading ? null : () => _saveEtatCivil(),
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
