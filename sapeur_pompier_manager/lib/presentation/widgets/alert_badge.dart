import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

// ---------------------------------------------------------------------------
// AlertBadge
// ---------------------------------------------------------------------------

/// Badge d'alerte numérique affiché par-dessus un widget enfant (icône, bouton...).
///
/// - Rouge si count > 0
/// - Invisible si count == 0
/// - Affiche "99+" au-delà de 99 alertes
///
/// ```dart
/// AlertBadge(
///   count: _unreadAlerts,
///   child: const Icon(Icons.notifications_outlined),
/// )
/// ```
class AlertBadge extends StatelessWidget {
  /// Nombre d'alertes à afficher dans le badge
  final int count;

  /// Widget sur lequel afficher le badge (icône, bouton, etc.)
  final Widget child;

  /// Couleur du badge (défaut: rouge AppColors.primary)
  final Color? badgeColor;

  /// Couleur du texte du badge (défaut: blanc)
  final Color? textColor;

  /// Position horizontale du badge par rapport au coin supérieur droit
  final double? right;

  /// Position verticale du badge par rapport au coin supérieur droit
  final double? top;

  const AlertBadge({
    super.key,
    required this.count,
    required this.child,
    this.badgeColor,
    this.textColor,
    this.right,
    this.top,
  });

  @override
  Widget build(BuildContext context) {
    // Ne rien afficher si count == 0
    if (count <= 0) return child;

    return Stack(
      clipBehavior: Clip.none,
      children: [
        child,
        Positioned(
          right: right ?? -4,
          top: top ?? -4,
          child: _buildBadge(),
        ),
      ],
    );
  }

  Widget _buildBadge() {
    // Texte affiché: nombre ou "99+" si dépassement
    final String label = count > 99 ? '99+' : count.toString();
    // Badge plus large pour les nombres à 2+ chiffres
    final bool isWide = count > 9 || count > 99;

    return Container(
      constraints: BoxConstraints(
        minWidth: isWide ? 20 : 18,
        minHeight: 18,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
      decoration: BoxDecoration(
        color: badgeColor ?? AppColors.primary,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.white, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: (badgeColor ?? AppColors.primary).withOpacity(0.4),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Text(
        label,
        style: TextStyle(
          color: textColor ?? Colors.white,
          fontSize: 10,
          fontWeight: FontWeight.w700,
          height: 1.2,
        ),
        textAlign: TextAlign.center,
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------

/// Badge de statut coloré avec texte.
///
/// Utilisé pour afficher les statuts des sapeurs-pompiers, des interventions,
/// des équipements, etc.
///
/// ```dart
/// StatusBadge(
///   label: 'Apte',
///   color: AppColors.statusApte,
/// )
///
/// StatusBadge(
///   label: 'En cours',
///   color: AppColors.statusEnCours,
/// )
/// ```
class StatusBadge extends StatelessWidget {
  /// Texte affiché dans le badge
  final String label;

  /// Couleur de fond du badge
  final Color color;

  /// Couleur du texte (défaut: blanc)
  final Color? textColor;

  /// Style de rendu (filled = fond coloré, outlined = contour coloré)
  final BadgeStyle style;

  /// Icône optionnelle à gauche du texte
  final IconData? icon;

  const StatusBadge({
    super.key,
    required this.label,
    required this.color,
    this.textColor,
    this.style = BadgeStyle.filled,
    this.icon,
  });

  // ---------------------------------------------------------------------------
  // Constructeurs de statuts prédéfinis
  // ---------------------------------------------------------------------------

  /// Badge "Apte" vert
  const StatusBadge.apte({super.key})
      : label = 'Apte',
        color = AppColors.statusApte,
        textColor = null,
        style = BadgeStyle.filled,
        icon = null;

  /// Badge "Inapte" rouge
  const StatusBadge.inapte({super.key})
      : label = 'Inapte',
        color = AppColors.statusInapte,
        textColor = null,
        style = BadgeStyle.filled,
        icon = null;

  /// Badge "En attente" orange
  const StatusBadge.enAttente({super.key})
      : label = 'En attente',
        color = AppColors.statusEnAttente,
        textColor = null,
        style = BadgeStyle.filled,
        icon = null;

  /// Badge "En cours" bleu
  const StatusBadge.enCours({super.key})
      : label = 'En cours',
        color = AppColors.statusEnCours,
        textColor = null,
        style = BadgeStyle.filled,
        icon = null;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: _buildDecoration(),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(
              icon,
              size: 12,
              color: _effectiveTextColor,
            ),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              color: _effectiveTextColor,
              fontSize: 12,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }

  BoxDecoration _buildDecoration() {
    switch (style) {
      case BadgeStyle.filled:
        return BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(20),
        );
      case BadgeStyle.outlined:
        return BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color, width: 1),
        );
      case BadgeStyle.soft:
        return BoxDecoration(
          color: color.withOpacity(0.15),
          borderRadius: BorderRadius.circular(20),
        );
    }
  }

  Color get _effectiveTextColor {
    if (textColor != null) return textColor!;
    switch (style) {
      case BadgeStyle.filled:
        return Colors.white;
      case BadgeStyle.outlined:
      case BadgeStyle.soft:
        return color;
    }
  }
}

/// Styles de rendu disponibles pour StatusBadge
enum BadgeStyle {
  /// Fond plein avec texte blanc
  filled,

  /// Bordure colorée avec fond transparent légèrement teinté
  outlined,

  /// Fond très légèrement teinté sans bordure
  soft,
}

// ---------------------------------------------------------------------------
// PriorityBadge
// ---------------------------------------------------------------------------

/// Badge de priorité pour les alertes et interventions.
///
/// ```dart
/// PriorityBadge(priority: AlertPriority.critical)
/// ```
class PriorityBadge extends StatelessWidget {
  final AlertPriority priority;

  const PriorityBadge({super.key, required this.priority});

  @override
  Widget build(BuildContext context) {
    return StatusBadge(
      label: priority.label,
      color: priority.color,
      style: BadgeStyle.filled,
    );
  }
}

/// Niveaux de priorité des alertes
enum AlertPriority {
  /// Priorité critique (rouge foncé)
  critical,

  /// Priorité haute (orange foncé)
  high,

  /// Priorité moyenne (orange clair)
  medium,

  /// Priorité basse (bleu)
  low;

  String get label => switch (this) {
        AlertPriority.critical => 'Critique',
        AlertPriority.high => 'Haute',
        AlertPriority.medium => 'Moyenne',
        AlertPriority.low => 'Basse',
      };

  Color get color => switch (this) {
        AlertPriority.critical => AppColors.alertCritical,
        AlertPriority.high => AppColors.alertHigh,
        AlertPriority.medium => AppColors.alertMedium,
        AlertPriority.low => AppColors.alertLow,
      };
}
