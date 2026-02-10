import '../../domain/entities/indisponibilite.dart';

/// Model de données pour Indisponibilite avec sérialisation JSON
class IndisponibiliteModel extends Indisponibilite {
  const IndisponibiliteModel({
    required super.id,
    required super.sapeurPompierId,
    super.corpsEntite,
    required super.dateDebut,
    required super.dateFin,
    super.diagnostic,
    super.dureeHopital,
    super.dureeInfirmerie,
    super.dureeChambre,
    super.observations,
    super.nomMedecin,
    super.visaSignaturePath,
  });

  /// Crée un IndisponibiliteModel depuis JSON
  factory IndisponibiliteModel.fromJson(Map<String, dynamic> json) {
    return IndisponibiliteModel(
      id: json['id'] as String,
      sapeurPompierId: json['sapeurPompierId'] as String,
      corpsEntite: json['corpsEntite'] as String?,
      dateDebut: DateTime.parse(json['dateDebut'] as String),
      dateFin: DateTime.parse(json['dateFin'] as String),
      diagnostic: json['diagnostic'] as String?,
      dureeHopital: json['dureeHopital'] as int?,
      dureeInfirmerie: json['dureeInfirmerie'] as int?,
      dureeChambre: json['dureeChambre'] as int?,
      observations: json['observations'] as String?,
      nomMedecin: json['nomMedecin'] as String?,
      visaSignaturePath: json['visaSignaturePath'] as String?,
    );
  }

  /// Convertit IndisponibiliteModel vers JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'sapeurPompierId': sapeurPompierId,
      'corpsEntite': corpsEntite,
      'dateDebut': dateDebut.toIso8601String(),
      'dateFin': dateFin.toIso8601String(),
      'diagnostic': diagnostic,
      'dureeHopital': dureeHopital,
      'dureeInfirmerie': dureeInfirmerie,
      'dureeChambre': dureeChambre,
      'observations': observations,
      'nomMedecin': nomMedecin,
      'visaSignaturePath': visaSignaturePath,
    };
  }

  /// Crée un IndisponibiliteModel depuis une ligne de base de données SQLite
  factory IndisponibiliteModel.fromDatabase(Map<String, dynamic> map) {
    return IndisponibiliteModel(
      id: map['id'] as String,
      sapeurPompierId: map['sapeur_pompier_id'] as String,
      corpsEntite: map['corps_entite'] as String?,
      dateDebut: DateTime.parse(map['date_debut'] as String),
      dateFin: DateTime.parse(map['date_fin'] as String),
      diagnostic: map['diagnostic'] as String?,
      dureeHopital: map['duree_hopital'] as int?,
      dureeInfirmerie: map['duree_infirmerie'] as int?,
      dureeChambre: map['duree_chambre'] as int?,
      observations: map['observations'] as String?,
      nomMedecin: map['nom_medecin'] as String?,
      visaSignaturePath: map['visa_signature_path'] as String?,
    );
  }

  /// Convertit IndisponibiliteModel vers format base de données SQLite
  Map<String, dynamic> toDatabase() {
    return {
      'id': id,
      'sapeur_pompier_id': sapeurPompierId,
      'corps_entite': corpsEntite,
      'date_debut': dateDebut.toIso8601String(),
      'date_fin': dateFin.toIso8601String(),
      'diagnostic': diagnostic,
      'duree_hopital': dureeHopital,
      'duree_infirmerie': dureeInfirmerie,
      'duree_chambre': dureeChambre,
      'observations': observations,
      'nom_medecin': nomMedecin,
      'visa_signature_path': visaSignaturePath,
    };
  }

  /// Crée un IndisponibiliteModel depuis une entité Indisponibilite
  factory IndisponibiliteModel.fromEntity(Indisponibilite indisponibilite) {
    return IndisponibiliteModel(
      id: indisponibilite.id,
      sapeurPompierId: indisponibilite.sapeurPompierId,
      corpsEntite: indisponibilite.corpsEntite,
      dateDebut: indisponibilite.dateDebut,
      dateFin: indisponibilite.dateFin,
      diagnostic: indisponibilite.diagnostic,
      dureeHopital: indisponibilite.dureeHopital,
      dureeInfirmerie: indisponibilite.dureeInfirmerie,
      dureeChambre: indisponibilite.dureeChambre,
      observations: indisponibilite.observations,
      nomMedecin: indisponibilite.nomMedecin,
      visaSignaturePath: indisponibilite.visaSignaturePath,
    );
  }
}
