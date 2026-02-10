// Unit tests for sapeur-pompier domain use cases.
//
// Uses hand-written fakes (implementing the repository interface) so that
// this file has zero code-generation requirements and no extra pub packages.
//
// Use cases under test:
//   - CreateSapeurPompier   (lib/domain/usecases/create_sapeur_pompier.dart)
//   - GetAllSapeursPompiers (lib/domain/usecases/get_all_sapeurs_pompiers.dart)
//   - UpdateSapeurPompier   (lib/domain/usecases/update_sapeur_pompier.dart)
//
// Repository operations used directly (no dedicated use-case file exists yet):
//   - getSapeurPompierById
//   - searchSapeursPompiers
//   - saveVisiteSanitaire

import 'package:flutter_test/flutter_test.dart';
import 'package:dartz/dartz.dart';
import 'package:sapeur_pompier_manager/core/errors/failures.dart';
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
import 'package:sapeur_pompier_manager/domain/repositories/sapeur_pompier_repository.dart';
import 'package:sapeur_pompier_manager/domain/usecases/create_sapeur_pompier.dart';
import 'package:sapeur_pompier_manager/domain/usecases/get_all_sapeurs_pompiers.dart';
import 'package:sapeur_pompier_manager/domain/usecases/update_sapeur_pompier.dart';

// =============================================================================
// In-memory fake repository for tests
// =============================================================================

/// Fake repository that stores sapeurs-pompiers in a simple map.
/// Tests control which result is returned via [nextResult].
class FakeSapeurPompierRepository implements SapeurPompierRepository {
  // Backing store for the in-memory fake
  final Map<String, SapeurPompier> _store = {};

  // Override the next result for any operation
  Either<Failure, dynamic>? _nextResult;

  void setNextResult(Either<Failure, dynamic> result) {
    _nextResult = result;
  }

  void seed(SapeurPompier sp) => _store[sp.id] = sp;

  @override
  Future<Either<Failure, SapeurPompier>> createSapeurPompier(
      SapeurPompier sp) async {
    if (_nextResult != null) {
      final r = _nextResult!;
      _nextResult = null;
      return r as Either<Failure, SapeurPompier>;
    }
    if (_store.containsKey(sp.id)) {
      return const Left(
          ConflictFailure('Un sapeur-pompier avec ce matricule existe déjà'));
    }
    _store[sp.id] = sp;
    return Right(sp);
  }

  @override
  Future<Either<Failure, SapeurPompier>> getSapeurPompierById(String id) async {
    if (_nextResult != null) {
      final r = _nextResult!;
      _nextResult = null;
      return r as Either<Failure, SapeurPompier>;
    }
    final sp = _store[id];
    if (sp == null) {
      return const Left(NotFoundFailure('Sapeur-pompier introuvable'));
    }
    return Right(sp);
  }

  @override
  Future<Either<Failure, List<SapeurPompier>>> getAllSapeursPompiers() async {
    if (_nextResult != null) {
      final r = _nextResult!;
      _nextResult = null;
      return r as Either<Failure, List<SapeurPompier>>;
    }
    return Right(_store.values.toList());
  }

  @override
  Future<Either<Failure, List<SapeurPompier>>> searchSapeursPompiers(
      String query) async {
    if (_nextResult != null) {
      final r = _nextResult!;
      _nextResult = null;
      return r as Either<Failure, List<SapeurPompier>>;
    }
    final lower = query.toLowerCase();
    final results = _store.values.where((sp) {
      final nom = sp.etatCivil?.nomComplet.toLowerCase() ?? '';
      return nom.contains(lower) || sp.matricule.toLowerCase().contains(lower);
    }).toList();
    return Right(results);
  }

  @override
  Future<Either<Failure, SapeurPompier>> updateSapeurPompier(
      SapeurPompier sp) async {
    if (_nextResult != null) {
      final r = _nextResult!;
      _nextResult = null;
      return r as Either<Failure, SapeurPompier>;
    }
    if (!_store.containsKey(sp.id)) {
      return const Left(NotFoundFailure('Sapeur-pompier introuvable'));
    }
    _store[sp.id] = sp;
    return Right(sp);
  }

  @override
  Future<Either<Failure, void>> deleteSapeurPompier(String id) async =>
      const Right(null);

