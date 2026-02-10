import 'package:dartz/dartz.dart';
import 'package:logger/logger.dart';
import 'package:sapeur_pompier_manager/core/errors/failures.dart';
import 'package:sapeur_pompier_manager/domain/repositories/sapeur_pompier_repository.dart';
import 'package:sapeur_pompier_manager/domain/entities/sapeur_pompier.dart';
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
import 'package:sapeur_pompier_manager/data/datasources/local_database.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';
import 'package:sapeur_pompier_manager/data/models/sapeur_pompier_model.dart';
import 'package:sapeur_pompier_manager/data/models/etat_civil_model.dart';
import 'package:sapeur_pompier_manager/data/models/constantes_model.dart';
import 'package:sapeur_pompier_manager/data/models/examen_incorporation_model.dart';
import 'package:sapeur_pompier_manager/data/models/operation_model.dart';
import 'package:sapeur_pompier_manager/data/models/vaccination_model.dart';
import 'package:sapeur_pompier_manager/data/models/visite_sanitaire_model.dart';
import 'package:sapeur_pompier_manager/data/models/indisponibilite_model.dart';
import 'package:sapeur_pompier_manager/data/models/certificat_model.dart';
import 'package:sapeur_pompier_manager/data/models/decision_reforme_model.dart';
import 'package:sapeur_pompier_manager/data/models/controle_fin_service_model.dart';

/// Implémentation du repository pour les opérations sur les sapeurs-pompiers
class SapeurPompierRepositoryImpl implements SapeurPompierRepository {
  final LocalDatabase _database;
  final Logger _logger = Logger();

  SapeurPompierRepositoryImpl({required LocalDatabase database})
      : _database = database;

  // ============================================================================
  // SAPEUR-POMPIER - Opérations CRUD de base
  // ============================================================================

  @override
  Future<Either<Failure, List<SapeurPompier>>> getAllSapeursPompiers() async {
    try {
      final db = await _database.database;
      final results = await db.query('sapeurs_pompiers');

      final sapeursPompiers = <SapeurPompierModel>[];
      for (final row in results) {
        final sapeurPompier = SapeurPompierModel.fromDatabase(row);
        // Charger toutes les relations
        final sapeurWithRelations = await _loadAllRelations(sapeurPompier);
        sapeursPompiers.add(sapeurWithRelations);
      }

      return Right(sapeursPompiers);
    } catch (e) {
      _logger.e('Erreur lors de la récupération des sapeurs-pompiers: $e');
      return Left(DatabaseFailure('Erreur lors de la récupération des sapeurs-pompiers: $e'));
    }
  }

  @override
  Future<Either<Failure, SapeurPompier>> getSapeurPompierById(String id) async {
    try {
      final db = await _database.database;
      final results = await db.query(
        'sapeurs_pompiers',
        where: 'id = ?',
        whereArgs: [id],
      );

      if (results.isEmpty) {
        return const Left(NotFoundFailure('Sapeur-pompier non trouvé'));
      }

      final sapeurPompier = SapeurPompierModel.fromDatabase(results.first);
      // Charger toutes les relations
      final sapeurWithRelations = await _loadAllRelations(sapeurPompier);

      return Right(sapeurWithRelations);
    } catch (e) {
      _logger.e('Erreur lors de la récupération du sapeur-pompier: $e');
      return Left(DatabaseFailure('Erreur lors de la récupération du sapeur-pompier: $e'));
    }
  }

  @override
  Future<Either<Failure, SapeurPompier>> getSapeurPompierByMatricule(
      String matricule) async {
    try {
      final db = await _database.database;
      final results = await db.query(
        'sapeurs_pompiers',
        where: 'matricule = ?',
        whereArgs: [matricule],
      );

      if (results.isEmpty) {
        return const Left(NotFoundFailure('Sapeur-pompier non trouvé'));
      }

      final sapeurPompier = SapeurPompierModel.fromDatabase(results.first);
      // Charger toutes les relations
      final sapeurWithRelations = await _loadAllRelations(sapeurPompier);

      return Right(sapeurWithRelations);
    } catch (e) {
      _logger.e('Erreur lors de la récupération du sapeur-pompier par matricule: $e');
      return Left(DatabaseFailure('Erreur lors de la récupération du sapeur-pompier: $e'));
    }
  }

