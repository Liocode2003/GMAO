import 'package:equatable/equatable.dart';

/// Types de décisions de réforme
enum TypeDecisionReforme {
  reforme('Réforme'),
  rengagement('Rengagement'),
  autre('Autre');

  const TypeDecisionReforme(this.libelle);
  final String libelle;
}

/// Entité représentant une décision de commission de réforme
class DecisionReforme extends Equatable {
  final String id;
  final String sapeurPompierId;
  final DateTime dateDecision;
  final String? diagnostic;
  final String typeDecision; // TypeDecisionReforme enum value
  final String? observations;
  final String? signatureAutoritePath;

  const DecisionReforme({
    required this.id,
    required this.sapeurPompierId,
    required this.dateDecision,
    this.diagnostic,
    required this.typeDecision,
    this.observations,
    this.signatureAutoritePath,
  });

  /// Obtient le libellé du type de décision
  String get typeDecisionLibelle {
    try {
      final type = TypeDecisionReforme.values.firstWhere(
        (e) => e.name == typeDecision,
      );
      return type.libelle;
    } catch (e) {
      return typeDecision;
    }
  }

  /// Vérifie si c'est une réforme
  bool get isReforme => typeDecision == TypeDecisionReforme.reforme.name;

  /// Vérifie si c'est un rengagement
  bool get isRengagement => typeDecision == TypeDecisionReforme.rengagement.name;

  /// Vérifie si la signature est disponible
  bool get hasSignature =>
      signatureAutoritePath != null && signatureAutoritePath!.isNotEmpty;

  /// Vérifie si la décision est complète
  bool get isComplete => diagnostic != null && hasSignature;

  @override
  List<Object?> get props => [
        id,
        sapeurPompierId,
        dateDecision,
        diagnostic,
        typeDecision,
        observations,
        signatureAutoritePath,
      ];

  DecisionReforme copyWith({
    String? id,
    String? sapeurPompierId,
    DateTime? dateDecision,
    String? diagnostic,
    String? typeDecision,
    String? observations,
    String? signatureAutoritePath,
  }) {
    return DecisionReforme(
      id: id ?? this.id,
      sapeurPompierId: sapeurPompierId ?? this.sapeurPompierId,
      dateDecision: dateDecision ?? this.dateDecision,
      diagnostic: diagnostic ?? this.diagnostic,
      typeDecision: typeDecision ?? this.typeDecision,
      observations: observations ?? this.observations,
      signatureAutoritePath:
          signatureAutoritePath ?? this.signatureAutoritePath,
    );
  }
}
