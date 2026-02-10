import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/sapeur_pompier.dart';
import '../../data/datasources/local_database.dart';
import '../../data/repositories/sapeur_pompier_repository_impl.dart';
import 'auth_provider.dart';

/// État de la liste des sapeurs-pompiers
class SapeursPompiersState {
  final List<SapeurPompier> sapeursPompiers;
  final bool isLoading;
  final String? error;
  final String searchQuery;

  const SapeursPompiersState({
    this.sapeursPompiers = const [],
    this.isLoading = false,
    this.error,
    this.searchQuery = '',
  });

  SapeursPompiersState copyWith({
    List<SapeurPompier>? sapeursPompiers,
    bool? isLoading,
    String? error,
    String? searchQuery,
  }) {
    return SapeursPompiersState(
      sapeursPompiers: sapeursPompiers ?? this.sapeursPompiers,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      searchQuery: searchQuery ?? this.searchQuery,
    );
  }

  /// Filtre les sapeurs-pompiers selon la recherche
  List<SapeurPompier> get filteredSapeursPompiers {
    if (searchQuery.isEmpty) {
      return sapeursPompiers;
    }

    final query = searchQuery.toLowerCase();
    return sapeursPompiers.where((sp) {
      return sp.matricule.toLowerCase().contains(query) ||
          sp.nomComplet.toLowerCase().contains(query);
    }).toList();
  }
}

/// Provider pour SapeurPompierRepository
final sapeurPompierRepositoryProvider = Provider<SapeurPompierRepositoryImpl>((ref) {
  final database = ref.watch(localDatabaseProvider);
  return SapeurPompierRepositoryImpl(database: database);
});

/// Notifier pour gérer la liste des sapeurs-pompiers
class SapeursPompiersNotifier extends StateNotifier<SapeursPompiersState> {
  final SapeurPompierRepositoryImpl repository;

  SapeursPompiersNotifier(this.repository) : super(const SapeursPompiersState()) {
    loadSapeursPompiers();
  }

  /// Charge tous les sapeurs-pompiers
  Future<void> loadSapeursPompiers() async {
    state = state.copyWith(isLoading: true, error: null);

    final result = await repository.getAllSapeursPompiers();

    result.fold(
      (failure) {
        state = state.copyWith(
          isLoading: false,
          error: failure.message,
        );
      },
      (sapeursPompiers) {
        state = state.copyWith(
          sapeursPompiers: sapeursPompiers,
          isLoading: false,
          error: null,
        );
      },
    );
  }

  /// Recherche des sapeurs-pompiers
  Future<void> search(String query) async {
    state = state.copyWith(searchQuery: query);

    if (query.isEmpty) {
      await loadSapeursPompiers();
      return;
    }

    state = state.copyWith(isLoading: true);

    final result = await repository.searchSapeursPompiers(query);

    result.fold(
      (failure) {
        state = state.copyWith(
          isLoading: false,
          error: failure.message,
        );
      },
      (sapeursPompiers) {
        state = state.copyWith(
          sapeursPompiers: sapeursPompiers,
          isLoading: false,
          error: null,
        );
      },
    );
  }

  /// Crée un nouveau sapeur-pompier
  Future<bool> createSapeurPompier(SapeurPompier sapeurPompier) async {
    state = state.copyWith(isLoading: true, error: null);

    final result = await repository.createSapeurPompier(sapeurPompier);

    return result.fold(
      (failure) {
        state = state.copyWith(
          isLoading: false,
          error: failure.message,
        );
        return false;
      },
      (newSapeurPompier) {
        // Recharger la liste
        loadSapeursPompiers();
        return true;
      },
    );
  }

  /// Met à jour un sapeur-pompier
  Future<bool> updateSapeurPompier(SapeurPompier sapeurPompier) async {
    state = state.copyWith(isLoading: true, error: null);

    final result = await repository.updateSapeurPompier(sapeurPompier);

    return result.fold(
      (failure) {
        state = state.copyWith(
          isLoading: false,
          error: failure.message,
        );
        return false;
      },
      (updatedSapeurPompier) {
        // Recharger la liste
        loadSapeursPompiers();
        return true;
      },
    );
  }

  /// Supprime un sapeur-pompier
  Future<bool> deleteSapeurPompier(String id) async {
    state = state.copyWith(isLoading: true, error: null);

    final result = await repository.deleteSapeurPompier(id);

    return result.fold(
      (failure) {
        state = state.copyWith(
          isLoading: false,
          error: failure.message,
        );
        return false;
      },
      (_) {
        // Recharger la liste
        loadSapeursPompiers();
        return true;
      },
    );
  }

  /// Efface le message d'erreur
  void clearError() {
    state = state.copyWith(error: null);
  }
}

/// Provider pour la liste des sapeurs-pompiers
final sapeursPompiersProvider = StateNotifierProvider<SapeursPompiersNotifier, SapeursPompiersState>((ref) {
  final repository = ref.watch(sapeurPompierRepositoryProvider);
  return SapeursPompiersNotifier(repository);
});

/// Provider pour un sapeur-pompier spécifique
final sapeurPompierByIdProvider = FutureProvider.family<SapeurPompier?, String>((ref, id) async {
  final repository = ref.watch(sapeurPompierRepositoryProvider);
  final result = await repository.getSapeurPompierById(id);

  return result.fold(
    (failure) => null,
    (sapeurPompier) => sapeurPompier,
  );
});

/// Provider pour compter les alertes
final alertesCountProvider = Provider<int>((ref) {
  final sapeursPompiers = ref.watch(sapeursPompiersProvider).sapeursPompiers;

  int totalAlertes = 0;
  for (var sp in sapeursPompiers) {
    totalAlertes += sp.nombreAlertes;
  }

  return totalAlertes;
});
