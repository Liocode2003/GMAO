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

class InfoRow extends StatelessWidget {
  final String label;
  final dynamic value; // String or Widget
  final IconData? icon;
  final bool showDivider;
  final TextStyle? labelStyle;
  final TextStyle? valueStyle;
  final CrossAxisAlignment crossAxisAlignment;

  const InfoRow({
    super.key,
    required this.label,
    required this.value,
    this.icon,
    this.showDivider = true,
    this.labelStyle,
    this.valueStyle,
    this.crossAxisAlignment = CrossAxisAlignment.center,
  });

  static const String _fallback = 'Non renseigné';

  Widget _buildValue() {
    if (value is Widget) {
      return value as Widget;
    }

    final text = (value == null || value.toString().trim().isEmpty)
        ? _fallback
        : value.toString().trim();

    final isPlaceholder = text == _fallback;

    return Text(
      text,
      style: valueStyle ??
          TextStyle(
            fontSize: 14,
            color: isPlaceholder ? AppColors.textSecondary : AppColors.textPrimary,
            fontStyle: isPlaceholder ? FontStyle.italic : FontStyle.normal,
            fontWeight: FontWeight.w500,
          ),
      textAlign: TextAlign.end,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 10.0),
          child: Row(
            crossAxisAlignment: crossAxisAlignment,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 18, color: AppColors.primaryColor),
                const SizedBox(width: 10),
              ],
              Expanded(
                flex: 4,
                child: Text(
                  label,
                  style: labelStyle ??
                      const TextStyle(
                        fontSize: 14,
                        color: AppColors.textSecondary,
                        fontWeight: FontWeight.w400,
                      ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                flex: 5,
                child: Align(
                  alignment: Alignment.centerRight,
                  child: _buildValue(),
                ),
              ),
            ],
          ),
        ),
        if (showDivider)
          Divider(
            height: 1,
            thickness: 1,
            color: AppColors.textSecondary.withOpacity(0.12),
          ),
      ],
    );
  }
}