  @override
  Future<Either<Failure, SapeurPompier>> createSapeurPompier(
      SapeurPompier sapeurPompier) async {
    try {
      final db = await _database.database;
      final model = SapeurPompierModel.fromEntity(sapeurPompier);

      // Vérifier si le matricule existe déjà
      final existing = await db.query(
        'sapeurs_pompiers',
        where: 'matricule = ?',
        whereArgs: [model.matricule],
      );

      if (existing.isNotEmpty) {
        return const Left(ConflictFailure('Un sapeur-pompier avec ce matricule existe déjà'));
      }

      // Insérer uniquement les données de base (sans les relations)
      await db.insert('sapeurs_pompiers', model.toDatabase());

      _logger.i('Sapeur-pompier créé avec succès: ${model.id}');
      return Right(model);
    } catch (e) {
      _logger.e('Erreur lors de la création du sapeur-pompier: $e');
      return Left(DatabaseFailure('Erreur lors de la création du sapeur-pompier: $e'));
    }
  }

  @override
  Future<Either<Failure, SapeurPompier>> updateSapeurPompier(
      SapeurPompier sapeurPompier) async {
    try {
      final db = await _database.database;
      final model = SapeurPompierModel.fromEntity(sapeurPompier);

      // Vérifier si le sapeur-pompier existe
      final existing = await db.query(
        'sapeurs_pompiers',
        where: 'id = ?',
        whereArgs: [model.id],
      );

      if (existing.isEmpty) {
        return const Left(NotFoundFailure('Sapeur-pompier non trouvé'));
      }

      // Mettre à jour uniquement les données de base
      await db.update(
        'sapeurs_pompiers',
        model.toDatabase(),
        where: 'id = ?',
        whereArgs: [model.id],
      );

      _logger.i('Sapeur-pompier mis à jour avec succès: ${model.id}');
      return Right(model);
    } catch (e) {
      _logger.e('Erreur lors de la mise à jour du sapeur-pompier: $e');
      return Left(DatabaseFailure('Erreur lors de la mise à jour du sapeur-pompier: $e'));
    }
  }

  @override
  Future<Either<Failure, void>> deleteSapeurPompier(String id) async {
    try {
      final db = await _database.database;

      // Vérifier si le sapeur-pompier existe
      final existing = await db.query(
        'sapeurs_pompiers',
        where: 'id = ?',
        whereArgs: [id],
      );

      if (existing.isEmpty) {
        return const Left(NotFoundFailure('Sapeur-pompier non trouvé'));
      }

      // La suppression en cascade est gérée par la base de données
      await db.delete(
        'sapeurs_pompiers',
        where: 'id = ?',
        whereArgs: [id],
      );

      _logger.i('Sapeur-pompier supprimé avec succès: $id');
      return const Right(null);
    } catch (e) {
      _logger.e('Erreur lors de la suppression du sapeur-pompier: $e');
      return Left(DatabaseFailure('Erreur lors de la suppression du sapeur-pompier: $e'));
    }
  }

  @override
  Future<Either<Failure, List<SapeurPompier>>> searchSapeursPompiers(
      String query) async {
    try {
      final db = await _database.database;

      // Rechercher dans les sapeurs-pompiers
      final results = await db.rawQuery('''
        SELECT DISTINCT sp.*
        FROM sapeurs_pompiers sp
        LEFT JOIN etat_civil ec ON sp.id = ec.sapeur_pompier_id
        WHERE sp.matricule LIKE ?
          OR LOWER(ec.nom) LIKE LOWER(?)
          OR LOWER(ec.prenoms) LIKE LOWER(?)
      ''', ['%$query%', '%$query%', '%$query%']);

      final sapeursPompiers = <SapeurPompierModel>[];
      for (final row in results) {
        final sapeurPompier = SapeurPompierModel.fromDatabase(row);
        final sapeurWithRelations = await _loadAllRelations(sapeurPompier);
        sapeursPompiers.add(sapeurWithRelations);
      }

      return Right(sapeursPompiers);
    } catch (e) {
      _logger.e('Erreur lors de la recherche de sapeurs-pompiers: $e');
      return Left(DatabaseFailure('Erreur lors de la recherche: $e'));
    }
  }

  // ============================================================================
  // ÉTAT CIVIL
  // ============================================================================

  @override
  Future<Either<Failure, EtatCivil>> saveEtatCivil(EtatCivil etatCivil) async {
    try {
      final db = await _database.database;
      final model = EtatCivilModel.fromEntity(etatCivil);

      // INSERT OR REPLACE
      await db.insert(
        'etat_civil',
        model.toDatabase(),
        conflictAlgorithm: ConflictAlgorithm.replace,
      );

      _logger.i('État civil sauvegardé avec succès: ${model.id}');
      return Right(model);
    } catch (e) {
      _logger.e('Erreur lors de la sauvegarde de l\'état civil: $e');
      return Left(DatabaseFailure('Erreur lors de la sauvegarde de l\'état civil: $e'));
    }
  }

