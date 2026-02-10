import '../../domain/entities/certificat.dart';

/// Model de données pour Certificat avec sérialisation JSON
class CertificatModel extends Certificat {
  const CertificatModel({
    required super.id,
    required super.sapeurPompierId,
    required super.titre,
    super.dateCertificat,
    required super.typeCertificat,
    super.fichierPath,
    super.notes,
  });

  /// Crée un CertificatModel depuis JSON
  factory CertificatModel.fromJson(Map<String, dynamic> json) {
    return CertificatModel(
      id: json['id'] as String,
      sapeurPompierId: json['sapeurPompierId'] as String,
      titre: json['titre'] as String,
      dateCertificat: json['dateCertificat'] != null
          ? DateTime.parse(json['dateCertificat'] as String)
          : null,
      typeCertificat: json['typeCertificat'] as String,
      fichierPath: json['fichierPath'] as String?,
      notes: json['notes'] as String?,
    );
  }

  /// Convertit CertificatModel vers JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'sapeurPompierId': sapeurPompierId,
      'titre': titre,
      'dateCertificat': dateCertificat?.toIso8601String(),
      'typeCertificat': typeCertificat,
      'fichierPath': fichierPath,
      'notes': notes,
    };
  }

  /// Crée un CertificatModel depuis une ligne de base de données SQLite
  factory CertificatModel.fromDatabase(Map<String, dynamic> map) {
    return CertificatModel(
      id: map['id'] as String,
      sapeurPompierId: map['sapeur_pompier_id'] as String,
      titre: map['titre'] as String,
      dateCertificat: map['date_certificat'] != null
          ? DateTime.parse(map['date_certificat'] as String)
          : null,
      typeCertificat: map['type_certificat'] as String,
      fichierPath: map['fichier_path'] as String?,
      notes: map['notes'] as String?,
    );
  }

  /// Convertit CertificatModel vers format base de données SQLite
  Map<String, dynamic> toDatabase() {
    return {
      'id': id,
      'sapeur_pompier_id': sapeurPompierId,
      'titre': titre,
      'date_certificat': dateCertificat?.toIso8601String(),
      'type_certificat': typeCertificat,
      'fichier_path': fichierPath,
      'notes': notes,
    };
  }

  /// Crée un CertificatModel depuis une entité Certificat
  factory CertificatModel.fromEntity(Certificat certificat) {
    return CertificatModel(
      id: certificat.id,
      sapeurPompierId: certificat.sapeurPompierId,
      titre: certificat.titre,
      dateCertificat: certificat.dateCertificat,
      typeCertificat: certificat.typeCertificat,
      fichierPath: certificat.fichierPath,
      notes: certificat.notes,
    );
  }
}
