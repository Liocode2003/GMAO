import 'package:flutter/material.dart';
import 'package:sapeur_pompier_manager/data/models/sapeur_pompier_model.dart';

class AppColors {
  static const Color primaryColor = Color(0xFF1565C0);
  static const Color secondaryColor = Color(0xFF0288D1);
  static const Color successColor = Color(0xFF2E7D32);
  static const Color warningColor = Color(0xFFE65100);
  static const Color dangerColor = Color(0xFFC62828);
  static const Color backgroundColor = Color(0xFFF5F5F5);
  static const Color surfaceColor = Colors.white;
  static const Color textPrimary = Color(0xFF212121);
  static const Color textSecondary = Color(0xFF757575);
}

class SapeurPompierCard extends StatelessWidget {
  final SapeurPompierModel sapeurPompier;
  final VoidCallback? onTap;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;
  final VoidCallback? onView;

  const SapeurPompierCard({
    super.key,
    required this.sapeurPompier,
    this.onTap,
    this.onEdit,
    this.onDelete,
    this.onView,
  });

  String get _initials {
    final nom = sapeurPompier.nom?.trim() ?? '';
    final prenom = sapeurPompier.prenom?.trim() ?? '';
    final nomInitial = nom.isNotEmpty ? nom[0].toUpperCase() : '';
    final prenomInitial = prenom.isNotEmpty ? prenom[0].toUpperCase() : '';
    if (nomInitial.isEmpty && prenomInitial.isEmpty) return '?';
    return '$prenomInitial$nomInitial';
  }

  String get _fullName {
    final prenom = sapeurPompier.prenom?.trim() ?? '';
    final nom = sapeurPompier.nom?.trim() ?? '';
    if (prenom.isEmpty && nom.isEmpty) return 'Nom non renseigné';
    return '$prenom $nom'.trim();
  }

  _StatusConfig get _statusConfig {
    switch ((sapeurPompier.statut ?? '').toLowerCase()) {
      case 'actif':
        return _StatusConfig(
          label: 'Actif',
          color: AppColors.successColor,
          background: AppColors.successColor.withOpacity(0.1),
        );
      case 'inapte':
        return _StatusConfig(
          label: 'Inapte',
          color: AppColors.dangerColor,
          background: AppColors.dangerColor.withOpacity(0.1),
        );
      case 'retraite':
      case 'retraité':
        return _StatusConfig(
          label: 'Retraité',
          color: AppColors.textSecondary,
          background: AppColors.textSecondary.withOpacity(0.1),
        );
      default:
        return _StatusConfig(
          label: sapeurPompier.statut ?? 'Inconnu',
          color: AppColors.warningColor,
          background: AppColors.warningColor.withOpacity(0.1),
        );
    }
  }

  double get _completionPercentage {
    return sapeurPompier.completionPercentage ?? 0.0;
  }

  bool get _hasMedicalAlerts {
    return sapeurPompier.hasMedicalAlerts ?? false;
  }

  @override
  Widget build(BuildContext context) {
    final status = _statusConfig;
    final completion = _completionPercentage.clamp(0.0, 1.0);

    return Card(
      elevation: 1.5,
      shadowColor: Colors.black12,
      color: AppColors.surfaceColor,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: AppColors.primaryColor.withOpacity(0.10),
          width: 1,
        ),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        onLongPress: (onView != null || onEdit != null || onDelete != null)
            ? () => _showContextMenu(context)
            : null,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(14.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _AvatarWidget(initials: _initials),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Text(
                                _fullName,
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textPrimary,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 8),
                            if (_hasMedicalAlerts) _AlertBadge(),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          sapeurPompier.matricule ?? 'Matricule non renseigné',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textSecondary,
                            fontFamily: 'monospace',
                          ),
                        ),
                        if (sapeurPompier.grade != null &&
                            sapeurPompier.grade!.isNotEmpty) ...[
                          const SizedBox(height: 2),
                          Text(
                            sapeurPompier.grade!,
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.primaryColor,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  _StatusBadge(config: status),
                ],
              ),
              const SizedBox(height: 12),
              _CompletionBar(percentage: completion),
            ],
          ),
        ),
      ),
    );
  }

  void _showContextMenu(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(top: 12, bottom: 8),
                decoration: BoxDecoration(
                  color: AppColors.textSecondary.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 4.0),
                child: Text(
                  _fullName,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              const Divider(),
              if (onView != null)
                ListTile(
                  leading: const Icon(Icons.visibility_outlined,
                      color: AppColors.primaryColor),
                  title: const Text('Voir le dossier'),
                  onTap: () {
                    Navigator.pop(ctx);
                    onView!();
                  },
                ),
              if (onEdit != null)
                ListTile(
                  leading: const Icon(Icons.edit_outlined,
                      color: AppColors.secondaryColor),
                  title: const Text('Modifier'),
                  onTap: () {
                    Navigator.pop(ctx);
                    onEdit!();
                  },
                ),
              if (onDelete != null)
                ListTile(
                  leading: const Icon(Icons.delete_outline,
                      color: AppColors.dangerColor),
                  title: const Text(
                    'Supprimer',
                    style: TextStyle(color: AppColors.dangerColor),
                  ),
                  onTap: () {
                    Navigator.pop(ctx);
                    onDelete!();
                  },
                ),
              const SizedBox(height: 8),
            ],
          ),
        );
      },
    );
  }
}

class _StatusConfig {
  final String label;
  final Color color;
  final Color background;

  const _StatusConfig({
    required this.label,
    required this.color,
    required this.background,
  });
}

class _AvatarWidget extends StatelessWidget {
  final String initials;

  const _AvatarWidget({required this.initials});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        color: AppColors.primaryColor.withOpacity(0.12),
        shape: BoxShape.circle,
        border: Border.all(
          color: AppColors.primaryColor.withOpacity(0.3),
          width: 1.5,
        ),
      ),
      child: Center(
        child: Text(
          initials,
          style: const TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.bold,
            color: AppColors.primaryColor,
          ),
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final _StatusConfig config;

  const _StatusBadge({required this.config});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: config.background,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: config.color.withOpacity(0.4), width: 1),
      ),
      child: Text(
        config.label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: config.color,
        ),
      ),
    );
  }
}

class _AlertBadge extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 22,
      height: 22,
      decoration: BoxDecoration(
        color: AppColors.dangerColor.withOpacity(0.1),
        shape: BoxShape.circle,
        border:
            Border.all(color: AppColors.dangerColor.withOpacity(0.4), width: 1),
      ),
      child: const Icon(
        Icons.warning_amber_rounded,
        size: 13,
        color: AppColors.dangerColor,
      ),
    );
  }
}

class _CompletionBar extends StatelessWidget {
  final double percentage;

  const _CompletionBar({required this.percentage});

  Color get _barColor {
    if (percentage >= 0.8) return AppColors.successColor;
    if (percentage >= 0.4) return AppColors.warningColor;
    return AppColors.dangerColor;
  }

  @override
  Widget build(BuildContext context) {
    final percent = (percentage * 100).toInt();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Dossier complété',
              style: TextStyle(
                fontSize: 11,
                color: AppColors.textSecondary,
              ),
            ),
            Text(
              '$percent%',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: _barColor,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: percentage,
            minHeight: 5,
            backgroundColor: AppColors.textSecondary.withOpacity(0.12),
            valueColor: AlwaysStoppedAnimation<Color>(_barColor),
          ),
        ),
      ],
    );
  }
}