  @override
  Future<Either<Failure, EtatCivil?>> getEtatCivil(String sapeurPompierId) async {
    try {
      final db = await _database.database;
      final results = await db.query(
        'etat_civil',
        where: 'sapeur_pompier_id = ?',
        whereArgs: [sapeurPompierId],
      );

      if (results.isEmpty) {
        return const Right(null);
      }

      final etatCivil = EtatCivilModel.fromDatabase(results.first);
      return Right(etatCivil);
    } catch (e) {
      _logger.e('Erreur lors de la récupération de l\'état civil: $e');
      return Left(DatabaseFailure('Erreur lors de la récupération de l\'état civil: $e'));
    }
  }

  // ============================================================================
  // CONSTANTES
  // ============================================================================

  @override
  Future<Either<Failure, Constantes>> saveConstantes(Constantes constantes) async {
    try {
      final db = await _database.database;
      final model = ConstantesModel.fromEntity(constantes);

      // INSERT OR REPLACE
      await db.insert(
        'constantes',
        model.toDatabase(),
        conflictAlgorithm: ConflictAlgorithm.replace,
      );

      _logger.i('Constantes sauvegardées avec succès: ${model.id}');
      return Right(model);
    } catch (e) {
      _logger.e('Erreur lors de la sauvegarde des constantes: $e');
      return Left(DatabaseFailure('Erreur lors de la sauvegarde des constantes: $e'));
    }
  }

  @override
  Future<Either<Failure, Constantes?>> getConstantes(String sapeurPompierId) async {
    try {
      final db = await _database.database;
      final results = await db.query(
        'constantes',
        where: 'sapeur_pompier_id = ?',
        whereArgs: [sapeurPompierId],
      );

      if (results.isEmpty) {
        return const Right(null);
      }

      final constantes = ConstantesModel.fromDatabase(results.first);
      return Right(constantes);
    } catch (e) {
      _logger.e('Erreur lors de la récupération des constantes: $e');
      return Left(DatabaseFailure('Erreur lors de la récupération des constantes: $e'));
    }
  }

  @override
  Future<Either<Failure, List<HistoriquePoids>>> getHistoriquePoids(
      String sapeurPompierId) async {
    try {
      final db = await _database.database;
      final results = await db.query(
        'historique_poids',
        where: 'sapeur_pompier_id = ?',
        whereArgs: [sapeurPompierId],
        orderBy: 'annee DESC',
      );

      final historique = results
          .map((row) => HistoriquePoidsModel.fromDatabase(row))
          .toList();

      return Right(historique);
    } catch (e) {
      _logger.e('Erreur lors de la récupération de l\'historique de poids: $e');
      return Left(DatabaseFailure('Erreur lors de la récupération de l\'historique: $e'));
    }
  }

  @override
  Future<Either<Failure, HistoriquePoids>> saveHistoriquePoids(
      HistoriquePoids historique) async {
    try {
      final db = await _database.database;
      final model = HistoriquePoidsModel.fromEntity(historique);

      // INSERT OR REPLACE
      await db.insert(
        'historique_poids',
        model.toDatabase(),
        conflictAlgorithm: ConflictAlgorithm.replace,
      );

      _logger.i('Historique de poids sauvegardé avec succès: ${model.id}');
      return Right(model);
    } catch (e) {
      _logger.e('Erreur lors de la sauvegarde de l\'historique de poids: $e');
      return Left(DatabaseFailure('Erreur lors de la sauvegarde de l\'historique: $e'));
    }
  }

  // ============================================================================
  // EXAMEN INCORPORATION
  // ============================================================================

  @override
  Future<Either<Failure, ExamenIncorporation>> saveExamenIncorporation(
      ExamenIncorporation examen) async {
    try {
      final db = await _database.database;
      final model = ExamenIncorporationModel.fromEntity(examen);

      // INSERT OR REPLACE
      await db.insert(
        'examens_incorporation',
        model.toDatabase(),
        conflictAlgorithm: ConflictAlgorithm.replace,
      );

      _logger.i('Examen d\'incorporation sauvegardé avec succès: ${model.id}');
      return Right(model);
    } catch (e) {
      _logger.e('Erreur lors de la sauvegarde de l\'examen d\'incorporation: $e');
      return Left(DatabaseFailure('Erreur lors de la sauvegarde de l\'examen: $e'));
    }
  }

  @override
  Future<Either<Failure, ExamenIncorporation?>> getExamenIncorporation(
      String sapeurPompierId) async {
    try {
      final db = await _database.database;
      final results = await db.query(
        'examens_incorporation',
        where: 'sapeur_pompier_id = ?',
        whereArgs: [sapeurPompierId],
      );

      if (results.isEmpty) {
        return const Right(null);
      }

      final examen = ExamenIncorporationModel.fromDatabase(results.first);
      return Right(examen);
    } catch (e) {
      _logger.e('Erreur lors de la récupération de l\'examen d\'incorporation: $e');
      return Left(DatabaseFailure('Erreur lors de la récupération de l\'examen: $e'));
    }
  }

