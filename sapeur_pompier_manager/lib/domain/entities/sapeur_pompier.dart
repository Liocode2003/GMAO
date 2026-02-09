import 'package:equatable/equatable.dart';
import 'package:sapeur_pompier_manager/domain/entities/etat_civil.dart';
import 'package:sapeur_pompier_manager/domain/entities/constantes.dart';
import 'package:sapeur_pompier_manager/domain/entities/examen_incorporation.dart';
import 'package:sapeur_pompier_manager/domain/entities/operation.dart';
import 'package:sapeur_pompier_manager/domain/entities/vaccination.dart';
import 'package:sapeur_pompier_manager/domain/entities/visite_sanitaire.dart';
import 'package:sapeur_pompier_manager/domain/entities/indisponibilite.dart';
import 'package:sapeur_pompier_manager/domain/entities/certificat.dart';
import 'package:sapeur_pompier_manager/domain/entities/decision_reforme.dart';
import 'package:sapeur_pompier_manager/domain/entities/controle_fin_service.dart';

/// Entité principale représentant un sapeur-pompier
class SapeurPompier extends Equatable {
  final String id;
  final String matricule;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? createdBy;
  final String? updatedBy;

  // Relations avec les autres entités
  final EtatCivil? etatCivil;
  final Constantes? constantes;
  final ExamenIncorporation? examenIncorporation;
  final List<Operation> operations;
  final List<Vaccination> vaccinations;
  final List<VisiteSanitaire> visitesSanitaires;
  final List<Indisponibilite> indisponibilites;
  final List<Certificat> certificats;
  final List<DecisionReforme> decisionsReforme;
  final ControleFinService? controleFinService;
  final List<HistoriquePoids> historiquePoids;

  const SapeurPompier({
    required this.id,
    required this.matricule,
    required this.createdAt,
    required this.updatedAt,
    this.createdBy,
    this.updatedBy,
    this.etatCivil,
    this.constantes,
    this.examenIncorporation,
    this.operations = const [],
    this.vaccinations = const [],
    this.visitesSanitaires = const [],
    this.indisponibilites = const [],
    this.certificats = const [],
    this.decisionsReforme = const [],
    this.controleFinService,
    this.historiquePoids = const [],
  });

  /// Obtient le nom complet
  String get nomComplet => etatCivil?.nomComplet ?? 'Inconnu';

  /// Obtient l'âge
  int? get age => etatCivil?.age;

  /// Obtient le statut médical (Apte/Inapte)
  String get statutMedical {
    if (examenIncorporation == null) return 'Non évalué';
    return examenIncorporation!.decision ?? 'Non déterminé';
  }

  /// Vérifie si le dossier est apte
  bool get isApte => examenIncorporation?.isApte ?? false;

  /// Vérifie si le dossier est inapte
  bool get isInapte => examenIncorporation?.isInapte ?? false;

  /// Calcule le pourcentage de complétude du dossier
  double get completionPercentage {
    int totalSections = 10;
    int completedSections = 0;

    if (etatCivil != null) completedSections++;
    if (constantes?.isComplete ?? false) completedSections++;
    if (examenIncorporation?.isComplete ?? false) completedSections++;
    if (operations.isNotEmpty) completedSections++;
    if (vaccinations.isNotEmpty) completedSections++;
    if (visitesSanitaires.isNotEmpty) completedSections++;
    if (indisponibilites.isNotEmpty) completedSections++;
    if (certificats.isNotEmpty) completedSections++;
    if (decisionsReforme.isNotEmpty) completedSections++;
    if (controleFinService != null) completedSections++;

    return (completedSections / totalSections) * 100;
  }

  /// Vérifie si le dossier est complet
  bool get isComplet => completionPercentage >= 70; // Au moins 70%

  /// Obtient le nombre de vaccinations expirées
  int get vaccinationsExpirees {
    return vaccinations.where((v) => v.isExpire).length;
  }

