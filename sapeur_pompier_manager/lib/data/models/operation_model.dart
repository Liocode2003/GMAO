import '../../domain/entities/operation.dart';

/// Model de données pour Operation avec sérialisation JSON
class OperationModel extends Operation {
  const OperationModel({
    required super.id,
    required super.sapeurPompierId,
    required super.numeroSejour,
    super.lieuSejour,
    super.dateDepart,
    super.etatSanteDepart,
    super.poidsDepart,
    super.taDepart,
    super.avDepart,
    super.glycemieDepart,
    super.aaDepart,
    super.observationsDepart,
    super.lieuSignatureDepart,
    super.dateSignatureDepart,
    super.nomMedecinDepart,
    super.dateRetour,
    super.etatSanteRetour,
    super.poidsRetour,
    super.taRetour,
    super.avRetour,
    super.glycemieRetour,
    super.aaRetour,
    super.observationsRetour,
    super.lieuSignatureRetour,
    super.dateSignatureRetour,
    super.nomMedecinRetour,
  });

  /// Crée un OperationModel depuis JSON
  factory OperationModel.fromJson(Map<String, dynamic> json) {
    return OperationModel(
      id: json['id'] as String,
      sapeurPompierId: json['sapeurPompierId'] as String,
      numeroSejour: json['numeroSejour'] as int,
      lieuSejour: json['lieuSejour'] as String?,
      dateDepart: json['dateDepart'] != null
          ? DateTime.parse(json['dateDepart'] as String)
          : null,
      etatSanteDepart: json['etatSanteDepart'] as String?,
      poidsDepart: (json['poidsDepart'] as num?)?.toDouble(),
      taDepart: json['taDepart'] as String?,
      avDepart: json['avDepart'] as String?,
      glycemieDepart: json['glycemieDepart'] as String?,
      aaDepart: json['aaDepart'] as String?,
      observationsDepart: json['observationsDepart'] as String?,
      lieuSignatureDepart: json['lieuSignatureDepart'] as String?,
      dateSignatureDepart: json['dateSignatureDepart'] != null
          ? DateTime.parse(json['dateSignatureDepart'] as String)
          : null,
      nomMedecinDepart: json['nomMedecinDepart'] as String?,
      dateRetour: json['dateRetour'] != null
          ? DateTime.parse(json['dateRetour'] as String)
          : null,
      etatSanteRetour: json['etatSanteRetour'] as String?,
      poidsRetour: (json['poidsRetour'] as num?)?.toDouble(),
      taRetour: json['taRetour'] as String?,
      avRetour: json['avRetour'] as String?,
      glycemieRetour: json['glycemieRetour'] as String?,
      aaRetour: json['aaRetour'] as String?,
      observationsRetour: json['observationsRetour'] as String?,
      lieuSignatureRetour: json['lieuSignatureRetour'] as String?,
      dateSignatureRetour: json['dateSignatureRetour'] != null
          ? DateTime.parse(json['dateSignatureRetour'] as String)
          : null,
      nomMedecinRetour: json['nomMedecinRetour'] as String?,
    );
  }

