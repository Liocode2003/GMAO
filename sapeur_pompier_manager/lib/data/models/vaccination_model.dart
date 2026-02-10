import '../../domain/entities/vaccination.dart';

/// Model de données pour Vaccination avec sérialisation JSON
class VaccinationModel extends Vaccination {
  const VaccinationModel({
    required super.id,
    required super.sapeurPompierId,
    required super.typeVaccin,
    required super.dateVaccination,
    super.nombreDoses,
    super.referenceLot,
    super.nomMedecin,
    super.signaturePath,
    super.observations,
    super.dateRappel,
  });

  /// Crée un VaccinationModel depuis JSON
  factory VaccinationModel.fromJson(Map<String, dynamic> json) {
    return VaccinationModel(
      id: json['id'] as String,
      sapeurPompierId: json['sapeurPompierId'] as String,
      typeVaccin: json['typeVaccin'] as String,
      dateVaccination: DateTime.parse(json['dateVaccination'] as String),
      nombreDoses: json['nombreDoses'] as int?,
      referenceLot: json['referenceLot'] as String?,
      nomMedecin: json['nomMedecin'] as String?,
      signaturePath: json['signaturePath'] as String?,
      observations: json['observations'] as String?,
      dateRappel: json['dateRappel'] != null
          ? DateTime.parse(json['dateRappel'] as String)
          : null,
    );
  }

  /// Convertit VaccinationModel vers JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'sapeurPompierId': sapeurPompierId,
      'typeVaccin': typeVaccin,
      'dateVaccination': dateVaccination.toIso8601String(),
      'nombreDoses': nombreDoses,
      'referenceLot': referenceLot,
      'nomMedecin': nomMedecin,
      'signaturePath': signaturePath,
      'observations': observations,
      'dateRappel': dateRappel?.toIso8601String(),
    };
  }

  /// Crée un VaccinationModel depuis une ligne de base de données SQLite
  factory VaccinationModel.fromDatabase(Map<String, dynamic> map) {
    return VaccinationModel(
      id: map['id'] as String,
      sapeurPompierId: map['sapeur_pompier_id'] as String,
      typeVaccin: map['type_vaccin'] as String,
      dateVaccination: DateTime.parse(map['date_vaccination'] as String),
      nombreDoses: map['nombre_doses'] as int?,
      referenceLot: map['reference_lot'] as String?,
      nomMedecin: map['nom_medecin'] as String?,
      signaturePath: map['signature_path'] as String?,
      observations: map['observations'] as String?,
      dateRappel: map['date_rappel'] != null
          ? DateTime.parse(map['date_rappel'] as String)
          : null,
    );
  }

  /// Convertit VaccinationModel vers format base de données SQLite
  Map<String, dynamic> toDatabase() {
    return {
      'id': id,
      'sapeur_pompier_id': sapeurPompierId,
      'type_vaccin': typeVaccin,
      'date_vaccination': dateVaccination.toIso8601String(),
      'nombre_doses': nombreDoses,
      'reference_lot': referenceLot,
      'nom_medecin': nomMedecin,
      'signature_path': signaturePath,
      'observations': observations,
      'date_rappel': dateRappel?.toIso8601String(),
    };
  }

  /// Crée un VaccinationModel depuis une entité Vaccination
  factory VaccinationModel.fromEntity(Vaccination vaccination) {
    return VaccinationModel(
      id: vaccination.id,
      sapeurPompierId: vaccination.sapeurPompierId,
      typeVaccin: vaccination.typeVaccin,
      dateVaccination: vaccination.dateVaccination,
      nombreDoses: vaccination.nombreDoses,
      referenceLot: vaccination.referenceLot,
      nomMedecin: vaccination.nomMedecin,
      signaturePath: vaccination.signaturePath,
      observations: vaccination.observations,
      dateRappel: vaccination.dateRappel,
    );
  }
}
