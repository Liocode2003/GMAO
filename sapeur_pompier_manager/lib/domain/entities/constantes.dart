import 'package:equatable/equatable.dart';

/// Entité représentant les constantes physiques d'un sapeur-pompier
class Constantes extends Equatable {
  final String id;
  final String sapeurPompierId;
  final double? taille; // en cm
  final double? poids; // en kg
  final double? imc;
  final double? perimetreThoracique; // en cm
  final double? perimetreAbdominal; // en cm
  final String? empreintesPath;
  final String? signaturePath;
  final DateTime? dateMesure;

  const Constantes({
    required this.id,
    required this.sapeurPompierId,
    this.taille,
    this.poids,
    this.imc,
    this.perimetreThoracique,
    this.perimetreAbdominal,
    this.empreintesPath,
    this.signaturePath,
    this.dateMesure,
  });

  /// Calcule l'IMC automatiquement à partir du poids et de la taille
  /// Formule: IMC = poids (kg) / (taille (m))²
  static double? calculateImc(double? poids, double? taille) {
    if (poids == null || taille == null || taille == 0) {
      return null;
    }
    final tailleEnMetres = taille / 100;
    return poids / (tailleEnMetres * tailleEnMetres);
  }

  /// Interprétation de l'IMC
  String get imcInterpretation {
    if (imc == null) return 'Non calculé';
    if (imc! < 18.5) return 'Insuffisance pondérale';
    if (imc! < 25) return 'Poids normal';
    if (imc! < 30) return 'Surpoids';
    if (imc! < 35) return 'Obésité modérée';
    if (imc! < 40) return 'Obésité sévère';
    return 'Obésité morbide';
  }

  /// Vérifie si les empreintes sont disponibles
  bool get hasEmpreintes => empreintesPath != null && empreintesPath!.isNotEmpty;

  /// Vérifie si la signature est disponible
  bool get hasSignature => signaturePath != null && signaturePath!.isNotEmpty;

  /// Vérifie si toutes les constantes de base sont remplies
  bool get isComplete =>
      taille != null &&
      poids != null &&
      perimetreThoracique != null &&
      perimetreAbdominal != null;

  @override
  List<Object?> get props => [
        id,
        sapeurPompierId,
        taille,
        poids,
        imc,
        perimetreThoracique,
        perimetreAbdominal,
        empreintesPath,
        signaturePath,
        dateMesure,
      ];

  Constantes copyWith({
    String? id,
    String? sapeurPompierId,
    double? taille,
    double? poids,
    double? imc,
    double? perimetreThoracique,
    double? perimetreAbdominal,
    String? empreintesPath,
    String? signaturePath,
    DateTime? dateMesure,
  }) {
    return Constantes(
      id: id ?? this.id,
      sapeurPompierId: sapeurPompierId ?? this.sapeurPompierId,
      taille: taille ?? this.taille,
      poids: poids ?? this.poids,
      imc: imc ?? this.imc,
      perimetreThoracique: perimetreThoracique ?? this.perimetreThoracique,
      perimetreAbdominal: perimetreAbdominal ?? this.perimetreAbdominal,
      empreintesPath: empreintesPath ?? this.empreintesPath,
      signaturePath: signaturePath ?? this.signaturePath,
      dateMesure: dateMesure ?? this.dateMesure,
    );
  }
}

/// Entité pour l'historique du poids (pour le graphique)
class HistoriquePoids extends Equatable {
  final String id;
  final String sapeurPompierId;
  final int annee; // Année de service (1-39)
  final double poids;
  final DateTime? dateMesure;

  const HistoriquePoids({
    required this.id,
    required this.sapeurPompierId,
    required this.annee,
    required this.poids,
    this.dateMesure,
  });

  @override
  List<Object?> get props => [id, sapeurPompierId, annee, poids, dateMesure];

  HistoriquePoids copyWith({
    String? id,
    String? sapeurPompierId,
    int? annee,
    double? poids,
    DateTime? dateMesure,
  }) {
    return HistoriquePoids(
      id: id ?? this.id,
      sapeurPompierId: sapeurPompierId ?? this.sapeurPompierId,
      annee: annee ?? this.annee,
      poids: poids ?? this.poids,
      dateMesure: dateMesure ?? this.dateMesure,
    );
  }
}
