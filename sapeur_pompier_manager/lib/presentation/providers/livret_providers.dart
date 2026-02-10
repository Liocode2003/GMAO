import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/etat_civil.dart';
import '../../domain/entities/constantes.dart';
import '../../domain/entities/examen_incorporation.dart';
import '../../domain/entities/operation.dart';
import '../../domain/entities/vaccination.dart';
import '../../domain/entities/visite_sanitaire.dart';
import '../../domain/entities/indisponibilite.dart';
import '../../domain/entities/certificat.dart';
import '../../domain/entities/decision_reforme.dart';
import '../../domain/entities/controle_fin_service.dart';
import '../../data/repositories/sapeur_pompier_repository_impl.dart';
import 'sapeur_pompier_provider.dart';

// ─── État Civil ───────────────────────────────────────────────────────────────

class EtatCivilState {
  final EtatCivil? etatCivil;
  final bool isLoading;
  final String? error;

  const EtatCivilState({
    this.etatCivil,
    this.isLoading = false,
    this.error,
  });

  EtatCivilState copyWith({
    EtatCivil? etatCivil,
    bool? isLoading,
    String? error,
  }) {
    return EtatCivilState(
      etatCivil: etatCivil ?? this.etatCivil,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class EtatCivilNotifier extends StateNotifier<EtatCivilState> {
  final SapeurPompierRepositoryImpl repository;
  final String sapeurPompierId;

  EtatCivilNotifier(this.repository, this.sapeurPompierId)
      : super(const EtatCivilState()) {
    load(sapeurPompierId);
  }

  Future<void> load(String sapeurPompierId) async {
    state = state.copyWith(isLoading: true, error: null);
    final result = await repository.getEtatCivil(sapeurPompierId);
    result.fold(
      (failure) => state = state.copyWith(
        isLoading: false,
        error: failure.message,
      ),
      (etatCivil) => state = state.copyWith(
        etatCivil: etatCivil,
        isLoading: false,
        error: null,
      ),
    );
  }

  Future<bool> save(EtatCivil etatCivil) async {
    state = state.copyWith(isLoading: true, error: null);
    final result = await repository.saveEtatCivil(etatCivil);
    return result.fold(
      (failure) {
        state = state.copyWith(isLoading: false, error: failure.message);
        return false;
      },
      (saved) {
        state = state.copyWith(etatCivil: saved, isLoading: false, error: null);
        return true;
      },
    );
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

final etatCivilProvider =
    StateNotifierProvider.family<EtatCivilNotifier, EtatCivilState, String>(
  (ref, id) => EtatCivilNotifier(ref.watch(sapeurPompierRepositoryProvider), id),
);

// ─── Constantes ───────────────────────────────────────────────────────────────

class ConstantesState {
  final Constantes? constantes;
  final List<HistoriquePoids> historiquePoids;
  final bool isLoading;
  final String? error;

  const ConstantesState({
    this.constantes,
    this.historiquePoids = const [],
    this.isLoading = false,
    this.error,
  });

  ConstantesState copyWith({
    Constantes? constantes,
    List<HistoriquePoids>? historiquePoids,
    bool? isLoading,
    String? error,
  }) {
    return ConstantesState(
      constantes: constantes ?? this.constantes,
      historiquePoids: historiquePoids ?? this.historiquePoids,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class ConstantesNotifier extends StateNotifier<ConstantesState> {
  final SapeurPompierRepositoryImpl repository;
  final String sapeurPompierId;

  ConstantesNotifier(this.repository, this.sapeurPompierId)
      : super(const ConstantesState()) {
    load(sapeurPompierId);
  }

  Future<void> load(String sapeurPompierId) async {
    state = state.copyWith(isLoading: true, error: null);

    final constResult = await repository.getConstantes(sapeurPompierId);
    final histResult = await repository.getHistoriquePoids(sapeurPompierId);

    final constantes = constResult.fold((_) => null, (c) => c);
    final historique = histResult.fold((_) => <HistoriquePoids>[], (h) => h);

    state = state.copyWith(
      constantes: constantes,
      historiquePoids: historique,
      isLoading: false,
      error: constResult.fold((f) => f.message, (_) => null),
    );
  }

  Future<bool> save(Constantes constantes) async {
    state = state.copyWith(isLoading: true, error: null);
    final result = await repository.saveConstantes(constantes);
    return result.fold(
      (failure) {
        state = state.copyWith(isLoading: false, error: failure.message);
        return false;
      },
      (saved) {
        state = state.copyWith(
          constantes: saved,
          isLoading: false,
          error: null,
        );
        return true;
      },
    );
  }

  Future<bool> saveHistoriquePoids(HistoriquePoids historique) async {
    state = state.copyWith(isLoading: true, error: null);
    final result = await repository.saveHistoriquePoids(historique);
    return result.fold(
      (failure) {
        state = state.copyWith(isLoading: false, error: failure.message);
        return false;
      },
      (saved) {
        final updated = List<HistoriquePoids>.from(state.historiquePoids)
          ..removeWhere((h) => h.id == saved.id)
          ..add(saved);
        state = state.copyWith(
          historiquePoids: updated,
          isLoading: false,
          error: null,
        );
        return true;
      },
    );
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

final constantesProvider =
    StateNotifierProvider.family<ConstantesNotifier, ConstantesState, String>(
  (ref, id) =>
      ConstantesNotifier(ref.watch(sapeurPompierRepositoryProvider), id),
);

// ─── Examen d'Incorporation ───────────────────────────────────────────────────

class ExamenIncorporationState {
  final ExamenIncorporation? examenIncorporation;
  final bool isLoading;
  final String? error;

  const ExamenIncorporationState({
    this.examenIncorporation,
    this.isLoading = false,
    this.error,
  });

  ExamenIncorporationState copyWith({
    ExamenIncorporation? examenIncorporation,
    bool? isLoading,
    String? error,
  }) {
    return ExamenIncorporationState(
      examenIncorporation:
          examenIncorporation ?? this.examenIncorporation,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class ExamenIncorporationNotifier
    extends StateNotifier<ExamenIncorporationState> {
  final SapeurPompierRepositoryImpl repository;
  final String sapeurPompierId;

  ExamenIncorporationNotifier(this.repository, this.sapeurPompierId)
      : super(const ExamenIncorporationState()) {
    load(sapeurPompierId);
  }

  Future<void> load(String sapeurPompierId) async {
    state = state.copyWith(isLoading: true, error: null);
    final result = await repository.getExamenIncorporation(sapeurPompierId);
    result.fold(
      (failure) => state = state.copyWith(
        isLoading: false,
        error: failure.message,
      ),
      (examen) => state = state.copyWith(
        examenIncorporation: examen,
        isLoading: false,
        error: null,
      ),
    );
  }

  Future<bool> save(ExamenIncorporation examen) async {
    state = state.copyWith(isLoading: true, error: null);
    final result = await repository.saveExamenIncorporation(examen);
    return result.fold(
      (failure) {
        state = state.copyWith(isLoading: false, error: failure.message);
        return false;
      },
      (saved) {
        state = state.copyWith(
          examenIncorporation: saved,
          isLoading: false,
          error: null,
        );
        return true;
      },
    );
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

final examenIncorporationProvider = StateNotifierProvider.family<
    ExamenIncorporationNotifier, ExamenIncorporationState, String>(
  (ref, id) => ExamenIncorporationNotifier(
      ref.watch(sapeurPompierRepositoryProvider), id),
);

// ─── Opérations ───────────────────────────────────────────────────────────────

class OperationsState {
  final List<Operation> operations;
  final bool isLoading;
  final String? error;

  const OperationsState({
    this.operations = const [],
    this.isLoading = false,
    this.error,
  });

  OperationsState copyWith({
    List<Operation>? operations,
    bool? isLoading,
    String? error,
  }) {
    return OperationsState(
      operations: operations ?? this.operations,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class OperationsNotifier extends StateNotifier<OperationsState> {
  final SapeurPompierRepositoryImpl repository;
  final String sapeurPompierId;

  OperationsNotifier(this.repository, this.sapeurPompierId)
      : super(const OperationsState()) {
    load(sapeurPompierId);
  }

  Future<void> load(String sapeurPompierId) async {
    state = state.copyWith(isLoading: true, error: null);
    final result = await repository.getOperations(sapeurPompierId);
    result.fold(
      (failure) => state = state.copyWith(
        isLoading: false,
        error: failure.message,
      ),
      (operations) => state = state.copyWith(
        operations: operations,
        isLoading: false,
        error: null,
      ),
    );
  }

  Future<bool> save(Operation operation) async {
    state = state.copyWith(isLoading: true, error: null);
    final result = await repository.saveOperation(operation);
    return result.fold(
      (failure) {
        state = state.copyWith(isLoading: false, error: failure.message);
        return false;
      },
      (saved) {
        final updated = List<Operation>.from(state.operations)
          ..removeWhere((o) => o.id == saved.id)
          ..add(saved);
        updated.sort((a, b) => a.numeroSejour.compareTo(b.numeroSejour));
        state = state.copyWith(
          operations: updated,
          isLoading: false,
          error: null,
        );
        return true;
      },
    );
  }

  Future<bool> delete(String id) async {
    state = state.copyWith(isLoading: true, error: null);
    final result = await repository.deleteOperation(id);
    return result.fold(
      (failure) {
        state = state.copyWith(isLoading: false, error: failure.message);
        return false;
      },
      (_) {
        final updated = List<Operation>.from(state.operations)
          ..removeWhere((o) => o.id == id);
        state = state.copyWith(
          operations: updated,
          isLoading: false,
          error: null,
        );
        return true;
      },
    );
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

final operationsProvider =
    StateNotifierProvider.family<OperationsNotifier, OperationsState, String>(
  (ref, id) =>
      OperationsNotifier(ref.watch(sapeurPompierRepositoryProvider), id),
);

// ─── Vaccinations ─────────────────────────────────────────────────────────────

class VaccinationsState {
  final List<Vaccination> vaccinations;
  final bool isLoading;
  final String? error;

  const VaccinationsState({
    this.vaccinations = const [],
    this.isLoading = false,
    this.error,
  });

  VaccinationsState copyWith({
    List<Vaccination>? vaccinations,
    bool? isLoading,
    String? error,
  }) {
    return VaccinationsState(
      vaccinations: vaccinations ?? this.vaccinations,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  List<Vaccination> get expirees => vaccinations.where((v) => v.isExpire).toList();
  List<Vaccination> get prochesExpiration =>
      vaccinations.where((v) => v.isProcheDExpiration).toList();
}

class VaccinationsNotifier extends StateNotifier<VaccinationsState> {
  final SapeurPompierRepositoryImpl repository;
  final String sapeurPompierId;

  VaccinationsNotifier(this.repository, this.sapeurPompierId)
      : super(const VaccinationsState()) {
    load(sapeurPompierId);
  }

  Future<void> load(String sapeurPompierId) async {
    state = state.copyWith(isLoading: true, error: null);
    final result = await repository.getVaccinations(sapeurPompierId);
    result.fold(
      (failure) => state = state.copyWith(
        isLoading: false,
        error: failure.message,
      ),
      (vaccinations) => state = state.copyWith(
        vaccinations: vaccinations,
        isLoading: false,
        error: null,
      ),
    );
  }

  Future<bool> save(Vaccination vaccination) async {
    state = state.copyWith(isLoading: true, error: null);
    final result = await repository.saveVaccination(vaccination);
    return result.fold(
      (failure) {
        state = state.copyWith(isLoading: false, error: failure.message);
        return false;
      },
      (saved) {
        final updated = List<Vaccination>.from(state.vaccinations)
          ..removeWhere((v) => v.id == saved.id)
          ..add(saved);
        state = state.copyWith(
          vaccinations: updated,
          isLoading: false,
          error: null,
        );
        return true;
      },
    );
  }

  Future<bool> delete(String id) async {
    state = state.copyWith(isLoading: true, error: null);
    final result = await repository.deleteVaccination(id);
    return result.fold(
      (failure) {
        state = state.copyWith(isLoading: false, error: failure.message);
        return false;
      },
      (_) {
        final updated = List<Vaccination>.from(state.vaccinations)
          ..removeWhere((v) => v.id == id);
        state = state.copyWith(
          vaccinations: updated,
          isLoading: false,
          error: null,
        );
        return true;
      },
    );
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

final vaccinationsProvider =
    StateNotifierProvider.family<VaccinationsNotifier, VaccinationsState, String>(
  (ref, id) =>
      VaccinationsNotifier(ref.watch(sapeurPompierRepositoryProvider), id),
);

// ─── Visites Sanitaires ───────────────────────────────────────────────────────

class VisitesSanitairesState {
  final List<VisiteSanitaire> visitesSanitaires;
  final bool isLoading;
  final String? error;

  const VisitesSanitairesState({
    this.visitesSanitaires = const [],
    this.isLoading = false,
    this.error,
  });

  VisitesSanitairesState copyWith({
    List<VisiteSanitaire>? visitesSanitaires,
    bool? isLoading,
    String? error,
  }) {
    return VisitesSanitairesState(
      visitesSanitaires: visitesSanitaires ?? this.visitesSanitaires,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  VisiteSanitaire? get derniereVisite {
    if (visitesSanitaires.isEmpty) return null;
    final sorted = List<VisiteSanitaire>.from(visitesSanitaires)
      ..sort((a, b) => b.dateVisite.compareTo(a.dateVisite));
    return sorted.first;
  }

  bool get visiteAnnuelleEnRetard {
    final derniere = derniereVisite;
    if (derniere == null) return true;
    return DateTime.now().difference(derniere.dateVisite).inDays > 365;
  }
}

class VisitesSanitairesNotifier
    extends StateNotifier<VisitesSanitairesState> {
  final SapeurPompierRepositoryImpl repository;
  final String sapeurPompierId;

  VisitesSanitairesNotifier(this.repository, this.sapeurPompierId)
      : super(const VisitesSanitairesState()) {
    load(sapeurPompierId);
  }

  Future<void> load(String sapeurPompierId) async {
    state = state.copyWith(isLoading: true, error: null);
    final result = await repository.getVisitesSanitaires(sapeurPompierId);
    result.fold(
      (failure) => state = state.copyWith(
        isLoading: false,
        error: failure.message,
      ),
      (visites) => state = state.copyWith(
        visitesSanitaires: visites,
        isLoading: false,
        error: null,
      ),
    );
  }

  Future<bool> save(VisiteSanitaire visite) async {
    state = state.copyWith(isLoading: true, error: null);
    final result = await repository.saveVisiteSanitaire(visite);
    return result.fold(
      (failure) {
        state = state.copyWith(isLoading: false, error: failure.message);
        return false;
      },
      (saved) {
        final updated = List<VisiteSanitaire>.from(state.visitesSanitaires)
          ..removeWhere((v) => v.id == saved.id)
          ..add(saved);
        state = state.copyWith(
          visitesSanitaires: updated,
          isLoading: false,
          error: null,
        );
        return true;
      },
    );
  }

  Future<bool> delete(String id) async {
    state = state.copyWith(isLoading: true, error: null);
    final result = await repository.deleteVisiteSanitaire(id);
    return result.fold(
      (failure) {
        state = state.copyWith(isLoading: false, error: failure.message);
        return false;
      },
      (_) {
        final updated = List<VisiteSanitaire>.from(state.visitesSanitaires)
          ..removeWhere((v) => v.id == id);
        state = state.copyWith(
          visitesSanitaires: updated,
          isLoading: false,
          error: null,
        );
        return true;
      },
    );
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

final visitesSanitairesProvider = StateNotifierProvider.family<
    VisitesSanitairesNotifier, VisitesSanitairesState, String>(
  (ref, id) => VisitesSanitairesNotifier(
      ref.watch(sapeurPompierRepositoryProvider), id),
);

// ─── Indisponibilités ─────────────────────────────────────────────────────────

class IndisponibilitesState {
  final List<Indisponibilite> indisponibilites;
  final bool isLoading;
  final String? error;

  const IndisponibilitesState({
    this.indisponibilites = const [],
    this.isLoading = false,
    this.error,
  });

  IndisponibilitesState copyWith({
    List<Indisponibilite>? indisponibilites,
    bool? isLoading,
    String? error,
  }) {
    return IndisponibilitesState(
      indisponibilites: indisponibilites ?? this.indisponibilites,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  List<Indisponibilite> get enCours =>
      indisponibilites.where((i) => i.isEnCours).toList();

  int get totalJours =>
      indisponibilites.fold(0, (sum, i) => sum + i.dureeTotale);
}

class IndisponibilitesNotifier extends StateNotifier<IndisponibilitesState> {
  final SapeurPompierRepositoryImpl repository;
  final String sapeurPompierId;

  IndisponibilitesNotifier(this.repository, this.sapeurPompierId)
      : super(const IndisponibilitesState()) {
    load(sapeurPompierId);
  }

  Future<void> load(String sapeurPompierId) async {
    state = state.copyWith(isLoading: true, error: null);
    final result = await repository.getIndisponibilites(sapeurPompierId);
    result.fold(
      (failure) => state = state.copyWith(
        isLoading: false,
        error: failure.message,
      ),
      (indisponibilites) => state = state.copyWith(
        indisponibilites: indisponibilites,
        isLoading: false,
        error: null,
      ),
    );
  }

  Future<bool> save(Indisponibilite indisponibilite) async {
    state = state.copyWith(isLoading: true, error: null);
    final result = await repository.saveIndisponibilite(indisponibilite);
    return result.fold(
      (failure) {
        state = state.copyWith(isLoading: false, error: failure.message);
        return false;
      },
      (saved) {
        final updated = List<Indisponibilite>.from(state.indisponibilites)
          ..removeWhere((i) => i.id == saved.id)
          ..add(saved);
        state = state.copyWith(
          indisponibilites: updated,
          isLoading: false,
          error: null,
        );
        return true;
      },
    );
  }

  Future<bool> delete(String id) async {
    state = state.copyWith(isLoading: true, error: null);
    final result = await repository.deleteIndisponibilite(id);
    return result.fold(
      (failure) {
        state = state.copyWith(isLoading: false, error: failure.message);
        return false;
      },
      (_) {
        final updated = List<Indisponibilite>.from(state.indisponibilites)
          ..removeWhere((i) => i.id == id);
        state = state.copyWith(
          indisponibilites: updated,
          isLoading: false,
          error: null,
        );
        return true;
      },
    );
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

final indisponibilitesProvider = StateNotifierProvider.family<
    IndisponibilitesNotifier, IndisponibilitesState, String>(
  (ref, id) =>
      IndisponibilitesNotifier(ref.watch(sapeurPompierRepositoryProvider), id),
);

// ─── Certificats ──────────────────────────────────────────────────────────────

class CertificatsState {
  final List<Certificat> certificats;
  final bool isLoading;
  final String? error;

  const CertificatsState({
    this.certificats = const [],
    this.isLoading = false,
    this.error,
  });

  CertificatsState copyWith({
    List<Certificat>? certificats,
    bool? isLoading,
    String? error,
  }) {
    return CertificatsState(
      certificats: certificats ?? this.certificats,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class CertificatsNotifier extends StateNotifier<CertificatsState> {
  final SapeurPompierRepositoryImpl repository;
  final String sapeurPompierId;

  CertificatsNotifier(this.repository, this.sapeurPompierId)
      : super(const CertificatsState()) {
    load(sapeurPompierId);
  }

  Future<void> load(String sapeurPompierId) async {
    state = state.copyWith(isLoading: true, error: null);
    final result = await repository.getCertificats(sapeurPompierId);
    result.fold(
      (failure) => state = state.copyWith(
        isLoading: false,
        error: failure.message,
      ),
      (certificats) => state = state.copyWith(
        certificats: certificats,
        isLoading: false,
        error: null,
      ),
    );
  }

  Future<bool> save(Certificat certificat) async {
    state = state.copyWith(isLoading: true, error: null);
    final result = await repository.saveCertificat(certificat);
    return result.fold(
      (failure) {
        state = state.copyWith(isLoading: false, error: failure.message);
        return false;
      },
      (saved) {
        final updated = List<Certificat>.from(state.certificats)
          ..removeWhere((c) => c.id == saved.id)
          ..add(saved);
        state = state.copyWith(
          certificats: updated,
          isLoading: false,
          error: null,
        );
        return true;
      },
    );
  }

  Future<bool> delete(String id) async {
    state = state.copyWith(isLoading: true, error: null);
    final result = await repository.deleteCertificat(id);
    return result.fold(
      (failure) {
        state = state.copyWith(isLoading: false, error: failure.message);
        return false;
      },
      (_) {
        final updated = List<Certificat>.from(state.certificats)
          ..removeWhere((c) => c.id == id);
        state = state.copyWith(
          certificats: updated,
          isLoading: false,
          error: null,
        );
        return true;
      },
    );
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

final certificatsProvider =
    StateNotifierProvider.family<CertificatsNotifier, CertificatsState, String>(
  (ref, id) =>
      CertificatsNotifier(ref.watch(sapeurPompierRepositoryProvider), id),
);

// ─── Décisions de Réforme ─────────────────────────────────────────────────────

class DecisionsReformeState {
  final List<DecisionReforme> decisionsReforme;
  final bool isLoading;
  final String? error;

  const DecisionsReformeState({
    this.decisionsReforme = const [],
    this.isLoading = false,
    this.error,
  });

  DecisionsReformeState copyWith({
    List<DecisionReforme>? decisionsReforme,
    bool? isLoading,
    String? error,
  }) {
    return DecisionsReformeState(
      decisionsReforme: decisionsReforme ?? this.decisionsReforme,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  List<DecisionReforme> get reformes =>
      decisionsReforme.where((d) => d.isReforme).toList();

  List<DecisionReforme> get rengagements =>
      decisionsReforme.where((d) => d.isRengagement).toList();
}

class DecisionsReformeNotifier extends StateNotifier<DecisionsReformeState> {
  final SapeurPompierRepositoryImpl repository;
  final String sapeurPompierId;

  DecisionsReformeNotifier(this.repository, this.sapeurPompierId)
      : super(const DecisionsReformeState()) {
    load(sapeurPompierId);
  }

  Future<void> load(String sapeurPompierId) async {
    state = state.copyWith(isLoading: true, error: null);
    final result = await repository.getDecisionsReforme(sapeurPompierId);
    result.fold(
      (failure) => state = state.copyWith(
        isLoading: false,
        error: failure.message,
      ),
      (decisions) => state = state.copyWith(
        decisionsReforme: decisions,
        isLoading: false,
        error: null,
      ),
    );
  }

  Future<bool> save(DecisionReforme decision) async {
    state = state.copyWith(isLoading: true, error: null);
    final result = await repository.saveDecisionReforme(decision);
    return result.fold(
      (failure) {
        state = state.copyWith(isLoading: false, error: failure.message);
        return false;
      },
      (saved) {
        final updated = List<DecisionReforme>.from(state.decisionsReforme)
          ..removeWhere((d) => d.id == saved.id)
          ..add(saved);
        state = state.copyWith(
          decisionsReforme: updated,
          isLoading: false,
          error: null,
        );
        return true;
      },
    );
  }

  Future<bool> delete(String id) async {
    state = state.copyWith(isLoading: true, error: null);
    final result = await repository.deleteDecisionReforme(id);
    return result.fold(
      (failure) {
        state = state.copyWith(isLoading: false, error: failure.message);
        return false;
      },
      (_) {
        final updated = List<DecisionReforme>.from(state.decisionsReforme)
          ..removeWhere((d) => d.id == id);
        state = state.copyWith(
          decisionsReforme: updated,
          isLoading: false,
          error: null,
        );
        return true;
      },
    );
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

final decisionsReformeProvider = StateNotifierProvider.family<
    DecisionsReformeNotifier, DecisionsReformeState, String>(
  (ref, id) =>
      DecisionsReformeNotifier(ref.watch(sapeurPompierRepositoryProvider), id),
);

// ─── Contrôle Fin de Service ──────────────────────────────────────────────────

class ControleFinServiceState {
  final ControleFinService? controleFinService;
  final bool isLoading;
  final String? error;

  const ControleFinServiceState({
    this.controleFinService,
    this.isLoading = false,
    this.error,
  });

  ControleFinServiceState copyWith({
    ControleFinService? controleFinService,
    bool? isLoading,
    String? error,
  }) {
    return ControleFinServiceState(
      controleFinService: controleFinService ?? this.controleFinService,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class ControleFinServiceNotifier
    extends StateNotifier<ControleFinServiceState> {
  final SapeurPompierRepositoryImpl repository;
  final String sapeurPompierId;

  ControleFinServiceNotifier(this.repository, this.sapeurPompierId)
      : super(const ControleFinServiceState()) {
    load(sapeurPompierId);
  }

  Future<void> load(String sapeurPompierId) async {
    state = state.copyWith(isLoading: true, error: null);
    final result = await repository.getControleFinService(sapeurPompierId);
    result.fold(
      (failure) => state = state.copyWith(
        isLoading: false,
        error: failure.message,
      ),
      (controle) => state = state.copyWith(
        controleFinService: controle,
        isLoading: false,
        error: null,
      ),
    );
  }

  Future<bool> save(ControleFinService controle) async {
    state = state.copyWith(isLoading: true, error: null);
    final result = await repository.saveControleFinService(controle);
    return result.fold(
      (failure) {
        state = state.copyWith(isLoading: false, error: failure.message);
        return false;
      },
      (saved) {
        state = state.copyWith(
          controleFinService: saved,
          isLoading: false,
          error: null,
        );
        return true;
      },
    );
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

final controleFinServiceProvider = StateNotifierProvider.family<
    ControleFinServiceNotifier, ControleFinServiceState, String>(
  (ref, id) => ControleFinServiceNotifier(
      ref.watch(sapeurPompierRepositoryProvider), id),
);
