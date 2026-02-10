import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_colors.dart';
import '../../../domain/entities/constantes.dart';
import '../../providers/sapeur_pompier_provider.dart';
import '../../widgets/app_layout.dart';

/// Écran de saisie des constantes physiques
class ConstantesScreen extends ConsumerStatefulWidget {
  final String sapeurPompierId;

  const ConstantesScreen({
    Key? key,
    required this.sapeurPompierId,
  }) : super(key: key);

  @override
  ConsumerState<ConstantesScreen> createState() => _ConstantesScreenState();
}

class _ConstantesScreenState extends ConsumerState<ConstantesScreen> {
  final _formKey = GlobalKey<FormState>();
  final _tailleController = TextEditingController();
  final _poidsController = TextEditingController();
  final _perimetreThoraciqueController = TextEditingController();
  final _perimetreAbdominalController = TextEditingController();

  double? _imc;
  DateTime? _dateMesure;
  String? _empreintesPath;
  String? _signaturePath;
  bool _isLoading = false;
  List<HistoriquePoids> _historiquePoids = [];

  @override
  void initState() {
    super.initState();
    _loadConstantes();
    _loadHistoriquePoids();

    // Calcul automatique de l'IMC
    _tailleController.addListener(_calculateImc);
    _poidsController.addListener(_calculateImc);
  }

  @override
  void dispose() {
    _tailleController.dispose();
    _poidsController.dispose();
    _perimetreThoraciqueController.dispose();
    _perimetreAbdominalController.dispose();
    super.dispose();
  }

  void _calculateImc() {
    final taille = double.tryParse(_tailleController.text);
    final poids = double.tryParse(_poidsController.text);

    setState(() {
      _imc = Constantes.calculateImc(poids, taille);
    });
  }

  Future<void> _loadConstantes() async {
    setState(() => _isLoading = true);

    final repository = ref.read(sapeurPompierRepositoryProvider);
    final result = await repository.getConstantes(widget.sapeurPompierId);

    result.fold(
      (failure) {
        if (mounted) {
          setState(() => _isLoading = false);
        }
      },
      (constantes) {
        if (constantes != null && mounted) {
          setState(() {
            _tailleController.text = constantes.taille?.toString() ?? '';
            _poidsController.text = constantes.poids?.toString() ?? '';
            _perimetreThoraciqueController.text =
                constantes.perimetreThoracique?.toString() ?? '';
            _perimetreAbdominalController.text =
                constantes.perimetreAbdominal?.toString() ?? '';
            _imc = constantes.imc;
            _dateMesure = constantes.dateMesure;
            _empreintesPath = constantes.empreintesPath;
            _signaturePath = constantes.signaturePath;
            _isLoading = false;
          });
        } else {
          setState(() => _isLoading = false);
        }
      },
    );
  }

  Future<void> _loadHistoriquePoids() async {
    final repository = ref.read(sapeurPompierRepositoryProvider);
    final result = await repository.getHistoriquePoids(widget.sapeurPompierId);

    result.fold(
      (failure) {},
      (historique) {
        if (mounted) {
          setState(() {
            _historiquePoids = historique;
          });
        }
      },
    );
  }

  Future<void> _saveConstantes() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final constantes = Constantes(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      sapeurPompierId: widget.sapeurPompierId,
      taille: double.tryParse(_tailleController.text),
      poids: double.tryParse(_poidsController.text),
      imc: _imc,
      perimetreThoracique: double.tryParse(_perimetreThoraciqueController.text),
      perimetreAbdominal: double.tryParse(_perimetreAbdominalController.text),
      empreintesPath: _empreintesPath,
      signaturePath: _signaturePath,
      dateMesure: _dateMesure ?? DateTime.now(),
    );

