import '../../domain/entities/visite_sanitaire.dart';

/// Model de données pour VisiteSanitaire avec sérialisation JSON
class VisiteSanitaireModel extends VisiteSanitaire {
  const VisiteSanitaireModel({
    required super.id,
    required super.sapeurPompierId,
    super.entiteCorps,
    required super.dateVisite,
    super.resultats,
    super.observations,
    super.nomMedecin,
    super.signaturePath,
  });

  /// Crée un VisiteSanitaireModel depuis JSON
  factory VisiteSanitaireModel.fromJson(Map<String, dynamic> json) {
    return VisiteSanitaireModel(
      id: json['id'] as String,
      sapeurPompierId: json['sapeurPompierId'] as String,
      entiteCorps: json['entiteCorps'] as String?,
      dateVisite: DateTime.parse(json['dateVisite'] as String),
      resultats: json['resultats'] as String?,
      observations: json['observations'] as String?,
      nomMedecin: json['nomMedecin'] as String?,
      signaturePath: json['signaturePath'] as String?,
    );
  }

  /// Convertit VisiteSanitaireModel vers JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'sapeurPompierId': sapeurPompierId,
      'entiteCorps': entiteCorps,
      'dateVisite': dateVisite.toIso8601String(),
      'resultats': resultats,
      'observations': observations,
      'nomMedecin': nomMedecin,
      'signaturePath': signaturePath,
    };
  }

  /// Crée un VisiteSanitaireModel depuis une ligne de base de données SQLite
  factory VisiteSanitaireModel.fromDatabase(Map<String, dynamic> map) {
    return VisiteSanitaireModel(
      id: map['id'] as String,
      sapeurPompierId: map['sapeur_pompier_id'] as String,
      entiteCorps: map['entite_corps'] as String?,
      dateVisite: DateTime.parse(map['date_visite'] as String),
      resultats: map['resultats'] as String?,
      observations: map['observations'] as String?,
      nomMedecin: map['nom_medecin'] as String?,
      signaturePath: map['signature_path'] as String?,
    );
  }

  /// Convertit VisiteSanitaireModel vers format base de données SQLite
  Map<String, dynamic> toDatabase() {
    return {
      'id': id,
      'sapeur_pompier_id': sapeurPompierId,
      'entite_corps': entiteCorps,
      'date_visite': dateVisite.toIso8601String(),
      'resultats': resultats,
      'observations': observations,
      'nom_medecin': nomMedecin,
      'signature_path': signaturePath,
    };
  }

  /// Crée un VisiteSanitaireModel depuis une entité VisiteSanitaire
  factory VisiteSanitaireModel.fromEntity(VisiteSanitaire visite) {
    return VisiteSanitaireModel(
      id: visite.id,
      sapeurPompierId: visite.sapeurPompierId,
      entiteCorps: visite.entiteCorps,
      dateVisite: visite.dateVisite,
      resultats: visite.resultats,
      observations: visite.observations,
      nomMedecin: visite.nomMedecin,
      signaturePath: visite.signaturePath,
    );
  }
}
