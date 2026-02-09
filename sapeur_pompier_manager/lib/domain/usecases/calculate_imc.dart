import 'package:sapeur_pompier_manager/domain/entities/constantes.dart';

/// UseCase pour calculer l'IMC
class CalculateImc {
  /// Calcule l'IMC à partir du poids et de la taille
  double? call({required double? poids, required double? taille}) {
    return Constantes.calculateImc(poids, taille);
  }

  /// Obtient l'interprétation de l'IMC
  String getInterpretation(double? imc) {
    if (imc == null) return 'Non calculé';
    if (imc < 18.5) return 'Insuffisance pondérale';
    if (imc < 25) return 'Poids normal';
    if (imc < 30) return 'Surpoids';
    if (imc < 35) return 'Obésité modérée';
    if (imc < 40) return 'Obésité sévère';
    return 'Obésité morbide';
  }
}
