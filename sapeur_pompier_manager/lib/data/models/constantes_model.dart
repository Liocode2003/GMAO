import '../../domain/entities/constantes.dart';

/// Model de données pour Constantes avec sérialisation JSON
class ConstantesModel extends Constantes {
  const ConstantesModel({
    required super.id,
    required super.sapeurPompierId,
    super.taille,
    super.poids,
    super.imc,
    super.perimetreThoracique,
    super.perimetreAbdominal,
    super.empreintesPath,
    super.signaturePath,
    super.dateMesure,
  });

  /// Crée un ConstantesModel depuis JSON
  factory ConstantesModel.fromJson(Map<String, dynamic> json) {
    return ConstantesModel(
      id: json['id'] as String,
      sapeurPompierId: json['sapeurPompierId'] as String,
      taille: (json['taille'] as num?)?.toDouble(),
      poids: (json['poids'] as num?)?.toDouble(),
      imc: (json['imc'] as num?)?.toDouble(),
      perimetreThoracique: (json['perimetreThoracique'] as num?)?.toDouble(),
      perimetreAbdominal: (json['perimetreAbdominal'] as num?)?.toDouble(),
      empreintesPath: json['empreintesPath'] as String?,
      signaturePath: json['signaturePath'] as String?,
      dateMesure: json['dateMesure'] != null
          ? DateTime.parse(json['dateMesure'] as String)
          : null,
    );
  }

  /// Convertit ConstantesModel vers JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'sapeurPompierId': sapeurPompierId,
      'taille': taille,
      'poids': poids,
      'imc': imc,
      'perimetreThoracique': perimetreThoracique,
      'perimetreAbdominal': perimetreAbdominal,
      'empreintesPath': empreintesPath,
      'signaturePath': signaturePath,
      'dateMesure': dateMesure?.toIso8601String(),
    };
  }

  /// Crée un ConstantesModel depuis une ligne de base de données SQLite
  factory ConstantesModel.fromDatabase(Map<String, dynamic> map) {
    return ConstantesModel(
      id: map['id'] as String,
      sapeurPompierId: map['sapeur_pompier_id'] as String,
      taille: (map['taille'] as num?)?.toDouble(),
      poids: (map['poids'] as num?)?.toDouble(),
      imc: (map['imc'] as num?)?.toDouble(),
      perimetreThoracique: (map['perimetre_thoracique'] as num?)?.toDouble(),
      perimetreAbdominal: (map['perimetre_abdominal'] as num?)?.toDouble(),
      empreintesPath: map['empreintes_path'] as String?,
      signaturePath: map['signature_path'] as String?,
      dateMesure: map['date_mesure'] != null
          ? DateTime.parse(map['date_mesure'] as String)
          : null,
    );
  }

  /// Convertit ConstantesModel vers format base de données SQLite
  Map<String, dynamic> toDatabase() {
    return {
      'id': id,
      'sapeur_pompier_id': sapeurPompierId,
      'taille': taille,
      'poids': poids,
      'imc': imc,
      'perimetre_thoracique': perimetreThoracique,
      'perimetre_abdominal': perimetreAbdominal,
      'empreintes_path': empreintesPath,
      'signature_path': signaturePath,
      'date_mesure': dateMesure?.toIso8601String(),
    };
  }

  /// Crée un ConstantesModel depuis une entité Constantes
  factory ConstantesModel.fromEntity(Constantes constantes) {
    return ConstantesModel(
      id: constantes.id,
      sapeurPompierId: constantes.sapeurPompierId,
      taille: constantes.taille,
      poids: constantes.poids,
      imc: constantes.imc,
      perimetreThoracique: constantes.perimetreThoracique,
      perimetreAbdominal: constantes.perimetreAbdominal,
      empreintesPath: constantes.empreintesPath,
      signaturePath: constantes.signaturePath,
      dateMesure: constantes.dateMesure,
    );
  }
}

/// Model de données pour HistoriquePoids avec sérialisation JSON
class HistoriquePoidsModel extends HistoriquePoids {
  const HistoriquePoidsModel({
    required super.id,
    required super.sapeurPompierId,
    required super.annee,
    required super.poids,
    super.dateMesure,
  });

  /// Crée un HistoriquePoidsModel depuis JSON
  factory HistoriquePoidsModel.fromJson(Map<String, dynamic> json) {
    return HistoriquePoidsModel(
      id: json['id'] as String,
      sapeurPompierId: json['sapeurPompierId'] as String,
      annee: json['annee'] as int,
      poids: (json['poids'] as num).toDouble(),
      dateMesure: json['dateMesure'] != null
          ? DateTime.parse(json['dateMesure'] as String)
          : null,
    );
  }

  /// Convertit HistoriquePoidsModel vers JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'sapeurPompierId': sapeurPompierId,
      'annee': annee,
      'poids': poids,
      'dateMesure': dateMesure?.toIso8601String(),
    };
  }

  /// Crée un HistoriquePoidsModel depuis une ligne de base de données SQLite
  factory HistoriquePoidsModel.fromDatabase(Map<String, dynamic> map) {
    return HistoriquePoidsModel(
      id: map['id'] as String,
      sapeurPompierId: map['sapeur_pompier_id'] as String,
      annee: map['annee'] as int,
      poids: (map['poids'] as num).toDouble(),
      dateMesure: map['date_mesure'] != null
          ? DateTime.parse(map['date_mesure'] as String)
          : null,
    );
  }

  /// Convertit HistoriquePoidsModel vers format base de données SQLite
  Map<String, dynamic> toDatabase() {
    return {
      'id': id,
      'sapeur_pompier_id': sapeurPompierId,
      'annee': annee,
      'poids': poids,
      'date_mesure': dateMesure?.toIso8601String(),
    };
  }

  /// Crée un HistoriquePoidsModel depuis une entité HistoriquePoids
  factory HistoriquePoidsModel.fromEntity(HistoriquePoids historique) {
    return HistoriquePoidsModel(
      id: historique.id,
      sapeurPompierId: historique.sapeurPompierId,
      annee: historique.annee,
      poids: historique.poids,
      dateMesure: historique.dateMesure,
    );
  }
}
