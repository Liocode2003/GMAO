import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../providers/dashboard_provider.dart';
import '../providers/auth_provider.dart';
import '../widgets/app_layout.dart';

/// Écran principal du tableau de bord
class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboardState = ref.watch(dashboardProvider);
    final authState = ref.watch(authProvider);

    return AppLayout(
      currentRoute: '/dashboard',
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: RefreshIndicator(
          onRefresh: () async {
            await ref.read(dashboardProvider.notifier).refresh();
          },
          child: dashboardState.isLoading && dashboardState.statistiques.isEmpty
              ? const Center(child: CircularProgressIndicator())
              : dashboardState.error != null
                  ? _buildError(context, ref, dashboardState.error!)
                  : _buildContent(context, ref, dashboardState),
        ),
      ),
    );
  }

  Widget _buildError(BuildContext context, WidgetRef ref, String error) {
    return Center(
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
            error,
            style: Theme.of(context).textTheme.bodyMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () {
              ref.read(dashboardProvider.notifier).refresh();
            },
            icon: const Icon(Icons.refresh),
            label: const Text('Réessayer'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContent(
      BuildContext context, WidgetRef ref, DashboardState state) {
    return CustomScrollView(
      slivers: [
        // AppBar
        SliverAppBar(
          floating: true,
          backgroundColor: Colors.white,
          elevation: 2,
          title: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                AppStrings.dashboard,
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                'Vue d\'ensemble du système',
                style: TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 14,
                  fontWeight: FontWeight.normal,
                ),
              ),
            ],
          ),
          automaticallyImplyLeading: false,
          actions: [
            if (state.isLoading)
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
                ref.read(dashboardProvider.notifier).refresh();
              },
              tooltip: 'Rafraîchir',
            ),
            const SizedBox(width: 8),
          ],
        ),

        // Content
        SliverPadding(
          padding: const EdgeInsets.all(24),
          sliver: SliverList(
            delegate: SliverChildListDelegate([
              // Cartes statistiques
              _buildStatsCards(context, ref, state),
              const SizedBox(height: 24),

              // Section des alertes
              _buildAlertsSection(context, ref, state),
              const SizedBox(height: 24),

              // Actions rapides
              _buildQuickActions(context),
            ]),
          ),
        ),
      ],
    );
  }

  Widget _buildStatsCards(
      BuildContext context, WidgetRef ref, DashboardState state) {
    final totalSP = ref.watch(totalSapeursPompiersProvider);
    final aptes = ref.watch(totalAptesProvider);
    final inaptes = ref.watch(totalInaptesProvider);
    final vaccinsExpires = ref.watch(totalVaccinsExpiresProvider);
    final vaccinsProches = ref.watch(totalVaccinsProchesExpirationProvider);
    final indisponibilites = ref.watch(totalIndisponibilitesProvider);
    final pourcentageAptitude = ref.watch(pourcentageAptitudeProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Statistiques générales',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 16),
        LayoutBuilder(
          builder: (context, constraints) {
            final crossAxisCount = constraints.maxWidth > 1200
                ? 4
                : constraints.maxWidth > 800
                    ? 3
                    : constraints.maxWidth > 600
                        ? 2
                        : 1;

            return GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: crossAxisCount,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              childAspectRatio: 1.8,
              children: [
                _buildStatCard(
                  title: AppStrings.totalSapeursPompiers,
                  value: totalSP.toString(),
                  icon: Icons.people,
                  color: AppColors.primary,
                  trend: null,
                ),
                _buildStatCard(
                  title: 'Aptes au service',
                  value: aptes.toString(),
                  subtitle:
                      '${pourcentageAptitude.toStringAsFixed(1)}% de l\'effectif',
                  icon: Icons.check_circle,
                  color: AppColors.success,
                  trend: null,
                ),
                _buildStatCard(
                  title: 'Inaptes',
                  value: inaptes.toString(),
                  icon: Icons.cancel,
                  color: AppColors.error,
                  trend: null,
                ),
                _buildStatCard(
                  title: AppStrings.vaccinationsExpirees,
                  value: vaccinsExpires.toString(),
                  icon: Icons.warning,
                  color: AppColors.alertCritical,
                  trend: vaccinsProches > 0
                      ? '+$vaccinsProches proches'
                      : null,
                ),
                _buildStatCard(
                  title: 'Indisponibilités',
                  value: indisponibilites.toString(),
                  subtitle: 'En cours',
                  icon: Icons.event_busy,
                  color: AppColors.warning,
                  trend: null,
                ),
                _buildStatCard(
                  title: 'Dossiers complets',
                  value:
                      '${((state.statistiques['dossiersComplets'] ?? 0) / (totalSP > 0 ? totalSP : 1) * 100).toStringAsFixed(0)}%',
                  subtitle:
                      '${state.statistiques['dossiersComplets'] ?? 0} / $totalSP',
                  icon: Icons.folder_special,
                  color: AppColors.info,
                  trend: null,
                ),
              ],
            );
          },
        ),
      ],
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    String? subtitle,
    required IconData icon,
    required Color color,
    String? trend,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: AppColors.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              const Spacer(),
              if (trend != null)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.warning.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    trend,
                    style: const TextStyle(
                      fontSize: 10,
                      color: AppColors.warning,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
            ],
          ),
          const Spacer(),
          Text(
            value,
            style: TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: const TextStyle(
              fontSize: 13,
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w500,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: const TextStyle(
                fontSize: 11,
                color: AppColors.textHint,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildAlertsSection(
      BuildContext context, WidgetRef ref, DashboardState state) {
    final hasAlerts = state.vaccinationsExpirees.isNotEmpty ||
        state.vaccinationsProchesExpiration.isNotEmpty;

    if (!hasAlerts) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: AppColors.success.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.success.withOpacity(0.3)),
        ),
        child: Row(
          children: const [
            Icon(Icons.check_circle, color: AppColors.success, size: 32),
            SizedBox(width: 16),
            Expanded(
              child: Text(
                'Aucune alerte active pour le moment',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                  color: AppColors.success,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Text(
              'Alertes actives',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(width: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.error,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                '${state.vaccinationsExpirees.length + state.vaccinationsProchesExpiration.length}',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: AppColors.cardShadow,
          ),
          child: Column(
            children: [
              // Vaccinations expirées
              if (state.vaccinationsExpirees.isNotEmpty) ...[
                _buildAlertTile(
                  icon: Icons.error,
                  iconColor: AppColors.error,
                  title: AppStrings.alertVaccinationExpiree,
                  count: state.vaccinationsExpirees.length,
                  onTap: () {
                    // Navigation vers la liste des vaccinations expirées
                  },
                ),
              ],

              // Vaccinations proches de l'expiration
              if (state.vaccinationsProchesExpiration.isNotEmpty) ...[
                if (state.vaccinationsExpirees.isNotEmpty)
                  const Divider(height: 1),
                _buildAlertTile(
                  icon: Icons.warning,
                  iconColor: AppColors.warning,
                  title: AppStrings.alertVaccinationProche,
                  count: state.vaccinationsProchesExpiration.length,
                  onTap: () {
                    // Navigation vers la liste des vaccinations proches
                  },
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildAlertTile({
    required IconData icon,
    required Color iconColor,
    required String title,
    required int count,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: iconColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: iconColor, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '$count élément${count > 1 ? 's' : ''} concerné${count > 1 ? 's' : ''}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.chevron_right,
              color: AppColors.textSecondary,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Actions rapides',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 16,
          runSpacing: 16,
          children: [
            _buildActionButton(
              context: context,
              icon: Icons.person_add,
              label: 'Nouveau sapeur-pompier',
              color: AppColors.primary,
              onTap: () {
                Navigator.of(context).pushNamed('/sapeur-pompier/create');
              },
            ),
            _buildActionButton(
              context: context,
              icon: Icons.list,
              label: 'Liste complète',
              color: AppColors.secondary,
              onTap: () {
                Navigator.of(context).pushNamed('/liste');
              },
            ),
            _buildActionButton(
              context: context,
              icon: Icons.vaccines,
              label: 'Gérer vaccinations',
              color: AppColors.info,
              onTap: () {
                // Navigation vers gestion des vaccinations
              },
            ),
            _buildActionButton(
              context: context,
              icon: Icons.assessment,
              label: 'Rapports',
              color: AppColors.success,
              onTap: () {
                // Navigation vers les rapports
              },
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildActionButton({
    required BuildContext context,
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: 180,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: AppColors.cardShadow,
          border: Border.all(
            color: color.withOpacity(0.2),
            width: 2,
          ),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 32),
            const SizedBox(height: 12),
            Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