  // ============================================================================
  // OPÉRATIONS
  // ============================================================================

  @override
  Future<Either<Failure, Operation>> saveOperation(Operation operation) async {
    try {
      final db = await _database.database;
      final model = OperationModel.fromEntity(operation);

      // INSERT OR REPLACE
      await db.insert(
        'operations',
        model.toDatabase(),
        conflictAlgorithm: ConflictAlgorithm.replace,
      );

      _logger.i('Opération sauvegardée avec succès: ${model.id}');
      return Right(model);
    } catch (e) {
      _logger.e('Erreur lors de la sauvegarde de l\'opération: $e');
      return Left(DatabaseFailure('Erreur lors de la sauvegarde de l\'opération: $e'));
    }
  }

  @override
  Future<Either<Failure, List<Operation>>> getOperations(
      String sapeurPompierId) async {
    try {
      final db = await _database.database;
      final results = await db.query(
        'operations',
        where: 'sapeur_pompier_id = ?',
        whereArgs: [sapeurPompierId],
        orderBy: 'numero_sejour DESC',
      );

      final operations = results
          .map((row) => OperationModel.fromDatabase(row))
          .toList();

      return Right(operations);
    } catch (e) {
      _logger.e('Erreur lors de la récupération des opérations: $e');
      return Left(DatabaseFailure('Erreur lors de la récupération des opérations: $e'));
    }
  }

  @override
  Future<Either<Failure, void>> deleteOperation(String id) async {
    try {
      final db = await _database.database;
      await db.delete(
        'operations',
        where: 'id = ?',
        whereArgs: [id],
      );

      _logger.i('Opération supprimée avec succès: $id');
      return const Right(null);
    } catch (e) {
      _logger.e('Erreur lors de la suppression de l\'opération: $e');
      return Left(DatabaseFailure('Erreur lors de la suppression de l\'opération: $e'));
    }
  }

  // ============================================================================
  // VACCINATIONS
  // ============================================================================

  @override
  Future<Either<Failure, Vaccination>> saveVaccination(
      Vaccination vaccination) async {
    try {
      final db = await _database.database;
      final model = VaccinationModel.fromEntity(vaccination);

      // INSERT OR REPLACE
      await db.insert(
        'vaccinations',
        model.toDatabase(),
        conflictAlgorithm: ConflictAlgorithm.replace,
      );

      _logger.i('Vaccination sauvegardée avec succès: ${model.id}');
      return Right(model);
    } catch (e) {
      _logger.e('Erreur lors de la sauvegarde de la vaccination: $e');
      return Left(DatabaseFailure('Erreur lors de la sauvegarde de la vaccination: $e'));
    }
  }

  @override
  Future<Either<Failure, List<Vaccination>>> getVaccinations(
      String sapeurPompierId) async {
    try {
      final db = await _database.database;
      final results = await db.query(
        'vaccinations',
        where: 'sapeur_pompier_id = ?',
        whereArgs: [sapeurPompierId],
        orderBy: 'date_vaccination DESC',
      );

      final vaccinations = results
          .map((row) => VaccinationModel.fromDatabase(row))
          .toList();

      return Right(vaccinations);
    } catch (e) {
      _logger.e('Erreur lors de la récupération des vaccinations: $e');
      return Left(DatabaseFailure('Erreur lors de la récupération des vaccinations: $e'));
    }
  }

  @override
  Future<Either<Failure, void>> deleteVaccination(String id) async {
    try {
      final db = await _database.database;
      await db.delete(
        'vaccinations',
        where: 'id = ?',
        whereArgs: [id],
      );

      _logger.i('Vaccination supprimée avec succès: $id');
      return const Right(null);
    } catch (e) {
      _logger.e('Erreur lors de la suppression de la vaccination: $e');
      return Left(DatabaseFailure('Erreur lors de la suppression de la vaccination: $e'));
    }
  }

  @override
  Future<Either<Failure, List<Vaccination>>> getVaccinationsExpirees() async {
    try {
      final db = await _database.database;
      final now = DateTime.now().toIso8601String();

      final results = await db.query(
        'vaccinations',
        where: 'date_rappel IS NOT NULL AND date_rappel < ?',
        whereArgs: [now],
        orderBy: 'date_rappel ASC',
      );

      final vaccinations = results
          .map((row) => VaccinationModel.fromDatabase(row))
          .toList();

      return Right(vaccinations);
    } catch (e) {
      _logger.e('Erreur lors de la récupération des vaccinations expirées: $e');
      return Left(DatabaseFailure('Erreur lors de la récupération des vaccinations expirées: $e'));
    }
  }

