import 'package:equatable/equatable.dart';

/// Entité représentant une opération (OPEX/OPINT)
class Operation extends Equatable {
  final String id;
  final String sapeurPompierId;
  final int numeroSejour; // 1-6

  // Au départ
  final String? lieuSejour;
  final DateTime? dateDepart;
  final String? etatSanteDepart;
  final double? poidsDepart;
  final String? taDepart;
  final String? avDepart;
  final String? glycemieDepart;
  final String? aaDepart;
  final String? observationsDepart;
  final String? lieuSignatureDepart;
  final DateTime? dateSignatureDepart;
  final String? nomMedecinDepart;

  // Au retour
  final DateTime? dateRetour;
  final String? etatSanteRetour;
  final double? poidsRetour;
  final String? taRetour;
  final String? avRetour;
  final String? glycemieRetour;
  final String? aaRetour;
  final String? observationsRetour;
  final String? lieuSignatureRetour;
  final DateTime? dateSignatureRetour;
  final String? nomMedecinRetour;

  const Operation({
    required this.id,
    required this.sapeurPompierId,
    required this.numeroSejour,
    this.lieuSejour,
    this.dateDepart,
    this.etatSanteDepart,
    this.poidsDepart,
    this.taDepart,
    this.avDepart,
    this.glycemieDepart,
    this.aaDepart,
    this.observationsDepart,
    this.lieuSignatureDepart,
    this.dateSignatureDepart,
    this.nomMedecinDepart,
    this.dateRetour,
    this.etatSanteRetour,
    this.poidsRetour,
    this.taRetour,
    this.avRetour,
    this.glycemieRetour,
    this.aaRetour,
    this.observationsRetour,
    this.lieuSignatureRetour,
    this.dateSignatureRetour,
    this.nomMedecinRetour,
  });

  /// Calcule la durée du séjour en jours
  int? get dureeSejour {
    if (dateDepart == null || dateRetour == null) return null;
    return dateRetour!.difference(dateDepart!).inDays;
  }

  /// Calcule la variation de poids
  double? get variationPoids {
    if (poidsDepart == null || poidsRetour == null) return null;
    return poidsRetour! - poidsDepart!;
  }

  /// Vérifie si le départ est complet
  bool get isDepartComplete =>
      lieuSejour != null &&
      dateDepart != null &&
      etatSanteDepart != null &&
      nomMedecinDepart != null;

  /// Vérifie si le retour est complet
  bool get isRetourComplete =>
      dateRetour != null &&
      etatSanteRetour != null &&
      nomMedecinRetour != null;

  /// Vérifie si l'opération est complète
  bool get isComplete => isDepartComplete && isRetourComplete;

  /// Vérifie si l'opération est en cours (départ sans retour)
  bool get isEnCours => isDepartComplete && !isRetourComplete;

  @override
  List<Object?> get props => [
        id,
        sapeurPompierId,
        numeroSejour,
        lieuSejour,
        dateDepart,
        etatSanteDepart,
        poidsDepart,
        taDepart,
        avDepart,
        glycemieDepart,
        aaDepart,
        observationsDepart,
        lieuSignatureDepart,
        dateSignatureDepart,
        nomMedecinDepart,
        dateRetour,
        etatSanteRetour,
        poidsRetour,
        taRetour,
        avRetour,
        glycemieRetour,
        aaRetour,
        observationsRetour,
        lieuSignatureRetour,
        dateSignatureRetour,
        nomMedecinRetour,
      ];

  Operation copyWith({
    String? id,
    String? sapeurPompierId,
    int? numeroSejour,
    String? lieuSejour,
    DateTime? dateDepart,
    String? etatSanteDepart,
    double? poidsDepart,
    String? taDepart,
    String? avDepart,
    String? glycemieDepart,
    String? aaDepart,
    String? observationsDepart,
    String? lieuSignatureDepart,
    DateTime? dateSignatureDepart,
    String? nomMedecinDepart,
    DateTime? dateRetour,
    String? etatSanteRetour,
    double? poidsRetour,
    String? taRetour,
    String? avRetour,
    String? glycemieRetour,
    String? aaRetour,
    String? observationsRetour,
    String? lieuSignatureRetour,
    DateTime? dateSignatureRetour,
    String? nomMedecinRetour,
  }) {
    return Operation(
      id: id ?? this.id,
      sapeurPompierId: sapeurPompierId ?? this.sapeurPompierId,
      numeroSejour: numeroSejour ?? this.numeroSejour,
      lieuSejour: lieuSejour ?? this.lieuSejour,
      dateDepart: dateDepart ?? this.dateDepart,
      etatSanteDepart: etatSanteDepart ?? this.etatSanteDepart,
      poidsDepart: poidsDepart ?? this.poidsDepart,
      taDepart: taDepart ?? this.taDepart,
      avDepart: avDepart ?? this.avDepart,
      glycemieDepart: glycemieDepart ?? this.glycemieDepart,
      aaDepart: aaDepart ?? this.aaDepart,
      observationsDepart: observationsDepart ?? this.observationsDepart,
      lieuSignatureDepart: lieuSignatureDepart ?? this.lieuSignatureDepart,
      dateSignatureDepart: dateSignatureDepart ?? this.dateSignatureDepart,
      nomMedecinDepart: nomMedecinDepart ?? this.nomMedecinDepart,
      dateRetour: dateRetour ?? this.dateRetour,
      etatSanteRetour: etatSanteRetour ?? this.etatSanteRetour,
      poidsRetour: poidsRetour ?? this.poidsRetour,
      taRetour: taRetour ?? this.taRetour,
      avRetour: avRetour ?? this.avRetour,
      glycemieRetour: glycemieRetour ?? this.glycemieRetour,
      aaRetour: aaRetour ?? this.aaRetour,
      observationsRetour: observationsRetour ?? this.observationsRetour,
      lieuSignatureRetour: lieuSignatureRetour ?? this.lieuSignatureRetour,
      dateSignatureRetour: dateSignatureRetour ?? this.dateSignatureRetour,
      nomMedecinRetour: nomMedecinRetour ?? this.nomMedecinRetour,
    );
  }
}