  @override
  Future<Either<Failure, SapeurPompier>> getSapeurPompierByMatricule(
          String matricule) async =>
      const Left(NotFoundFailure());

  @override
  Future<Either<Failure, EtatCivil>> saveEtatCivil(EtatCivil e) async =>
      Right(e);

  @override
  Future<Either<Failure, EtatCivil?>> getEtatCivil(String id) async =>
      const Right(null);

  @override
  Future<Either<Failure, Constantes>> saveConstantes(Constantes c) async =>
      Right(c);

  @override
  Future<Either<Failure, Constantes?>> getConstantes(String id) async =>
      const Right(null);

  @override
  Future<Either<Failure, List<HistoriquePoids>>> getHistoriquePoids(
          String id) async =>
      const Right([]);

  @override
  Future<Either<Failure, HistoriquePoids>> saveHistoriquePoids(
          HistoriquePoids h) async =>
      Right(h);

  @override
  Future<Either<Failure, ExamenIncorporation>> saveExamenIncorporation(
          ExamenIncorporation e) async =>
      Right(e);

  @override
  Future<Either<Failure, ExamenIncorporation?>> getExamenIncorporation(
          String id) async =>
      const Right(null);

  @override
  Future<Either<Failure, Operation>> saveOperation(Operation o) async =>
      Right(o);

  @override
  Future<Either<Failure, List<Operation>>> getOperations(String id) async =>
      const Right([]);

  @override
  Future<Either<Failure, void>> deleteOperation(String id) async =>
      const Right(null);

  @override
  Future<Either<Failure, Vaccination>> saveVaccination(Vaccination v) async =>
      Right(v);

  @override
  Future<Either<Failure, List<Vaccination>>> getVaccinations(String id) async =>
      const Right([]);

  @override
  Future<Either<Failure, void>> deleteVaccination(String id) async =>
      const Right(null);

  @override
  Future<Either<Failure, List<Vaccination>>>
      getVaccinationsExpirees() async => const Right([]);

  @override
  Future<Either<Failure, List<Vaccination>>>
      getVaccinationsProchesExpiration() async => const Right([]);

  @override
  Future<Either<Failure, VisiteSanitaire>> saveVisiteSanitaire(
      VisiteSanitaire v) async {
    if (_nextResult != null) {
      final r = _nextResult!;
      _nextResult = null;
      return r as Either<Failure, VisiteSanitaire>;
    }
    return Right(v);
  }

  @override
  Future<Either<Failure, List<VisiteSanitaire>>> getVisitesSanitaires(
          String id) async =>
      const Right([]);

  @override
  Future<Either<Failure, void>> deleteVisiteSanitaire(String id) async =>
      const Right(null);

  @override
  Future<Either<Failure, Indisponibilite>> saveIndisponibilite(
          Indisponibilite i) async =>
      Right(i);

  @override
  Future<Either<Failure, List<Indisponibilite>>> getIndisponibilites(
          String id) async =>
      const Right([]);

  @override
  Future<Either<Failure, void>> deleteIndisponibilite(String id) async =>
      const Right(null);

  @override
  Future<Either<Failure, List<Indisponibilite>>>
      getIndisponibilitesEnCours() async => const Right([]);

  @override
  Future<Either<Failure, Certificat>> saveCertificat(Certificat c) async =>
      Right(c);

  @override
  Future<Either<Failure, List<Certificat>>> getCertificats(String id) async =>
      const Right([]);

  @override
  Future<Either<Failure, void>> deleteCertificat(String id) async =>
      const Right(null);

  @override
  Future<Either<Failure, DecisionReforme>> saveDecisionReforme(
          DecisionReforme d) async =>
      Right(d);

  @override
  Future<Either<Failure, List<DecisionReforme>>> getDecisionsReforme(
          String id) async =>
      const Right([]);

  @override
  Future<Either<Failure, void>> deleteDecisionReforme(String id) async =>
      const Right(null);

  @override
  Future<Either<Failure, ControleFinService>> saveControleFinService(
          ControleFinService c) async =>
      Right(c);

  @override
  Future<Either<Failure, ControleFinService?>> getControleFinService(
          String id) async =>
      const Right(null);

  @override
  Future<Either<Failure, Map<String, dynamic>>> getStatistiques() async =>
      const Right({});
}

// =============================================================================
// Fixtures
// =============================================================================