  /// Convertit OperationModel vers JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'sapeurPompierId': sapeurPompierId,
      'numeroSejour': numeroSejour,
      'lieuSejour': lieuSejour,
      'dateDepart': dateDepart?.toIso8601String(),
      'etatSanteDepart': etatSanteDepart,
      'poidsDepart': poidsDepart,
      'taDepart': taDepart,
      'avDepart': avDepart,
      'glycemieDepart': glycemieDepart,
      'aaDepart': aaDepart,
      'observationsDepart': observationsDepart,
      'lieuSignatureDepart': lieuSignatureDepart,
      'dateSignatureDepart': dateSignatureDepart?.toIso8601String(),
      'nomMedecinDepart': nomMedecinDepart,
      'dateRetour': dateRetour?.toIso8601String(),
      'etatSanteRetour': etatSanteRetour,
      'poidsRetour': poidsRetour,
      'taRetour': taRetour,
      'avRetour': avRetour,
      'glycemieRetour': glycemieRetour,
      'aaRetour': aaRetour,
      'observationsRetour': observationsRetour,
      'lieuSignatureRetour': lieuSignatureRetour,
      'dateSignatureRetour': dateSignatureRetour?.toIso8601String(),
      'nomMedecinRetour': nomMedecinRetour,
    };
  }

  /// Crée un OperationModel depuis une ligne de base de données SQLite
  factory OperationModel.fromDatabase(Map<String, dynamic> map) {
    return OperationModel(
      id: map['id'] as String,
      sapeurPompierId: map['sapeur_pompier_id'] as String,
      numeroSejour: map['numero_sejour'] as int,
      lieuSejour: map['lieu_sejour'] as String?,
      dateDepart: map['date_depart'] != null
          ? DateTime.parse(map['date_depart'] as String)
          : null,
      etatSanteDepart: map['etat_sante_depart'] as String?,
      poidsDepart: (map['poids_depart'] as num?)?.toDouble(),
      taDepart: map['ta_depart'] as String?,
      avDepart: map['av_depart'] as String?,
      glycemieDepart: map['glycemie_depart'] as String?,
      aaDepart: map['aa_depart'] as String?,
      observationsDepart: map['observations_depart'] as String?,
      lieuSignatureDepart: map['lieu_signature_depart'] as String?,
      dateSignatureDepart: map['date_signature_depart'] != null
          ? DateTime.parse(map['date_signature_depart'] as String)
          : null,
      nomMedecinDepart: map['nom_medecin_depart'] as String?,
      dateRetour: map['date_retour'] != null
          ? DateTime.parse(map['date_retour'] as String)
          : null,
      etatSanteRetour: map['etat_sante_retour'] as String?,
      poidsRetour: (map['poids_retour'] as num?)?.toDouble(),
      taRetour: map['ta_retour'] as String?,
      avRetour: map['av_retour'] as String?,
      glycemieRetour: map['glycemie_retour'] as String?,
      aaRetour: map['aa_retour'] as String?,
      observationsRetour: map['observations_retour'] as String?,
      lieuSignatureRetour: map['lieu_signature_retour'] as String?,
      dateSignatureRetour: map['date_signature_retour'] != null
          ? DateTime.parse(map['date_signature_retour'] as String)
          : null,
      nomMedecinRetour: map['nom_medecin_retour'] as String?,
    );
  }

  /// Convertit OperationModel vers format base de données SQLite
  Map<String, dynamic> toDatabase() {
    return {
      'id': id,
      'sapeur_pompier_id': sapeurPompierId,
      'numero_sejour': numeroSejour,
      'lieu_sejour': lieuSejour,
      'date_depart': dateDepart?.toIso8601String(),
      'etat_sante_depart': etatSanteDepart,
      'poids_depart': poidsDepart,
      'ta_depart': taDepart,
      'av_depart': avDepart,
      'glycemie_depart': glycemieDepart,
      'aa_depart': aaDepart,
      'observations_depart': observationsDepart,
      'lieu_signature_depart': lieuSignatureDepart,
      'date_signature_depart': dateSignatureDepart?.toIso8601String(),
      'nom_medecin_depart': nomMedecinDepart,
      'date_retour': dateRetour?.toIso8601String(),
      'etat_sante_retour': etatSanteRetour,
      'poids_retour': poidsRetour,
      'ta_retour': taRetour,
      'av_retour': avRetour,
      'glycemie_retour': glycemieRetour,
      'aa_retour': aaRetour,
      'observations_retour': observationsRetour,
      'lieu_signature_retour': lieuSignatureRetour,
      'date_signature_retour': dateSignatureRetour?.toIso8601String(),
      'nom_medecin_retour': nomMedecinRetour,
    };
  }

  /// Crée un OperationModel depuis une entité Operation
  factory OperationModel.fromEntity(Operation operation) {
    return OperationModel(
      id: operation.id,
      sapeurPompierId: operation.sapeurPompierId,
      numeroSejour: operation.numeroSejour,
      lieuSejour: operation.lieuSejour,
      dateDepart: operation.dateDepart,
      etatSanteDepart: operation.etatSanteDepart,
      poidsDepart: operation.poidsDepart,
      taDepart: operation.taDepart,
      avDepart: operation.avDepart,
      glycemieDepart: operation.glycemieDepart,
      aaDepart: operation.aaDepart,
      observationsDepart: operation.observationsDepart,
      lieuSignatureDepart: operation.lieuSignatureDepart,
      dateSignatureDepart: operation.dateSignatureDepart,
      nomMedecinDepart: operation.nomMedecinDepart,
      dateRetour: operation.dateRetour,
      etatSanteRetour: operation.etatSanteRetour,
      poidsRetour: operation.poidsRetour,
      taRetour: operation.taRetour,
      avRetour: operation.avRetour,
      glycemieRetour: operation.glycemieRetour,
      aaRetour: operation.aaRetour,
      observationsRetour: operation.observationsRetour,
      lieuSignatureRetour: operation.lieuSignatureRetour,
      dateSignatureRetour: operation.dateSignatureRetour,
      nomMedecinRetour: operation.nomMedecinRetour,
    );
  }
}
