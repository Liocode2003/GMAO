import 'package:equatable/equatable.dart';

/// Types de vaccins prédéfinis
enum TypeVaccin {
  antiamaril('Antiamaril (fièvre jaune)', 10),
  antitetanique('Antitétanique', 10),
  antimeningite('Antiméningite', 3),
  antiCovid('Anti-COVID-19', 1),
  antihepatiteB('Antihépatite B', 10),
  autres('Autres', 0);

  const TypeVaccin(this.libelle, this.dureeValiditeAnnees);

  final String libelle;
  final int dureeValiditeAnnees; // 0 = pas de rappel automatique
}

/// Entité représentant une vaccination
class Vaccination extends Equatable {
  final String id;
  final String sapeurPompierId;
  final String typeVaccin; // TypeVaccin enum value
  final DateTime dateVaccination;
  final int? nombreDoses;
  final String? referenceLot;
  final String? nomMedecin;
  final String? signaturePath;
  final String? observations;
  final DateTime? dateRappel;

  const Vaccination({
    required this.id,
    required this.sapeurPompierId,
    required this.typeVaccin,
    required this.dateVaccination,
    this.nombreDoses,
    this.referenceLot,
    this.nomMedecin,
    this.signaturePath,
    this.observations,
    this.dateRappel,
  });

  /// Calcule automatiquement la date de rappel selon le type de vaccin
  static DateTime? calculateDateRappel(String typeVaccin, DateTime dateVaccination) {
    final type = TypeVaccin.values.firstWhere(
      (e) => e.name == typeVaccin,
      orElse: () => TypeVaccin.autres,
    );

    if (type.dureeValiditeAnnees == 0) return null;

    return DateTime(
      dateVaccination.year + type.dureeValiditeAnnees,
      dateVaccination.month,
      dateVaccination.day,
    );
  }

  /// Vérifie si le vaccin est expiré
  bool get isExpire {
    if (dateRappel == null) return false;
    return DateTime.now().isAfter(dateRappel!);
  }

  /// Vérifie si le vaccin arrive bientôt à expiration (moins de 30 jours)
  bool get isProcheDExpiration {
    if (dateRappel == null) return false;
    final now = DateTime.now();
    final difference = dateRappel!.difference(now).inDays;
    return difference > 0 && difference <= 30;
  }

  /// Obtient le statut du vaccin
  String get statut {
    if (isExpire) return 'Expiré';
    if (isProcheDExpiration) return 'Proche expiration';
    return 'À jour';
  }

  /// Obtient le libellé du type de vaccin
  String get typeVaccinLibelle {
    try {
      final type = TypeVaccin.values.firstWhere((e) => e.name == typeVaccin);
      return type.libelle;
    } catch (e) {
      return typeVaccin;
    }
  }

  /// Vérifie si la signature est disponible
  bool get hasSignature => signaturePath != null && signaturePath!.isNotEmpty;

  @override
  List<Object?> get props => [
        id,
        sapeurPompierId,
        typeVaccin,
        dateVaccination,
        nombreDoses,
        referenceLot,
        nomMedecin,
        signaturePath,
        observations,
        dateRappel,
      ];

  Vaccination copyWith({
    String? id,
    String? sapeurPompierId,
    String? typeVaccin,
    DateTime? dateVaccination,
    int? nombreDoses,
    String? referenceLot,
    String? nomMedecin,
    String? signaturePath,
    String? observations,
    DateTime? dateRappel,
  }) {
    return Vaccination(
      id: id ?? this.id,
      sapeurPompierId: sapeurPompierId ?? this.sapeurPompierId,
      typeVaccin: typeVaccin ?? this.typeVaccin,
      dateVaccination: dateVaccination ?? this.dateVaccination,
      nombreDoses: nombreDoses ?? this.nombreDoses,
      referenceLot: referenceLot ?? this.referenceLot,
      nomMedecin: nomMedecin ?? this.nomMedecin,
      signaturePath: signaturePath ?? this.signaturePath,
      observations: observations ?? this.observations,
      dateRappel: dateRappel ?? this.dateRappel,
    );
  }
}