  @override
  Future<Either<Failure, List<Vaccination>>> getVaccinationsProchesExpiration() async {
    try {
      final db = await _database.database;
      final now = DateTime.now();
      final dateLimit = now.add(const Duration(days: 30)).toIso8601String();
      final nowStr = now.toIso8601String();

      final results = await db.query(
        'vaccinations',
        where: 'date_rappel IS NOT NULL AND date_rappel >= ? AND date_rappel <= ?',
        whereArgs: [nowStr, dateLimit],
        orderBy: 'date_rappel ASC',
      );

      final vaccinations = results
          .map((row) => VaccinationModel.fromDatabase(row))
          .toList();

      return Right(vaccinations);
    } catch (e) {
      _logger.e('Erreur lors de la récupération des vaccinations proches de l\'expiration: $e');
      return Left(DatabaseFailure('Erreur lors de la récupération des vaccinations: $e'));
    }
  }

  // ============================================================================
  // VISITES SANITAIRES
  // ============================================================================

  @override
  Future<Either<Failure, VisiteSanitaire>> saveVisiteSanitaire(
      VisiteSanitaire visite) async {
    try {
      final db = await _database.database;
      final model = VisiteSanitaireModel.fromEntity(visite);

      // INSERT OR REPLACE
      await db.insert(
        'visites_sanitaires',
        model.toDatabase(),
        conflictAlgorithm: ConflictAlgorithm.replace,
      );

      _logger.i('Visite sanitaire sauvegardée avec succès: ${model.id}');
      return Right(model);
    } catch (e) {
      _logger.e('Erreur lors de la sauvegarde de la visite sanitaire: $e');
      return Left(DatabaseFailure('Erreur lors de la sauvegarde de la visite: $e'));
    }
  }

  @override
  Future<Either<Failure, List<VisiteSanitaire>>> getVisitesSanitaires(
      String sapeurPompierId) async {
    try {
      final db = await _database.database;
      final results = await db.query(
        'visites_sanitaires',
        where: 'sapeur_pompier_id = ?',
        whereArgs: [sapeurPompierId],
        orderBy: 'date_visite DESC',
      );

      final visites = results
          .map((row) => VisiteSanitaireModel.fromDatabase(row))
          .toList();

      return Right(visites);
    } catch (e) {
      _logger.e('Erreur lors de la récupération des visites sanitaires: $e');
      return Left(DatabaseFailure('Erreur lors de la récupération des visites: $e'));
    }
  }

  @override
  Future<Either<Failure, void>> deleteVisiteSanitaire(String id) async {
    try {
      final db = await _database.database;
      await db.delete(
        'visites_sanitaires',
        where: 'id = ?',
        whereArgs: [id],
      );

      _logger.i('Visite sanitaire supprimée avec succès: $id');
      return const Right(null);
    } catch (e) {
      _logger.e('Erreur lors de la suppression de la visite sanitaire: $e');
      return Left(DatabaseFailure('Erreur lors de la suppression de la visite: $e'));
    }
  }

  // ============================================================================
  // INDISPONIBILITÉS
  // ============================================================================

  @override
  Future<Either<Failure, Indisponibilite>> saveIndisponibilite(
      Indisponibilite indisponibilite) async {
    try {
      final db = await _database.database;
      final model = IndisponibiliteModel.fromEntity(indisponibilite);

      // INSERT OR REPLACE
      await db.insert(
        'indisponibilites',
        model.toDatabase(),
        conflictAlgorithm: ConflictAlgorithm.replace,
      );

      _logger.i('Indisponibilité sauvegardée avec succès: ${model.id}');
      return Right(model);
    } catch (e) {
      _logger.e('Erreur lors de la sauvegarde de l\'indisponibilité: $e');
      return Left(DatabaseFailure('Erreur lors de la sauvegarde de l\'indisponibilité: $e'));
    }
  }

  @override
  Future<Either<Failure, List<Indisponibilite>>> getIndisponibilites(
      String sapeurPompierId) async {
    try {
      final db = await _database.database;
      final results = await db.query(
        'indisponibilites',
        where: 'sapeur_pompier_id = ?',
        whereArgs: [sapeurPompierId],
        orderBy: 'date_debut DESC',
      );

      final indisponibilites = results
          .map((row) => IndisponibiliteModel.fromDatabase(row))
          .toList();

      return Right(indisponibilites);
    } catch (e) {
      _logger.e('Erreur lors de la récupération des indisponibilités: $e');
      return Left(DatabaseFailure('Erreur lors de la récupération des indisponibilités: $e'));
    }
  }

  @override
  Future<Either<Failure, void>> deleteIndisponibilite(String id) async {
    try {
      final db = await _database.database;
      await db.delete(
        'indisponibilites',
        where: 'id = ?',
        whereArgs: [id],
      );

      _logger.i('Indisponibilité supprimée avec succès: $id');
      return const Right(null);
    } catch (e) {
      _logger.e('Erreur lors de la suppression de l\'indisponibilité: $e');
      return Left(DatabaseFailure('Erreur lors de la suppression de l\'indisponibilité: $e'));
    }
  }

