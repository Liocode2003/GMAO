import 'package:equatable/equatable.dart';

/// Entité représentant une visite sanitaire
class VisiteSanitaire extends Equatable {
  final String id;
  final String sapeurPompierId;
  final String? entiteCorps;
  final DateTime dateVisite;
  final String? resultats;
  final String? observations;
  final String? nomMedecin;
  final String? signaturePath;

  const VisiteSanitaire({
    required this.id,
    required this.sapeurPompierId,
    this.entiteCorps,
    required this.dateVisite,
    this.resultats,
    this.observations,
    this.nomMedecin,
    this.signaturePath,
  });

  /// Vérifie si la visite est complète
  bool get isComplete =>
      entiteCorps != null &&
      resultats != null &&
      nomMedecin != null;

  /// Vérifie si la signature est disponible
  bool get hasSignature => signaturePath != null && signaturePath!.isNotEmpty;

  /// Calcule le nombre de jours depuis la visite
  int get joursDepuisVisite {
    return DateTime.now().difference(dateVisite).inDays;
  }

  @override
  List<Object?> get props => [
        id,
        sapeurPompierId,
        entiteCorps,
        dateVisite,
        resultats,
        observations,
        nomMedecin,
        signaturePath,
      ];

  VisiteSanitaire copyWith({
    String? id,
    String? sapeurPompierId,
    String? entiteCorps,
    DateTime? dateVisite,
    String? resultats,
    String? observations,
    String? nomMedecin,
    String? signaturePath,
  }) {
    return VisiteSanitaire(
      id: id ?? this.id,
      sapeurPompierId: sapeurPompierId ?? this.sapeurPompierId,
      entiteCorps: entiteCorps ?? this.entiteCorps,
      dateVisite: dateVisite ?? this.dateVisite,
      resultats: resultats ?? this.resultats,
      observations: observations ?? this.observations,
      nomMedecin: nomMedecin ?? this.nomMedecin,
      signaturePath: signaturePath ?? this.signaturePath,
    );
  }
}