    final repository = ref.read(sapeurPompierRepositoryProvider);
    final result = await repository.saveConstantes(constantes);

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
        (savedConstantes) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Constantes enregistrées avec succès'),
              backgroundColor: AppColors.success,
            ),
          );
          Navigator.of(context).pop();
        },
      );
    }
  }

  Future<void> _pickImage(bool isEmpreintes) async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);

    if (pickedFile != null) {
      setState(() {
        if (isEmpreintes) {
          _empreintesPath = pickedFile.path;
        } else {
          _signaturePath = pickedFile.path;
        }
      });
    }
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _dateMesure ?? DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
      locale: const Locale('fr', 'FR'),
    );

    if (picked != null) {
      setState(() {
        _dateMesure = picked;
      });
    }
  }

  Color _getImcColor() {
    if (_imc == null) return AppColors.textDisabled;
    if (_imc! < 18.5) return AppColors.warning;
    if (_imc! < 25) return AppColors.success;
    if (_imc! < 30) return AppColors.warning;
    return AppColors.error;
  }

  String _getImcInterpretation() {
    if (_imc == null) return 'Non calculé';
    if (_imc! < 18.5) return 'Insuffisance pondérale';
    if (_imc! < 25) return 'Poids normal';
    if (_imc! < 30) return 'Surpoids';
    if (_imc! < 35) return 'Obésité modérée';
    if (_imc! < 40) return 'Obésité sévère';
    return 'Obésité morbide';
  }

  @override
  Widget build(BuildContext context) {
    return AppLayout(
      currentRoute: '/livret/constantes',
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: const Text('Constantes Physiques'),
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
                      _buildMeasurementsSection(),
                      const SizedBox(height: 24),
                      _buildImcSection(),
                      const SizedBox(height: 24),
                      _buildPerimetersSection(),
                      const SizedBox(height: 24),
                      _buildDateSection(),
                      const SizedBox(height: 24),
                      _buildDocumentsSection(),
                      const SizedBox(height: 24),
                      _buildHistoriqueSection(),
                      const SizedBox(height: 40),
                      _buildActionButtons(),
                    ],
                  ),
                ),
              ),
      ),
    );
  }

  Widget _buildMeasurementsSection() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Mesures principales',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _tailleController,
                    decoration: const InputDecoration(
                      labelText: 'Taille (cm)',
                      border: OutlineInputBorder(),
                      suffixText: 'cm',
                    ),
                    keyboardType: TextInputType.number,
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}')),
                    ],
                    validator: (value) {
                      if (value == null || value.isEmpty) return null;
                      final taille = double.tryParse(value);
                      if (taille == null) return 'Valeur invalide';
                      if (taille < 100 || taille > 250) {
                        return 'Taille doit être entre 100 et 250 cm';
                      }
                      return null;
                    },
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: TextFormField(
                    controller: _poidsController,
                    decoration: const InputDecoration(
                      labelText: 'Poids (kg)',
                      border: OutlineInputBorder(),
                      suffixText: 'kg',
                    ),
                    keyboardType: TextInputType.number,
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}')),
                    ],
                    validator: (value) {
                      if (value == null || value.isEmpty) return null;
                      final poids = double.tryParse(value);
                      if (poids == null) return 'Valeur invalide';
                      if (poids < 30 || poids > 200) {
                        return 'Poids doit être entre 30 et 200 kg';
                      }
                      return null;
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImcSection() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Indice de Masse Corporelle (IMC)',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: _getImcColor().withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: _getImcColor(), width: 2),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'IMC: ${_imc != null ? _imc!.toStringAsFixed(1) : '--'}',
                        style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: _getImcColor(),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _getImcInterpretation(),
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                          color: _getImcColor(),
                        ),
                      ),
                    ],
                  ),
                  Icon(
                    _imc != null && _imc! >= 18.5 && _imc! < 25
                        ? Icons.check_circle
                        : Icons.warning,
                    size: 48,
                    color: _getImcColor(),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPerimetersSection() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Périmètres',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _perimetreThoraciqueController,
                    decoration: const InputDecoration(
                      labelText: 'Thoracique (cm)',
                      border: OutlineInputBorder(),
                      suffixText: 'cm',
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
                    controller: _perimetreAbdominalController,
                    decoration: const InputDecoration(
                      labelText: 'Abdominal (cm)',
                      border: OutlineInputBorder(),
                      suffixText: 'cm',
                    ),
                    keyboardType: TextInputType.number,
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}')),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDateSection() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Date de mesure',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 16),
            InkWell(
              onTap: _selectDate,
              child: InputDecorator(
                decoration: const InputDecoration(
                  labelText: 'Date',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.calendar_today),
                ),
                child: Text(
                  _dateMesure != null
                      ? DateFormat('dd/MM/yyyy').format(_dateMesure!)
                      : DateFormat('dd/MM/yyyy').format(DateTime.now()),
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDocumentsSection() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Documents',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Empreintes digitales',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      if (_empreintesPath != null)
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.file(
                            File(_empreintesPath!),
                            width: 120,
                            height: 120,
                            fit: BoxFit.cover,
                          ),
                        )
                      else
                        Container(
                          width: 120,
                          height: 120,
                          decoration: BoxDecoration(
                            color: AppColors.surfaceBackground,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: const Icon(
                            Icons.fingerprint,
                            size: 48,
                            color: AppColors.textDisabled,
                          ),
                        ),
                      const SizedBox(height: 8),
                      ElevatedButton.icon(
                        onPressed: () => _pickImage(true),
                        icon: const Icon(Icons.upload, size: 16),
                        label: const Text('Importer'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.secondary,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 24),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Signature',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      if (_signaturePath != null)
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.file(
                            File(_signaturePath!),
                            width: 120,
                            height: 120,
                            fit: BoxFit.cover,
                          ),
                        )
                      else
                        Container(
                          width: 120,
                          height: 120,
                          decoration: BoxDecoration(
                            color: AppColors.surfaceBackground,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: const Icon(
                            Icons.draw,
                            size: 48,
                            color: AppColors.textDisabled,
                          ),
                        ),
                      const SizedBox(height: 8),
                      ElevatedButton.icon(
                        onPressed: () => _pickImage(false),
                        icon: const Icon(Icons.upload, size: 16),
                        label: const Text('Importer'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.secondary,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHistoriqueSection() {
    if (_historiquePoids.isEmpty) {
      return const SizedBox.shrink();
    }

    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Historique du poids',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 200,
              child: _buildSimpleChart(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSimpleChart() {
    if (_historiquePoids.isEmpty) {
      return const Center(
        child: Text('Aucune donnée disponible'),
      );
    }

    final minPoids = _historiquePoids.map((h) => h.poids).reduce((a, b) => a < b ? a : b);
    final maxPoids = _historiquePoids.map((h) => h.poids).reduce((a, b) => a > b ? a : b);
    final range = maxPoids - minPoids;

    return CustomPaint(
      painter: _SimpleChartPainter(
        historique: _historiquePoids,
        minPoids: minPoids,
        maxPoids: maxPoids,
        range: range,
      ),
      child: Container(),
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
          onPressed: _isLoading ? null : _saveConstantes,
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

class _SimpleChartPainter extends CustomPainter {
  final List<HistoriquePoids> historique;
  final double minPoids;
  final double maxPoids;
  final double range;

  _SimpleChartPainter({
    required this.historique,
    required this.minPoids,
    required this.maxPoids,
    required this.range,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.primary
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;

    final pointPaint = Paint()
      ..color = AppColors.primary
      ..style = PaintingStyle.fill;

    final gridPaint = Paint()
      ..color = AppColors.chartGrid
      ..strokeWidth = 1;

    // Dessiner la grille
    for (int i = 0; i <= 4; i++) {
      final y = size.height * i / 4;
      canvas.drawLine(
        Offset(0, y),
        Offset(size.width, y),
        gridPaint,
      );
    }

    if (historique.isEmpty) return;

    // Dessiner la courbe
    final path = Path();
    for (int i = 0; i < historique.length; i++) {
      final x = size.width * i / (historique.length - 1);
      final normalizedPoids = range > 0 ? (historique[i].poids - minPoids) / range : 0.5;
      final y = size.height * (1 - normalizedPoids);

      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }

      // Dessiner les points
      canvas.drawCircle(Offset(x, y), 4, pointPaint);
    }

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(_SimpleChartPainter oldDelegate) => true;
}