  @override
  Future<Either<Failure, List<Indisponibilite>>> getIndisponibilitesEnCours() async {
    try {
      final db = await _database.database;
      final now = DateTime.now().toIso8601String();

      final results = await db.query(
        'indisponibilites',
        where: 'date_debut <= ? AND date_fin >= ?',
        whereArgs: [now, now],
        orderBy: 'date_debut DESC',
      );

      final indisponibilites = results
          .map((row) => IndisponibiliteModel.fromDatabase(row))
          .toList();

      return Right(indisponibilites);
    } catch (e) {
      _logger.e('Erreur lors de la récupération des indisponibilités en cours: $e');
      return Left(DatabaseFailure('Erreur lors de la récupération des indisponibilités: $e'));
    }
  }

  // ============================================================================
  // CERTIFICATS
  // ============================================================================

  @override
  Future<Either<Failure, Certificat>> saveCertificat(Certificat certificat) async {
    try {
      final db = await _database.database;
      final model = CertificatModel.fromEntity(certificat);

      // INSERT OR REPLACE
      await db.insert(
        'certificats',
        model.toDatabase(),
        conflictAlgorithm: ConflictAlgorithm.replace,
      );

      _logger.i('Certificat sauvegardé avec succès: ${model.id}');
      return Right(model);
    } catch (e) {
      _logger.e('Erreur lors de la sauvegarde du certificat: $e');
      return Left(DatabaseFailure('Erreur lors de la sauvegarde du certificat: $e'));
    }
  }

  @override
  Future<Either<Failure, List<Certificat>>> getCertificats(
      String sapeurPompierId) async {
    try {
      final db = await _database.database;
      final results = await db.query(
        'certificats',
        where: 'sapeur_pompier_id = ?',
        whereArgs: [sapeurPompierId],
        orderBy: 'date_certificat DESC',
      );

      final certificats = results
          .map((row) => CertificatModel.fromDatabase(row))
          .toList();

      return Right(certificats);
    } catch (e) {
      _logger.e('Erreur lors de la récupération des certificats: $e');
      return Left(DatabaseFailure('Erreur lors de la récupération des certificats: $e'));
    }
  }

  @override
  Future<Either<Failure, void>> deleteCertificat(String id) async {
    try {
      final db = await _database.database;
      await db.delete(
        'certificats',
        where: 'id = ?',
        whereArgs: [id],
      );

      _logger.i('Certificat supprimé avec succès: $id');
      return const Right(null);
    } catch (e) {
      _logger.e('Erreur lors de la suppression du certificat: $e');
      return Left(DatabaseFailure('Erreur lors de la suppression du certificat: $e'));
    }
  }

  // ============================================================================
  // DÉCISIONS DE RÉFORME
  // ============================================================================

  @override
  Future<Either<Failure, DecisionReforme>> saveDecisionReforme(
      DecisionReforme decision) async {
    try {
      final db = await _database.database;
      final model = DecisionReformeModel.fromEntity(decision);

      // INSERT OR REPLACE
      await db.insert(
        'decisions_reforme',
        model.toDatabase(),
        conflictAlgorithm: ConflictAlgorithm.replace,
      );

      _logger.i('Décision de réforme sauvegardée avec succès: ${model.id}');
      return Right(model);
    } catch (e) {
      _logger.e('Erreur lors de la sauvegarde de la décision de réforme: $e');
      return Left(DatabaseFailure('Erreur lors de la sauvegarde de la décision: $e'));
    }
  }

  @override
  Future<Either<Failure, List<DecisionReforme>>> getDecisionsReforme(
      String sapeurPompierId) async {
    try {
      final db = await _database.database;
      final results = await db.query(
        'decisions_reforme',
        where: 'sapeur_pompier_id = ?',
        whereArgs: [sapeurPompierId],
        orderBy: 'date_decision DESC',
      );

      final decisions = results
          .map((row) => DecisionReformeModel.fromDatabase(row))
          .toList();

      return Right(decisions);
    } catch (e) {
      _logger.e('Erreur lors de la récupération des décisions de réforme: $e');
      return Left(DatabaseFailure('Erreur lors de la récupération des décisions: $e'));
    }
  }

  @override
  Future<Either<Failure, void>> deleteDecisionReforme(String id) async {
    try {
      final db = await _database.database;
      await db.delete(
        'decisions_reforme',
        where: 'id = ?',
        whereArgs: [id],
      );

      _logger.i('Décision de réforme supprimée avec succès: $id');
      return const Right(null);
    } catch (e) {
      _logger.e('Erreur lors de la suppression de la décision de réforme: $e');
      return Left(DatabaseFailure('Erreur lors de la suppression de la décision: $e'));
    }
  }

