import 'package:equatable/equatable.dart';

/// Entité représentant une période d'indisponibilité pour raison de santé
class Indisponibilite extends Equatable {
  final String id;
  final String sapeurPompierId;
  final String? corpsEntite;
  final DateTime dateDebut;
  final DateTime dateFin;
  final String? diagnostic;
  final int? dureeHopital; // en jours
  final int? dureeInfirmerie; // en jours
  final int? dureeChambre; // en jours
  final String? observations;
  final String? nomMedecin;
  final String? visaSignaturePath;

  const Indisponibilite({
    required this.id,
    required this.sapeurPompierId,
    this.corpsEntite,
    required this.dateDebut,
    required this.dateFin,
    this.diagnostic,
    this.dureeHopital,
    this.dureeInfirmerie,
    this.dureeChambre,
    this.observations,
    this.nomMedecin,
    this.visaSignaturePath,
  });

  /// Calcule la durée totale d'indisponibilité en jours
  int get dureeTotale {
    return dateFin.difference(dateDebut).inDays + 1;
  }

  /// Calcule la somme des durées (hôpital + infirmerie + chambre)
  int get dureeSommeLieux {
    return (dureeHopital ?? 0) + (dureeInfirmerie ?? 0) + (dureeChambre ?? 0);
  }

  /// Vérifie si l'indisponibilité est en cours
  bool get isEnCours {
    final now = DateTime.now();
    return now.isAfter(dateDebut) && now.isBefore(dateFin);
  }

  /// Vérifie si l'indisponibilité est terminée
  bool get isTerminee {
    return DateTime.now().isAfter(dateFin);
  }

  /// Vérifie si l'indisponibilité est future
  bool get isFuture {
    return DateTime.now().isBefore(dateDebut);
  }

  /// Obtient le statut
  String get statut {
    if (isTerminee) return 'Terminée';
    if (isEnCours) return 'En cours';
    if (isFuture) return 'Future';
    return 'Inconnue';
  }

  /// Vérifie si les informations sont complètes
  bool get isComplete =>
      diagnostic != null &&
      nomMedecin != null &&
      (dureeHopital != null || dureeInfirmerie != null || dureeChambre != null);

  /// Vérifie si la signature est disponible
  bool get hasSignature =>
      visaSignaturePath != null && visaSignaturePath!.isNotEmpty;

  @override
  List<Object?> get props => [
        id,
        sapeurPompierId,
        corpsEntite,
        dateDebut,
        dateFin,
        diagnostic,
        dureeHopital,
        dureeInfirmerie,
        dureeChambre,
        observations,
        nomMedecin,
        visaSignaturePath,
      ];

  Indisponibilite copyWith({
    String? id,
    String? sapeurPompierId,
    String? corpsEntite,
    DateTime? dateDebut,
    DateTime? dateFin,
    String? diagnostic,
    int? dureeHopital,
    int? dureeInfirmerie,
    int? dureeChambre,
    String? observations,
    String? nomMedecin,
    String? visaSignaturePath,
  }) {
    return Indisponibilite(
      id: id ?? this.id,
      sapeurPompierId: sapeurPompierId ?? this.sapeurPompierId,
      corpsEntite: corpsEntite ?? this.corpsEntite,
      dateDebut: dateDebut ?? this.dateDebut,
      dateFin: dateFin ?? this.dateFin,
      diagnostic: diagnostic ?? this.diagnostic,
      dureeHopital: dureeHopital ?? this.dureeHopital,
      dureeInfirmerie: dureeInfirmerie ?? this.dureeInfirmerie,
      dureeChambre: dureeChambre ?? this.dureeChambre,
      observations: observations ?? this.observations,
      nomMedecin: nomMedecin ?? this.nomMedecin,
      visaSignaturePath: visaSignaturePath ?? this.visaSignaturePath,
    );
  }
}
