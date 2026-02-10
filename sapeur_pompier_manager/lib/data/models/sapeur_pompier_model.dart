import '../../domain/entities/sapeur_pompier.dart';
import 'etat_civil_model.dart';
import 'constantes_model.dart';
import 'examen_incorporation_model.dart';
import 'operation_model.dart';
import 'vaccination_model.dart';
import 'visite_sanitaire_model.dart';
import 'indisponibilite_model.dart';
import 'certificat_model.dart';
import 'decision_reforme_model.dart';
import 'controle_fin_service_model.dart';

/// Model de données pour SapeurPompier avec sérialisation JSON
class SapeurPompierModel extends SapeurPompier {
  const SapeurPompierModel({
    required super.id,
    required super.matricule,
    required super.createdAt,
    required super.updatedAt,
    super.createdBy,
    super.updatedBy,
    super.etatCivil,
    super.constantes,
    super.examenIncorporation,
    super.operations,
    super.vaccinations,
    super.visitesSanitaires,
    super.indisponibilites,
    super.certificats,
    super.decisionsReforme,
    super.controleFinService,
    super.historiquePoids,
  });

  /// Crée un SapeurPompierModel depuis JSON
  factory SapeurPompierModel.fromJson(Map<String, dynamic> json) {
    return SapeurPompierModel(
      id: json['id'] as String,
      matricule: json['matricule'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      createdBy: json['createdBy'] as String?,
      updatedBy: json['updatedBy'] as String?,
      etatCivil: json['etatCivil'] != null
          ? EtatCivilModel.fromJson(json['etatCivil'] as Map<String, dynamic>)
          : null,
      constantes: json['constantes'] != null
          ? ConstantesModel.fromJson(json['constantes'] as Map<String, dynamic>)
          : null,
      examenIncorporation: json['examenIncorporation'] != null
          ? ExamenIncorporationModel.fromJson(
              json['examenIncorporation'] as Map<String, dynamic>)
          : null,
      operations: json['operations'] != null
          ? (json['operations'] as List)
              .map((e) => OperationModel.fromJson(e as Map<String, dynamic>))
              .toList()
          : const [],
      vaccinations: json['vaccinations'] != null
          ? (json['vaccinations'] as List)
              .map((e) => VaccinationModel.fromJson(e as Map<String, dynamic>))
              .toList()
          : const [],
      visitesSanitaires: json['visitesSanitaires'] != null
          ? (json['visitesSanitaires'] as List)
              .map((e) =>
                  VisiteSanitaireModel.fromJson(e as Map<String, dynamic>))
              .toList()
          : const [],
      indisponibilites: json['indisponibilites'] != null
          ? (json['indisponibilites'] as List)
              .map((e) =>
                  IndisponibiliteModel.fromJson(e as Map<String, dynamic>))
              .toList()
          : const [],
      certificats: json['certificats'] != null
          ? (json['certificats'] as List)
              .map((e) => CertificatModel.fromJson(e as Map<String, dynamic>))
              .toList()
          : const [],
      decisionsReforme: json['decisionsReforme'] != null
          ? (json['decisionsReforme'] as List)
              .map((e) =>
                  DecisionReformeModel.fromJson(e as Map<String, dynamic>))
              .toList()
          : const [],
      controleFinService: json['controleFinService'] != null
          ? ControleFinServiceModel.fromJson(
              json['controleFinService'] as Map<String, dynamic>)
          : null,
      historiquePoids: json['historiquePoids'] != null
          ? (json['historiquePoids'] as List)
              .map((e) =>
                  HistoriquePoidsModel.fromJson(e as Map<String, dynamic>))
              .toList()
          : const [],
    );
  }

  /// Convertit SapeurPompierModel vers JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'matricule': matricule,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'createdBy': createdBy,
      'updatedBy': updatedBy,
      'etatCivil': etatCivil != null
          ? EtatCivilModel.fromEntity(etatCivil!).toJson()
          : null,
      'constantes': constantes != null
          ? ConstantesModel.fromEntity(constantes!).toJson()
          : null,
      'examenIncorporation': examenIncorporation != null
          ? ExamenIncorporationModel.fromEntity(examenIncorporation!).toJson()
          : null,
      'operations':
          operations.map((e) => OperationModel.fromEntity(e).toJson()).toList(),
      'vaccinations': vaccinations
          .map((e) => VaccinationModel.fromEntity(e).toJson())
          .toList(),
      'visitesSanitaires': visitesSanitaires
          .map((e) => VisiteSanitaireModel.fromEntity(e).toJson())
          .toList(),
      'indisponibilites': indisponibilites
          .map((e) => IndisponibiliteModel.fromEntity(e).toJson())
          .toList(),
      'certificats': certificats
          .map((e) => CertificatModel.fromEntity(e).toJson())
          .toList(),
      'decisionsReforme': decisionsReforme
          .map((e) => DecisionReformeModel.fromEntity(e).toJson())
          .toList(),
      'controleFinService': controleFinService != null
          ? ControleFinServiceModel.fromEntity(controleFinService!).toJson()
          : null,
      'historiquePoids': historiquePoids
          .map((e) => HistoriquePoidsModel.fromEntity(e).toJson())
          .toList(),
    };
  }

  /// Crée un SapeurPompierModel depuis une ligne de base de données SQLite
  /// Note: Cette méthode ne charge que les données de base du sapeur-pompier
  /// Les relations doivent être chargées séparément par le repository
  factory SapeurPompierModel.fromDatabase(Map<String, dynamic> map) {
    return SapeurPompierModel(
      id: map['id'] as String,
      matricule: map['matricule'] as String,
      createdAt: DateTime.parse(map['created_at'] as String),
      updatedAt: DateTime.parse(map['updated_at'] as String),
      createdBy: map['created_by'] as String?,
      updatedBy: map['updated_by'] as String?,
    );
  }

  /// Convertit SapeurPompierModel vers format base de données SQLite
  /// Note: Cette méthode ne retourne que les données de base du sapeur-pompier
  /// Les relations doivent être sauvegardées séparément par le repository
  Map<String, dynamic> toDatabase() {
    return {
      'id': id,
      'matricule': matricule,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'created_by': createdBy,
      'updated_by': updatedBy,
    };
  }

  /// Crée un SapeurPompierModel depuis une entité SapeurPompier
  factory SapeurPompierModel.fromEntity(SapeurPompier sapeur) {
    return SapeurPompierModel(
      id: sapeur.id,
      matricule: sapeur.matricule,
      createdAt: sapeur.createdAt,
      updatedAt: sapeur.updatedAt,
      createdBy: sapeur.createdBy,
      updatedBy: sapeur.updatedBy,
      etatCivil: sapeur.etatCivil,
      constantes: sapeur.constantes,
      examenIncorporation: sapeur.examenIncorporation,
      operations: sapeur.operations,
      vaccinations: sapeur.vaccinations,
      visitesSanitaires: sapeur.visitesSanitaires,
      indisponibilites: sapeur.indisponibilites,
      certificats: sapeur.certificats,
      decisionsReforme: sapeur.decisionsReforme,
      controleFinService: sapeur.controleFinService,
      historiquePoids: sapeur.historiquePoids,
    );
  }

  /// Crée une copie avec les relations chargées
  SapeurPompierModel withRelations({
    EtatCivilModel? etatCivil,
    ConstantesModel? constantes,
    ExamenIncorporationModel? examenIncorporation,
    List<OperationModel>? operations,
    List<VaccinationModel>? vaccinations,
    List<VisiteSanitaireModel>? visitesSanitaires,
    List<IndisponibiliteModel>? indisponibilites,
    List<CertificatModel>? certificats,
    List<DecisionReformeModel>? decisionsReforme,
    ControleFinServiceModel? controleFinService,
    List<HistoriquePoidsModel>? historiquePoids,
  }) {
    return SapeurPompierModel(
      id: id,
      matricule: matricule,
      createdAt: createdAt,
      updatedAt: updatedAt,
      createdBy: createdBy,
      updatedBy: updatedBy,
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
