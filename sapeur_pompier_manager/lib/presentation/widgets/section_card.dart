import 'package:flutter/material.dart';

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

class SectionCard extends StatelessWidget {
  final String title;
  final Widget child;
  final Widget? trailing;
  final EdgeInsetsGeometry? contentPadding;
  final double borderRadius;

  const SectionCard({
    super.key,
    required this.title,
    required this.child,
    this.trailing,
    this.contentPadding,
    this.borderRadius = 12,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 1,
      shadowColor: Colors.black12,
      color: AppColors.surfaceColor,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(borderRadius),
        side: BorderSide(
          color: AppColors.primaryColor.withOpacity(0.12),
          width: 1,
        ),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _SectionHeader(title: title, trailing: trailing),
          Padding(
            padding: contentPadding ?? const EdgeInsets.all(16.0),
            child: child,
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final Widget? trailing;

  const _SectionHeader({required this.title, this.trailing});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
      decoration: BoxDecoration(
        color: AppColors.primaryColor.withOpacity(0.10),
        border: Border(
          bottom: BorderSide(
            color: AppColors.primaryColor.withOpacity(0.18),
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: AppColors.primaryColor,
                letterSpacing: 0.2,
              ),
            ),
          ),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}