  /// Obtient le nombre de vaccinations proches de l'expiration
  int get vaccinationsProchesExpiration {
    return vaccinations.where((v) => v.isProcheDExpiration).length;
  }

  /// Obtient la dernière visite sanitaire
  VisiteSanitaire? get derniereVisite {
    if (visitesSanitaires.isEmpty) return null;
    final sorted = List<VisiteSanitaire>.from(visitesSanitaires)
      ..sort((a, b) => b.dateVisite.compareTo(a.dateVisite));
    return sorted.first;
  }

  /// Calcule le nombre de jours depuis la dernière visite
  int? get joursSansDerniereVisite {
    final derniere = derniereVisite;
    if (derniere == null) return null;
    return DateTime.now().difference(derniere.dateVisite).inDays;
  }

  /// Vérifie si la visite annuelle est en retard (> 365 jours)
  bool get visiteAnnuelleEnRetard {
    final jours = joursSansDerniereVisite;
    return jours == null || jours > 365;
  }

  /// Obtient les indisponibilités en cours
  List<Indisponibilite> get indisponibilitesEnCours {
    return indisponibilites.where((i) => i.isEnCours).toList();
  }

  /// Calcule le nombre total de jours d'indisponibilité
  int get totalJoursIndisponibilite {
    return indisponibilites.fold(0, (sum, i) => sum + i.dureeTotale);
  }

  /// Obtient l'IMC actuel
  double? get imc => constantes?.imc;

  /// Obtient le poids actuel
  double? get poids => constantes?.poids;

  /// Obtient la taille
  double? get taille => constantes?.taille;

  /// Vérifie si le sapeur-pompier a une photo
  bool get hasPhoto => etatCivil?.hasPhoto ?? false;

  /// Compte le nombre d'alertes actives
  int get nombreAlertes {
    int count = 0;
    count += vaccinationsExpirees;
    if (visiteAnnuelleEnRetard) count++;
    return count;
  }

  @override
  List<Object?> get props => [
        id,
        matricule,
        createdAt,
        updatedAt,
        createdBy,
        updatedBy,
        etatCivil,
        constantes,
        examenIncorporation,
        operations,
        vaccinations,
        visitesSanitaires,
        indisponibilites,
        certificats,
        decisionsReforme,
        controleFinService,
        historiquePoids,
      ];

  SapeurPompier copyWith({
    String? id,
    String? matricule,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? createdBy,
    String? updatedBy,
    EtatCivil? etatCivil,
    Constantes? constantes,
    ExamenIncorporation? examenIncorporation,
    List<Operation>? operations,
    List<Vaccination>? vaccinations,
    List<VisiteSanitaire>? visitesSanitaires,
    List<Indisponibilite>? indisponibilites,
    List<Certificat>? certificats,
    List<DecisionReforme>? decisionsReforme,
    ControleFinService? controleFinService,
    List<HistoriquePoids>? historiquePoids,
  }) {
    return SapeurPompier(
      id: id ?? this.id,
      matricule: matricule ?? this.matricule,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      createdBy: createdBy ?? this.createdBy,
      updatedBy: updatedBy ?? this.updatedBy,
      etatCivil: etatCivil ?? this.etatCivil,
      constantes: constantes ?? this.constantes,
      examenIncorporation: examenIncorporation ?? this.examenIncorporation,
      operations: operations ?? this.operations,
      vaccinations: vaccinations ?? this.vaccinations,
      visitesSanitaires: visitesSanitaires ?? this.visitesSanitaires,
      indisponibilites: indisponibilites ?? this.indisponibilites,
      certificats: certificats ?? this.certificats,
      decisionsReforme: decisionsReforme ?? this.decisionsReforme,
      controleFinService: controleFinService ?? this.controleFinService,
      historiquePoids: historiquePoids ?? this.historiquePoids,
    );
  }
}