  // ============================================================================
  // CONTRÔLE FIN DE SERVICE
  // ============================================================================

  @override
  Future<Either<Failure, ControleFinService>> saveControleFinService(
      ControleFinService controle) async {
    try {
      final db = await _database.database;
      final model = ControleFinServiceModel.fromEntity(controle);

      // INSERT OR REPLACE
      await db.insert(
        'controles_fin_service',
        model.toDatabase(),
        conflictAlgorithm: ConflictAlgorithm.replace,
      );

      _logger.i('Contrôle de fin de service sauvegardé avec succès: ${model.id}');
      return Right(model);
    } catch (e) {
      _logger.e('Erreur lors de la sauvegarde du contrôle de fin de service: $e');
      return Left(DatabaseFailure('Erreur lors de la sauvegarde du contrôle: $e'));
    }
  }

  @override
  Future<Either<Failure, ControleFinService?>> getControleFinService(
      String sapeurPompierId) async {
    try {
      final db = await _database.database;
      final results = await db.query(
        'controles_fin_service',
        where: 'sapeur_pompier_id = ?',
        whereArgs: [sapeurPompierId],
      );

      if (results.isEmpty) {
        return const Right(null);
      }

      final controle = ControleFinServiceModel.fromDatabase(results.first);
      return Right(controle);
    } catch (e) {
      _logger.e('Erreur lors de la récupération du contrôle de fin de service: $e');
      return Left(DatabaseFailure('Erreur lors de la récupération du contrôle: $e'));
    }
  }

  // ============================================================================
  // STATISTIQUES
  // ============================================================================

  @override
  Future<Either<Failure, Map<String, dynamic>>> getStatistiques() async {
    try {
      final db = await _database.database;

      // Total de sapeurs-pompiers
      final totalResult = await db.rawQuery(
        'SELECT COUNT(*) as total FROM sapeurs_pompiers',
      );
      final total = totalResult.first['total'] as int;

      // Sapeurs-pompiers aptes (ayant un examen avec décision "Apte")
      final aptesResult = await db.rawQuery('''
        SELECT COUNT(DISTINCT ei.sapeur_pompier_id) as count
        FROM examens_incorporation ei
        WHERE LOWER(ei.decision) LIKE '%apte%'
      ''');
      final aptes = aptesResult.first['count'] as int;

      // Sapeurs-pompiers inaptes
      final inaptesResult = await db.rawQuery('''
        SELECT COUNT(DISTINCT ei.sapeur_pompier_id) as count
        FROM examens_incorporation ei
        WHERE LOWER(ei.decision) LIKE '%inapte%'
      ''');
      final inaptes = inaptesResult.first['count'] as int;

      // Vaccins expirés
      final now = DateTime.now().toIso8601String();
      final vaccinsExpiresResult = await db.rawQuery('''
        SELECT COUNT(*) as count
        FROM vaccinations
        WHERE date_rappel IS NOT NULL AND date_rappel < ?
      ''', [now]);
      final vaccinsExpires = vaccinsExpiresResult.first['count'] as int;

      // Vaccins proches de l'expiration (30 jours)
      final dateLimit = DateTime.now().add(const Duration(days: 30)).toIso8601String();
      final vaccinsProchesResult = await db.rawQuery('''
        SELECT COUNT(*) as count
        FROM vaccinations
        WHERE date_rappel IS NOT NULL AND date_rappel >= ? AND date_rappel <= ?
      ''', [now, dateLimit]);
      final vaccinsProches = vaccinsProchesResult.first['count'] as int;

      // Indisponibilités en cours
      final indisponibilitesResult = await db.rawQuery('''
        SELECT COUNT(*) as count
        FROM indisponibilites
        WHERE date_debut <= ? AND date_fin >= ?
      ''', [now, now]);
      final indisponibilites = indisponibilitesResult.first['count'] as int;

      // Opérations en cours (départ sans retour)
      final operationsResult = await db.rawQuery('''
        SELECT COUNT(*) as count
        FROM operations
        WHERE date_depart IS NOT NULL AND date_retour IS NULL
      ''');
      final operationsEnCours = operationsResult.first['count'] as int;

      final statistiques = {
        'total': total,
        'aptes': aptes,
        'inaptes': inaptes,
        'vaccinsExpires': vaccinsExpires,
        'vaccinsProchesExpiration': vaccinsProches,
        'indisponibilites': indisponibilites,
        'operationsEnCours': operationsEnCours,
      };

      return Right(statistiques);
    } catch (e) {
      _logger.e('Erreur lors de la récupération des statistiques: $e');
      return Left(DatabaseFailure('Erreur lors de la récupération des statistiques: $e'));
    }
  }

  // ============================================================================
  // MÉTHODES PRIVÉES - Chargement des relations
  // ============================================================================