SapeurPompier _makeSapeur({
  String id = 'sp-001',
  String matricule = 'MAT-001',
}) {
  return SapeurPompier(
    id: id,
    matricule: matricule,
    createdAt: DateTime(2024, 1, 15),
    updatedAt: DateTime(2024, 1, 15),
    createdBy: 'admin',
  );
}

SapeurPompier _makeSapeurWithEtatCivil({
  String id = 'sp-002',
  String matricule = 'MAT-002',
  required String nom,
  required String prenom,
}) {
  return SapeurPompier(
    id: id,
    matricule: matricule,
    createdAt: DateTime(2024, 1, 15),
    updatedAt: DateTime(2024, 1, 15),
    etatCivil: EtatCivil(
      id: 'ec-$id',
      sapeurPompierId: id,
      nom: nom,
      prenom: prenom,
      dateNaissance: DateTime(1990, 6, 15),
    ),
  );
}

// =============================================================================
// Tests
// =============================================================================

void main() {
  late FakeSapeurPompierRepository fakeRepo;
  late CreateSapeurPompier createSapeurPompier;
  late GetAllSapeursPompiers getAllSapeursPompiers;
  late UpdateSapeurPompier updateSapeurPompier;

  setUp(() {
    fakeRepo = FakeSapeurPompierRepository();
    createSapeurPompier = CreateSapeurPompier(fakeRepo);
    getAllSapeursPompiers = GetAllSapeursPompiers(fakeRepo);
    updateSapeurPompier = UpdateSapeurPompier(fakeRepo);
  });

  // -------------------------------------------------------------------------
  group('CreateSapeurPompier', () {
    test('creates sapeur-pompier with valid data and returns Right(SapeurPompier)',
        () async {
      final sp = _makeSapeur();

      final result = await createSapeurPompier(sp);

      expect(result.isRight(), isTrue);
      result.fold(
        (_) => fail('Expected Right'),
        (created) {
          expect(created.id, sp.id);
          expect(created.matricule, sp.matricule);
        },
      );
    });

    test('creating with duplicate matricule returns Left(ConflictFailure)',
        () async {
      final sp = _makeSapeur();
      // Seed the store so the ID already exists
      fakeRepo.seed(sp);
      // Force conflict result for next call
      fakeRepo.setNextResult(
        const Left(
            ConflictFailure('Un sapeur-pompier avec ce matricule existe déjà')),
      );

      final result = await createSapeurPompier(sp);

      expect(result.isLeft(), isTrue);
      result.fold(
        (f) => expect(f, isA<ConflictFailure>()),
        (_) => fail('Expected Left(ConflictFailure)'),
      );
    });
  });

  // -------------------------------------------------------------------------
  group('GetSapeurPompierById (via repository)', () {
    test('returns Right(SapeurPompier) for an existing id', () async {
      final sp = _makeSapeur(id: 'sp-100', matricule: 'MAT-100');
      fakeRepo.seed(sp);

      final result = await fakeRepo.getSapeurPompierById('sp-100');

      expect(result.isRight(), isTrue);
      result.fold(
        (_) => fail('Expected Right'),
        (found) => expect(found.id, 'sp-100'),
      );
    });

    test('returns Left(NotFoundFailure) for a non-existent id', () async {
      final result = await fakeRepo.getSapeurPompierById('non-existent-id');

      expect(result.isLeft(), isTrue);
      result.fold(
        (f) => expect(f, isA<NotFoundFailure>()),
        (_) => fail('Expected Left(NotFoundFailure)'),
      );
    });
  });

  // -------------------------------------------------------------------------
  group('GetAllSapeursPompiers', () {
    test('returns Right(List) with all seeded records', () async {
      fakeRepo.seed(_makeSapeur(id: 'sp-1', matricule: 'MAT-1'));
      fakeRepo.seed(_makeSapeur(id: 'sp-2', matricule: 'MAT-2'));

      final result = await getAllSapeursPompiers();

      expect(result.isRight(), isTrue);
      result.fold(
        (_) => fail('Expected Right'),
        (list) => expect(list.length, 2),
      );
    });

    test('returns Right([]) when store is empty', () async {
      final result = await getAllSapeursPompiers();

      expect(result.isRight(), isTrue);
      result.fold(
        (_) => fail('Expected Right'),
        (list) => expect(list, isEmpty),
      );
    });
  });

  // -------------------------------------------------------------------------
  group('SearchSapeursPompiers (via repository)', () {
    setUp(() {
      fakeRepo.seed(_makeSapeurWithEtatCivil(
        id: 'sp-a',
        matricule: 'MAT-A',
        nom: 'Traoré',
        prenom: 'Moussa',
      ));
      fakeRepo.seed(_makeSapeurWithEtatCivil(
        id: 'sp-b',
        matricule: 'MAT-B',
        nom: 'Ouedraogo',
        prenom: 'Ibrahim',
      ));
      fakeRepo.seed(_makeSapeurWithEtatCivil(
        id: 'sp-c',
        matricule: 'MAT-C',
        nom: 'Traoré',
        prenom: 'Ali',
      ));
    });

    test('search by name returns filtered list matching the query', () async {
      final result = await fakeRepo.searchSapeursPompiers('Traoré');

      expect(result.isRight(), isTrue);
      result.fold(
        (_) => fail('Expected Right'),
        (list) {
          expect(list.length, 2);
          expect(
            list.every((sp) =>
                sp.etatCivil?.nom.toLowerCase().contains('traoré') ?? false),
            isTrue,
          );
        },
      );
    });

    test('search with no match returns empty list', () async {
      final result = await fakeRepo.searchSapeursPompiers('Diallo');

      expect(result.isRight(), isTrue);
      result.fold(
        (_) => fail('Expected Right'),
        (list) => expect(list, isEmpty),
      );
    });

    test('search by matricule prefix returns matching records', () async {
      final result = await fakeRepo.searchSapeursPompiers('MAT-B');

      expect(result.isRight(), isTrue);
      result.fold(
        (_) => fail('Expected Right'),
        (list) {
          expect(list.length, 1);
          expect(list.first.matricule, 'MAT-B');
        },
      );
    });
  });

  // -------------------------------------------------------------------------
  group('UpdateSapeurPompier + saveVisiteSanitaire', () {
    test('updateSapeurPompier updates the record and returns Right(SapeurPompier)',
        () async {
      final original = _makeSapeur(id: 'sp-upd', matricule: 'MAT-UPD');
      fakeRepo.seed(original);

      final updated = original.copyWith(updatedBy: 'medecin-1');
      final result = await updateSapeurPompier(updated);

      expect(result.isRight(), isTrue);
      result.fold(
        (_) => fail('Expected Right'),
        (sp) => expect(sp.updatedBy, 'medecin-1'),
      );
    });

    test('updating non-existent sapeur-pompier returns Left(NotFoundFailure)',
        () async {
      final ghost = _makeSapeur(id: 'ghost-id', matricule: 'MAT-GHT');
      final result = await updateSapeurPompier(ghost);

      expect(result.isLeft(), isTrue);
      result.fold(
        (f) => expect(f, isA<NotFoundFailure>()),
        (_) => fail('Expected Left(NotFoundFailure)'),
      );
    });

    test('saveVisiteSanitaire updates the visite record and returns Right',
        () async {
      final visite = VisiteSanitaire(
        id: 'vs-001',
        sapeurPompierId: 'sp-001',
        dateVisite: DateTime(2024, 6, 1),
        entiteCorps: 'Compagnie 1',
        resultats: 'Apte',
        nomMedecin: 'Dr. Sawadogo',
      );

      final result = await fakeRepo.saveVisiteSanitaire(visite);

      expect(result.isRight(), isTrue);
      result.fold(
        (_) => fail('Expected Right'),
        (saved) {
          expect(saved.id, visite.id);
          expect(saved.resultats, 'Apte');
          expect(saved.nomMedecin, 'Dr. Sawadogo');
        },
      );
    });

    test(
        'saveVisiteSanitaire propagates failure when repository returns Left(DatabaseFailure)',
        () async {
      const failure = DatabaseFailure('Erreur d\'écriture en base');
      fakeRepo.setNextResult(const Left(failure));

      final visite = VisiteSanitaire(
        id: 'vs-002',
        sapeurPompierId: 'sp-001',
        dateVisite: DateTime(2024, 7, 1),
      );

      final result = await fakeRepo.saveVisiteSanitaire(visite);

      expect(result.isLeft(), isTrue);
      result.fold(
        (f) => expect(f, isA<DatabaseFailure>()),
        (_) => fail('Expected Left(DatabaseFailure)'),
      );
    });
  });
}
