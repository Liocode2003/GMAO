import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

/// Carte statistique pour le tableau de bord (dashboard).
///
/// Affiche une valeur clé avec son titre, une icône et une couleur thématique.
/// Optionnellement, affiche une tendance (+5%, -2%) et supporte le tap.
///
/// ```dart
/// StatCard(
///   title: 'Sapeurs actifs',
///   value: '142',
///   subtitle: 'sur 158 inscrits',
///   icon: Icons.people_outline,
///   color: AppColors.primary,
///   trend: '+3 ce mois',
///   trendPositive: true,
///   onTap: () => _navigateToPersonnel(),
/// )
/// ```
class StatCard extends StatelessWidget {
  /// Titre de la statistique (ex: "Interventions du mois")
  final String title;

  /// Valeur principale affichée en grand (ex: "42", "89%")
  final String value;

  /// Texte secondaire sous la valeur (ex: "sur 50 planifiées")
  final String? subtitle;

  /// Icône représentant la catégorie
  final IconData icon;

  /// Couleur thématique de la carte (icône et accent)
  final Color color;

  /// Callback au tap (si null, la carte n'est pas cliquable)
  final VoidCallback? onTap;

  /// Texte de variation/tendance (ex: "+5%", "-2 ce mois")
  final String? trend;

  /// Si true, la tendance est positive (vert). Si false, négative (rouge).
  /// Si null, neutre (gris).
  final bool? trendPositive;

  /// Si true, affiche le fond de l'icône avec la couleur thématique
  final bool showColoredBackground;

  const StatCard({
    super.key,
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
    this.subtitle,
    this.onTap,
    this.trend,
    this.trendPositive,
    this.showColoredBackground = true,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.cardBackground,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        splashColor: color.withOpacity(0.08),
        highlightColor: color.withOpacity(0.04),
        child: Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            boxShadow: AppColors.cardShadow,
            border: Border.all(
              color: AppColors.border.withOpacity(0.5),
              width: 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // En-tête: icône + indicateur de navigation
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildIconContainer(),
                  if (onTap != null)
                    Icon(
                      Icons.arrow_forward_ios_rounded,
                      size: 14,
                      color: AppColors.textDisabled,
                    ),
                ],
              ),
              const SizedBox(height: 14),
              // Valeur principale
              Text(
                value,
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.5,
                  height: 1.1,
                ),
              ),
              const SizedBox(height: 4),
              // Titre
              Text(
                title,
                style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              // Sous-titre optionnel
              if (subtitle != null) ...[
                const SizedBox(height: 2),
                Text(
                  subtitle!,
                  style: const TextStyle(
                    color: AppColors.textHint,
                    fontSize: 11,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
              // Tendance optionnelle
              if (trend != null) ...[
                const SizedBox(height: 10),
                _buildTrend(),
              ],
            ],
          ),
        ),
      ),
    );
  }

  /// Conteneur de l'icône avec fond coloré
  Widget _buildIconContainer() {
    return Container(
      width: 46,
      height: 46,
      decoration: BoxDecoration(
        color: showColoredBackground
            ? color.withOpacity(0.12)
            : AppColors.surfaceBackground,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Icon(
        icon,
        color: color,
        size: 24,
      ),
    );
  }

  /// Badge de tendance coloré selon la direction
  Widget _buildTrend() {
    final Color trendColor;
    final IconData trendIcon;

    if (trendPositive == null) {
      trendColor = AppColors.textSecondary;
      trendIcon = Icons.trending_flat_rounded;
    } else if (trendPositive!) {
      trendColor = AppColors.success;
      trendIcon = Icons.trending_up_rounded;
    } else {
      trendColor = AppColors.error;
      trendIcon = Icons.trending_down_rounded;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: trendColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(trendIcon, size: 14, color: trendColor),
          const SizedBox(width: 4),
          Text(
            trend!,
            style: TextStyle(
              color: trendColor,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// MiniStatCard
// ---------------------------------------------------------------------------

/// Version compacte de StatCard pour les espaces restreints.
///
/// Disposition horizontale: icône à gauche, valeur + titre à droite.
///
/// ```dart
/// MiniStatCard(
///   title: 'Alertes',
///   value: '3',
///   icon: Icons.warning_amber_outlined,
///   color: AppColors.warning,
/// )
/// ```
class MiniStatCard extends StatelessWidget {
  /// Titre de la statistique
  final String title;

  /// Valeur principale
  final String value;

  /// Icône
  final IconData icon;

  /// Couleur thématique
  final Color color;

  /// Callback au tap
  final VoidCallback? onTap;

  const MiniStatCard({
    super.key,
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.cardBackground,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            boxShadow: AppColors.cardShadow,
            border: Border.all(color: AppColors.border.withOpacity(0.5)),
          ),
          child: Row(
            children: [
              // Icône
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(width: 12),
              // Valeur + titre
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      value,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        height: 1.1,
                      ),
                    ),
                    Text(
                      title,
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
