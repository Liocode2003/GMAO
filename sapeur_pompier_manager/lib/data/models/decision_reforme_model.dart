import '../../domain/entities/decision_reforme.dart';

/// Model de données pour DecisionReforme avec sérialisation JSON
class DecisionReformeModel extends DecisionReforme {
  const DecisionReformeModel({
    required super.id,
    required super.sapeurPompierId,
    required super.dateDecision,
    super.diagnostic,
    required super.typeDecision,
    super.observations,
    super.signatureAutoritePath,
  });

  /// Crée un DecisionReformeModel depuis JSON
  factory DecisionReformeModel.fromJson(Map<String, dynamic> json) {
    return DecisionReformeModel(
      id: json['id'] as String,
      sapeurPompierId: json['sapeurPompierId'] as String,
      dateDecision: DateTime.parse(json['dateDecision'] as String),
      diagnostic: json['diagnostic'] as String?,
      typeDecision: json['typeDecision'] as String,
      observations: json['observations'] as String?,
      signatureAutoritePath: json['signatureAutoritePath'] as String?,
    );
  }

  /// Convertit DecisionReformeModel vers JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'sapeurPompierId': sapeurPompierId,
      'dateDecision': dateDecision.toIso8601String(),
      'diagnostic': diagnostic,
      'typeDecision': typeDecision,
      'observations': observations,
      'signatureAutoritePath': signatureAutoritePath,
    };
  }

  /// Crée un DecisionReformeModel depuis une ligne de base de données SQLite
  factory DecisionReformeModel.fromDatabase(Map<String, dynamic> map) {
    return DecisionReformeModel(
      id: map['id'] as String,
      sapeurPompierId: map['sapeur_pompier_id'] as String,
      dateDecision: DateTime.parse(map['date_decision'] as String),
      diagnostic: map['diagnostic'] as String?,
      typeDecision: map['type_decision'] as String,
      observations: map['observations'] as String?,
      signatureAutoritePath: map['signature_autorite_path'] as String?,
    );
  }

  /// Convertit DecisionReformeModel vers format base de données SQLite
  Map<String, dynamic> toDatabase() {
    return {
      'id': id,
      'sapeur_pompier_id': sapeurPompierId,
      'date_decision': dateDecision.toIso8601String(),
      'diagnostic': diagnostic,
      'type_decision': typeDecision,
      'observations': observations,
      'signature_autorite_path': signatureAutoritePath,
    };
  }

  /// Crée un DecisionReformeModel depuis une entité DecisionReforme
  factory DecisionReformeModel.fromEntity(DecisionReforme decision) {
    return DecisionReformeModel(
      id: decision.id,
      sapeurPompierId: decision.sapeurPompierId,
      dateDecision: decision.dateDecision,
      diagnostic: decision.diagnostic,
      typeDecision: decision.typeDecision,
      observations: decision.observations,
      signatureAutoritePath: decision.signatureAutoritePath,
    );
  }
}