  /// Charge toutes les relations d'un sapeur-pompier
  Future<SapeurPompierModel> _loadAllRelations(
      SapeurPompierModel sapeurPompier) async {
    final db = await _database.database;

    // Charger l'état civil
    EtatCivilModel? etatCivil;
    final etatCivilResults = await db.query(
      'etat_civil',
      where: 'sapeur_pompier_id = ?',
      whereArgs: [sapeurPompier.id],
    );
    if (etatCivilResults.isNotEmpty) {
      etatCivil = EtatCivilModel.fromDatabase(etatCivilResults.first);
    }

    // Charger les constantes
    ConstantesModel? constantes;
    final constantesResults = await db.query(
      'constantes',
      where: 'sapeur_pompier_id = ?',
      whereArgs: [sapeurPompier.id],
    );
    if (constantesResults.isNotEmpty) {
      constantes = ConstantesModel.fromDatabase(constantesResults.first);
    }

    // Charger l'examen d'incorporation
    ExamenIncorporationModel? examenIncorporation;
    final examenResults = await db.query(
      'examens_incorporation',
      where: 'sapeur_pompier_id = ?',
      whereArgs: [sapeurPompier.id],
    );
    if (examenResults.isNotEmpty) {
      examenIncorporation = ExamenIncorporationModel.fromDatabase(examenResults.first);
    }

    // Charger les opérations
    final operationsResults = await db.query(
      'operations',
      where: 'sapeur_pompier_id = ?',
      whereArgs: [sapeurPompier.id],
      orderBy: 'numero_sejour DESC',
    );
    final operations = operationsResults
        .map((row) => OperationModel.fromDatabase(row))
        .toList();

    // Charger les vaccinations
    final vaccinationsResults = await db.query(
      'vaccinations',
      where: 'sapeur_pompier_id = ?',
      whereArgs: [sapeurPompier.id],
      orderBy: 'date_vaccination DESC',
    );
    final vaccinations = vaccinationsResults
        .map((row) => VaccinationModel.fromDatabase(row))
        .toList();

    // Charger les visites sanitaires
    final visitesResults = await db.query(
      'visites_sanitaires',
      where: 'sapeur_pompier_id = ?',
      whereArgs: [sapeurPompier.id],
      orderBy: 'date_visite DESC',
    );
    final visitesSanitaires = visitesResults
        .map((row) => VisiteSanitaireModel.fromDatabase(row))
        .toList();

    // Charger les indisponibilités
    final indisponibilitesResults = await db.query(
      'indisponibilites',
      where: 'sapeur_pompier_id = ?',
      whereArgs: [sapeurPompier.id],
      orderBy: 'date_debut DESC',
    );
    final indisponibilites = indisponibilitesResults
        .map((row) => IndisponibiliteModel.fromDatabase(row))
        .toList();

    // Charger les certificats
    final certificatsResults = await db.query(
      'certificats',
      where: 'sapeur_pompier_id = ?',
      whereArgs: [sapeurPompier.id],
      orderBy: 'date_certificat DESC',
    );
    final certificats = certificatsResults
        .map((row) => CertificatModel.fromDatabase(row))
        .toList();

    // Charger les décisions de réforme
    final decisionsResults = await db.query(
      'decisions_reforme',
      where: 'sapeur_pompier_id = ?',
      whereArgs: [sapeurPompier.id],
      orderBy: 'date_decision DESC',
    );
    final decisionsReforme = decisionsResults
        .map((row) => DecisionReformeModel.fromDatabase(row))
        .toList();

    // Charger le contrôle de fin de service
    ControleFinServiceModel? controleFinService;
    final controleResults = await db.query(
      'controles_fin_service',
      where: 'sapeur_pompier_id = ?',
      whereArgs: [sapeurPompier.id],
    );
    if (controleResults.isNotEmpty) {
      controleFinService = ControleFinServiceModel.fromDatabase(controleResults.first);
    }

    // Charger l'historique de poids
    final historiqueResults = await db.query(
      'historique_poids',
      where: 'sapeur_pompier_id = ?',
      whereArgs: [sapeurPompier.id],
      orderBy: 'annee DESC',
    );
    final historiquePoids = historiqueResults
        .map((row) => HistoriquePoidsModel.fromDatabase(row))
        .toList();

    // Retourner le sapeur-pompier avec toutes les relations chargées
    return sapeurPompier.withRelations(
      etatCivil: etatCivil,
      constantes: constantes,
      examenIncorporation: examenIncorporation,
      operations: operations,
      vaccinations: vaccinations,
      visitesSanitaires: visitesSanitaires,
      indisponibilites: indisponibilites,
      certificats: certificats,
      decisionsReforme: decisionsReforme,
      controleFinService: controleFinService,
      historiquePoids: historiquePoids,
    );
  }
}
