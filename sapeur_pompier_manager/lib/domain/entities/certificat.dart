import 'package:equatable/equatable.dart';

/// Types de certificats
enum TypeCertificat {
  blessure('Blessure'),
  maladie('Maladie'),
  autre('Autre');

  const TypeCertificat(this.libelle);
  final String libelle;
}

/// Entité représentant une copie de certificat médical
class Certificat extends Equatable {
  final String id;
  final String sapeurPompierId;
  final String titre;
  final DateTime? dateCertificat;
  final String typeCertificat; // TypeCertificat enum value
  final String? fichierPath;
  final String? notes;

  const Certificat({
    required this.id,
    required this.sapeurPompierId,
    required this.titre,
    this.dateCertificat,
    required this.typeCertificat,
    this.fichierPath,
    this.notes,
  });

  /// Vérifie si le fichier est disponible
  bool get hasFichier => fichierPath != null && fichierPath!.isNotEmpty;

  /// Obtient l'extension du fichier
  String? get fileExtension {
    if (fichierPath == null) return null;
    final parts = fichierPath!.split('.');
    return parts.length > 1 ? parts.last.toLowerCase() : null;
  }

  /// Vérifie si c'est un PDF
  bool get isPdf => fileExtension == 'pdf';

  /// Vérifie si c'est une image
  bool get isImage {
    if (fileExtension == null) return false;
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp'].contains(fileExtension);
  }

  /// Obtient le libellé du type de certificat
  String get typeCertificatLibelle {
    try {
      final type = TypeCertificat.values.firstWhere(
        (e) => e.name == typeCertificat,
      );
      return type.libelle;
    } catch (e) {
      return typeCertificat;
    }
  }

  @override
  List<Object?> get props => [
        id,
        sapeurPompierId,
        titre,
        dateCertificat,
        typeCertificat,
        fichierPath,
        notes,
      ];

  Certificat copyWith({
    String? id,
    String? sapeurPompierId,
    String? titre,
    DateTime? dateCertificat,
    String? typeCertificat,
    String? fichierPath,
    String? notes,
  }) {
    return Certificat(
      id: id ?? this.id,
      sapeurPompierId: sapeurPompierId ?? this.sapeurPompierId,
      titre: titre ?? this.titre,
      dateCertificat: dateCertificat ?? this.dateCertificat,
      typeCertificat: typeCertificat ?? this.typeCertificat,
      fichierPath: fichierPath ?? this.fichierPath,
      notes: notes ?? this.notes,
    );
  }
}
