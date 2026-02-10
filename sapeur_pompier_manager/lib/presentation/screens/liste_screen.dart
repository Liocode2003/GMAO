import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../providers/sapeur_pompier_provider.dart';
import '../providers/auth_provider.dart';
import '../widgets/app_layout.dart';
import '../../domain/entities/sapeur_pompier.dart';

/// Écran de liste des sapeurs-pompiers
class ListeScreen extends ConsumerStatefulWidget {
  const ListeScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<ListeScreen> createState() => _ListeScreenState();
}

class _ListeScreenState extends ConsumerState<ListeScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final sapeursPompiersState = ref.watch(sapeursPompiersProvider);
    final canEdit = ref.watch(canEditProvider);

    return AppLayout(
      currentRoute: '/liste',
      child: Scaffold(
        backgroundColor: AppColors.background,
        floatingActionButton: canEdit
            ? FloatingActionButton.extended(
                onPressed: () {
                  Navigator.of(context).pushNamed('/sapeur-pompier/create');
                },
                backgroundColor: AppColors.primary,
                icon: const Icon(Icons.add),
                label: const Text('Nouveau SP'),
              )
            : null,
        body: RefreshIndicator(
          onRefresh: () async {
            await ref.read(sapeursPompiersProvider.notifier).loadSapeursPompiers();
          },
          child: CustomScrollView(
            slivers: [
              // AppBar
              SliverAppBar(
                floating: true,
                pinned: true,
                backgroundColor: Colors.white,
                elevation: 2,
                title: const Text(
                  AppStrings.listeSapeursPompiers,
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                automaticallyImplyLeading: false,
                actions: [
                  if (sapeursPompiersState.isLoading)
                    const Padding(
                      padding: EdgeInsets.all(16.0),
                      child: SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    ),
                  IconButton(
                    icon: const Icon(Icons.refresh, color: AppColors.primary),
                    onPressed: () {
                      ref.read(sapeursPompiersProvider.notifier).loadSapeursPompiers();
                    },
                    tooltip: 'Rafraîchir',
                  ),
                  IconButton(
                    icon: const Icon(Icons.filter_list, color: AppColors.primary),
                    onPressed: () {
                      _showFilterDialog(context);
                    },
                    tooltip: 'Filtrer',
                  ),
                  const SizedBox(width: 8),
                ],
              ),

              // Barre de recherche
              SliverToBoxAdapter(
                child: Container(
                  color: Colors.white,
                  padding: const EdgeInsets.all(16),
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'Rechercher par matricule ou nom...',
                      prefixIcon: const Icon(Icons.search, color: AppColors.primary),
                      suffixIcon: _searchQuery.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear),
                              onPressed: () {
                                _searchController.clear();
                                setState(() {
                                  _searchQuery = '';
                                });
                                ref
                                    .read(sapeursPompiersProvider.notifier)
                                    .search('');
                              },
                            )
                          : null,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppColors.border),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppColors.border),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(
                          color: AppColors.primary,
                          width: 2,
                        ),
                      ),
                      filled: true,
                      fillColor: AppColors.background,
                    ),
                    onChanged: (value) {
                      setState(() {
                        _searchQuery = value;
                      });
                      ref.read(sapeursPompiersProvider.notifier).search(value);
                    },
                  ),
                ),
              ),

              // Statistiques rapides
              SliverToBoxAdapter(
                child: Container(
                  color: Colors.white,
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  child: _buildQuickStats(sapeursPompiersState),
                ),
              ),

              // Content
              _buildContent(context, sapeursPompiersState),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickStats(SapeursPompiersState state) {
    final filteredList = state.filteredSapeursPompiers;
    final totalAlertes = filteredList.fold<int>(
      0,
      (sum, sp) => sum + sp.nombreAlertes,
    );
    final aptes = filteredList.where((sp) => sp.isApte).length;
    final inaptes = filteredList.where((sp) => sp.isInapte).length;

    return Row(
      children: [
        _buildQuickStatChip(
          label: 'Total',
          value: filteredList.length.toString(),
          color: AppColors.primary,
        ),
        const SizedBox(width: 8),
        _buildQuickStatChip(
          label: 'Aptes',
          value: aptes.toString(),
          color: AppColors.success,
        ),
        const SizedBox(width: 8),
        _buildQuickStatChip(
          label: 'Inaptes',
          value: inaptes.toString(),
          color: AppColors.error,
        ),
        const SizedBox(width: 8),
        _buildQuickStatChip(
          label: 'Alertes',
          value: totalAlertes.toString(),
          color: AppColors.warning,
        ),
      ],
    );
  }

  Widget _buildQuickStatChip({
    required String label,
    required String value,
    required Color color,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                color: color,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, SapeursPompiersState state) {
    if (state.error != null) {
      return SliverFillRemaining(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline,
                color: AppColors.error,
                size: 64,
              ),
              const SizedBox(height: 16),
              Text(
                'Erreur lors du chargement',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              Text(
                state.error!,
                style: Theme.of(context).textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () {
                  ref.read(sapeursPompiersProvider.notifier).loadSapeursPompiers();
                },
                icon: const Icon(Icons.refresh),
                label: const Text('Réessayer'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                ),
              ),
            ],
          ),
        ),
      );
    }

    final filteredList = state.filteredSapeursPompiers;

    if (filteredList.isEmpty) {
      return SliverFillRemaining(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                _searchQuery.isEmpty ? Icons.inbox : Icons.search_off,
                color: AppColors.textDisabled,
                size: 64,
              ),
              const SizedBox(height: 16),
              Text(
                _searchQuery.isEmpty
                    ? AppStrings.noData
                    : 'Aucun résultat trouvé',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                _searchQuery.isEmpty
                    ? 'Commencez par créer un nouveau dossier'
                    : 'Essayez avec un autre terme de recherche',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textDisabled,
                    ),
              ),
            ],
          ),
        ),
      );
    }

    return SliverPadding(
      padding: const EdgeInsets.all(16),
      sliver: SliverList(
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final sapeurPompier = filteredList[index];
            return _buildSapeurPompierCard(context, sapeurPompier);
          },
          childCount: filteredList.length,
        ),
      ),
    );
  }

  Widget _buildSapeurPompierCard(BuildContext context, SapeurPompier sp) {
    final canEdit = ref.watch(canEditProvider);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shadowColor: Colors.black26,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: () {
          Navigator.of(context).pushNamed(
            '/sapeur-pompier/detail',
            arguments: sp.id,
          );
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Photo/Avatar
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: sp.isApte
                      ? AppColors.success.withOpacity(0.1)
                      : AppColors.error.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: sp.hasPhoto
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.file(
                          File(sp.etatCivil!.photoPath!),
                          fit: BoxFit.cover,
                        ),
                      )
                    : Icon(
                        Icons.person,
                        size: 32,
                        color: sp.isApte ? AppColors.success : AppColors.error,
                      ),
              ),
              const SizedBox(width: 16),

              // Informations
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            sp.nomComplet,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ),
                        if (sp.nombreAlertes > 0)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.error,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(
                                  Icons.warning,
                                  size: 14,
                                  color: Colors.white,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  '${sp.nombreAlertes}',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _buildInfoChip(
                          icon: Icons.badge,
                          label: sp.matricule,
                          color: AppColors.primary,
                        ),
                        const SizedBox(width: 8),
                        if (sp.age != null)
                          _buildInfoChip(
                            icon: Icons.cake,
                            label: '${sp.age} ans',
                            color: AppColors.secondary,
                          ),
                        const SizedBox(width: 8),
                        _buildInfoChip(
                          icon: sp.isApte
                              ? Icons.check_circle
                              : Icons.cancel,
                          label: sp.statutMedical,
                          color: sp.isApte
                              ? AppColors.success
                              : AppColors.error,
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: LinearProgressIndicator(
                            value: sp.completionPercentage / 100,
                            backgroundColor:
                                AppColors.border.withOpacity(0.3),
                            valueColor: AlwaysStoppedAnimation<Color>(
                              sp.isComplet
                                  ? AppColors.success
                                  : AppColors.warning,
                            ),
                            minHeight: 6,
                            borderRadius: BorderRadius.circular(3),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '${sp.completionPercentage.toStringAsFixed(0)}%',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: sp.isComplet
                                ? AppColors.success
                                : AppColors.warning,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Actions
              if (canEdit) ...[
                const SizedBox(width: 8),
                PopupMenuButton<String>(
                  icon: const Icon(Icons.more_vert),
                  onSelected: (value) {
                    switch (value) {
                      case 'edit':
                        Navigator.of(context).pushNamed(
                          '/sapeur-pompier/edit',
                          arguments: sp.id,
                        );
                        break;
                      case 'delete':
                        _showDeleteConfirmation(context, sp);
                        break;
                    }
                  },
                  itemBuilder: (context) => [
                    const PopupMenuItem(
                      value: 'edit',
                      child: Row(
                        children: [
                          Icon(Icons.edit, size: 20, color: AppColors.primary),
                          SizedBox(width: 12),
                          Text(AppStrings.edit),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'delete',
                      child: Row(
                        children: [
                          Icon(Icons.delete, size: 20, color: AppColors.error),
                          SizedBox(width: 12),
                          Text(AppStrings.delete),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoChip({
    required IconData icon,
    required String label,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: color,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  void _showFilterDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Filtres'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: const Text('Tous'),
              onTap: () {
                Navigator.of(context).pop();
                ref.read(sapeursPompiersProvider.notifier).loadSapeursPompiers();
              },
            ),
            ListTile(
              title: const Text('Aptes uniquement'),
              onTap: () {
                Navigator.of(context).pop();
                // Implémenter le filtrage
              },
            ),
            ListTile(
              title: const Text('Inaptes uniquement'),
              onTap: () {
                Navigator.of(context).pop();
                // Implémenter le filtrage
              },
            ),
            ListTile(
              title: const Text('Avec alertes'),
              onTap: () {
                Navigator.of(context).pop();
                // Implémenter le filtrage
              },
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text(AppStrings.cancel),
          ),
        ],
      ),
    );
  }

  void _showDeleteConfirmation(BuildContext context, SapeurPompier sp) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmation'),
        content: Text(
          'Êtes-vous sûr de vouloir supprimer le dossier de ${sp.nomComplet} ?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text(AppStrings.cancel),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(context).pop();
              final success = await ref
                  .read(sapeursPompiersProvider.notifier)
                  .deleteSapeurPompier(sp.id);

              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      success
                          ? AppStrings.deleteSuccess
                          : AppStrings.saveError,
                    ),
                    backgroundColor:
                        success ? AppColors.success : AppColors.error,
                  ),
                );
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
            ),
            child: const Text(AppStrings.delete),
          ),
        ],
      ),
    );
  }
}
