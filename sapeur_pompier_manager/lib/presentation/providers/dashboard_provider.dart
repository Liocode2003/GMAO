import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/vaccination.dart';
import '../../domain/entities/indisponibilite.dart';
import 'sapeur_pompier_provider.dart';

/// État du dashboard
class DashboardState {
  final Map<String, dynamic> statistiques;
  final List<Vaccination> vaccinationsExpirees;
  final List<Vaccination> vaccinationsProchesExpiration;
  final List<Indisponibilite> indisponibilitesEnCours;
  final bool isLoading;
  final String? error;

  const DashboardState({
    this.statistiques = const {},
    this.vaccinationsExpirees = const [],
    this.vaccinationsProchesExpiration = const [],
    this.indisponibilitesEnCours = const [],
    this.isLoading = false,
    this.error,
  });

  DashboardState copyWith({
    Map<String, dynamic>? statistiques,
    List<Vaccination>? vaccinationsExpirees,
    List<Vaccination>? vaccinationsProchesExpiration,
    List<Indisponibilite>? indisponibilitesEnCours,
    bool? isLoading,
    String? error,
  }) {
    return DashboardState(
      statistiques: statistiques ?? this.statistiques,
      vaccinationsExpirees: vaccinationsExpirees ?? this.vaccinationsExpirees,
      vaccinationsProchesExpiration:
          vaccinationsProchesExpiration ?? this.vaccinationsProchesExpiration,
      indisponibilitesEnCours: indisponibilitesEnCours ?? this.indisponibilitesEnCours,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

/// Notifier pour gérer le dashboard
class DashboardNotifier extends StateNotifier<DashboardState> {
  final SapeurPompierRepositoryImpl repository;

  DashboardNotifier(this.repository) : super(const DashboardState()) {
    loadDashboardData();
  }

  /// Charge toutes les données du dashboard
  Future<void> loadDashboardData() async {
    state = state.copyWith(isLoading: true, error: null);

    // Charger les statistiques
    final statsResult = await repository.getStatistiques();

    // Charger les vaccinations expirées
    final vaccinsExpiresResult = await repository.getVaccinationsExpirees();

    // Charger les vaccinations proches de l'expiration
    final vaccinsProchesResult = await repository.getVaccinationsProchesExpiration();

    // Charger les indisponibilités en cours
    final indispoResult = await repository.getIndisponibilitesEnCours();

    // Combiner tous les résultats
    statsResult.fold(
      (failure) {
        state = state.copyWith(
          isLoading: false,
          error: failure.message,
        );
      },
      (stats) {
        final vaccinsExpires = vaccinsExpiresResult.fold(
          (failure) => <Vaccination>[],
          (vaccins) => vaccins,
        );

        final vaccinsProches = vaccinsProchesResult.fold(
          (failure) => <Vaccination>[],
          (vaccins) => vaccins,
        );

        final indisponibilites = indispoResult.fold(
          (failure) => <Indisponibilite>[],
          (indispo) => indispo,
        );

        state = state.copyWith(
          statistiques: stats,
          vaccinationsExpirees: vaccinsExpires,
          vaccinationsProchesExpiration: vaccinsProches,
          indisponibilitesEnCours: indisponibilites,
          isLoading: false,
          error: null,
        );
      },
    );
  }

  /// Rafraîchir les données
  Future<void> refresh() async {
    await loadDashboardData();
  }
}

/// Provider pour le dashboard
final dashboardProvider = StateNotifierProvider<DashboardNotifier, DashboardState>((ref) {
  final repository = ref.watch(sapeurPompierRepositoryProvider);
  return DashboardNotifier(repository);
});

/// Providers helpers pour accéder aux statistiques individuelles
final totalSapeursPompiersProvider = Provider<int>((ref) {
  final dashboard = ref.watch(dashboardProvider);
  return dashboard.statistiques['total'] as int? ?? 0;
});

final totalAptesProvider = Provider<int>((ref) {
  final dashboard = ref.watch(dashboardProvider);
  return dashboard.statistiques['aptes'] as int? ?? 0;
});

final totalInaptesProvider = Provider<int>((ref) {
  final dashboard = ref.watch(dashboardProvider);
  return dashboard.statistiques['inaptes'] as int? ?? 0;
});

final totalVaccinsExpiresProvider = Provider<int>((ref) {
  final dashboard = ref.watch(dashboardProvider);
  return dashboard.statistiques['vaccinsExpires'] as int? ?? 0;
});

final totalVaccinsProchesExpirationProvider = Provider<int>((ref) {
  final dashboard = ref.watch(dashboardProvider);
  return dashboard.statistiques['vaccinsProchesExpiration'] as int? ?? 0;
});

final totalIndisponibilitesProvider = Provider<int>((ref) {
  final dashboard = ref.watch(dashboardProvider);
  return dashboard.statistiques['indisponibilites'] as int? ?? 0;
});

final totalOperationsEnCoursProvider = Provider<int>((ref) {
  final dashboard = ref.watch(dashboardProvider);
  return dashboard.statistiques['operationsEnCours'] as int? ?? 0;
});

/// Provider pour le pourcentage d'aptitude
final pourcentageAptitudeProvider = Provider<double>((ref) {
  final total = ref.watch(totalSapeursPompiersProvider);
  final aptes = ref.watch(totalAptesProvider);

  if (total == 0) return 0.0;
  return (aptes / total) * 100;
});
