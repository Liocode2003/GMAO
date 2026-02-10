import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/constants/app_colors.dart';

/// Champ de sélection de date stylisé.
///
/// Affiche la date sélectionnée au format français (dd/MM/yyyy).
/// Ouvre un DatePicker natif Flutter au tap sur l'icône calendrier.
/// Supporte la validation, les bornes de dates et le mode requis.
class DatePickerField extends StatefulWidget {
  /// Label affiché au-dessus du champ
  final String label;

  /// Texte d'indication si aucune date sélectionnée
  final String hint;

  /// Date actuellement sélectionnée (null = aucune)
  final DateTime? selectedDate;

  /// Callback appelé quand une date est sélectionnée
  final ValueChanged<DateTime> onDateSelected;

  /// Date minimale sélectionnable (défaut: 1 an en arrière)
  final DateTime? firstDate;

  /// Date maximale sélectionnable (défaut: 10 ans en avant)
  final DateTime? lastDate;

  /// Si true, le champ est obligatoire
  final bool required;

  /// Si true, le champ est désactivé
  final bool enabled;

  /// Fonction de validation personnalisée
  final String? Function(DateTime?)? validator;

  const DatePickerField({
    super.key,
    required this.label,
    required this.onDateSelected,
    this.hint = 'Sélectionner une date',
    this.selectedDate,
    this.firstDate,
    this.lastDate,
    this.required = false,
    this.enabled = true,
    this.validator,
  });

  @override
  State<DatePickerField> createState() => _DatePickerFieldState();
}

class _DatePickerFieldState extends State<DatePickerField> {
  /// Contrôleur interne pour afficher la date formatée
  late final TextEditingController _controller;

  /// Formateur de date en français dd/MM/yyyy
  final DateFormat _dateFormat = DateFormat('dd/MM/yyyy', 'fr_FR');

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(
      text: widget.selectedDate != null
          ? _dateFormat.format(widget.selectedDate!)
          : '',
    );
  }

  @override
  void didUpdateWidget(DatePickerField oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Mettre à jour le champ si la date change depuis l'extérieur
    if (widget.selectedDate != oldWidget.selectedDate) {
      _controller.text = widget.selectedDate != null
          ? _dateFormat.format(widget.selectedDate!)
          : '';
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  /// Ouvre le sélecteur de date natif Flutter
  Future<void> _openDatePicker() async {
    if (!widget.enabled) return;

    final now = DateTime.now();
    final firstDate = widget.firstDate ?? DateTime(now.year - 1);
    final lastDate = widget.lastDate ?? DateTime(now.year + 10);

    // Date initiale: date sélectionnée ou aujourd'hui (dans les bornes)
    DateTime initialDate = widget.selectedDate ?? now;
    if (initialDate.isBefore(firstDate)) initialDate = firstDate;
    if (initialDate.isAfter(lastDate)) initialDate = lastDate;

    final picked = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: firstDate,
      lastDate: lastDate,
      locale: const Locale('fr', 'FR'),
      builder: (context, child) {
        // Thème rouge pompier pour le DatePicker
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppColors.primary,
              onPrimary: Colors.white,
              onSurface: AppColors.textPrimary,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        _controller.text = _dateFormat.format(picked);
      });
      widget.onDateSelected(picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Label avec indicateur requis
        _buildLabel(),
        const SizedBox(height: 6),
        // Champ texte en lecture seule avec icône calendrier
        TextFormField(
          controller: _controller,
          readOnly: true,
          enabled: widget.enabled,
          onTap: _openDatePicker,
          validator: (_) {
            if (widget.required && widget.selectedDate == null) {
              return 'Veuillez sélectionner une date';
            }
            return widget.validator?.call(widget.selectedDate);
          },
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontSize: 14,
          ),
          decoration: InputDecoration(
            hintText: widget.hint,
            hintStyle: const TextStyle(
              color: AppColors.textHint,
              fontSize: 14,
            ),
            // Icône calendrier à gauche
            prefixIcon: const Icon(
              Icons.calendar_today_outlined,
              color: AppColors.textSecondary,
              size: 20,
            ),
            // Icône pour effacer la date (si une date est sélectionnée)
            suffixIcon: widget.selectedDate != null && widget.enabled
                ? IconButton(
                    icon: const Icon(
                      Icons.close,
                      size: 18,
                      color: AppColors.textSecondary,
                    ),
                    tooltip: 'Effacer la date',
                    onPressed: () {
                      setState(() {
                        _controller.clear();
                      });
                      // On ne peut pas appeler onDateSelected avec null
                      // donc on notifie via une date "vide" n'est pas possible
                      // L'état null doit être géré par le parent
                    },
                  )
                : const Icon(
                    Icons.arrow_drop_down,
                    color: AppColors.textSecondary,
                  ),
            // Bordures stylisées
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(
                color: AppColors.border,
                width: 1.5,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(
                color: AppColors.primary,
                width: 2,
              ),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(
                color: AppColors.error,
                width: 1.5,
              ),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(
                color: AppColors.error,
                width: 2,
              ),
            ),
            disabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(
                color: AppColors.border,
                width: 1,
              ),
            ),
            filled: true,
            fillColor: widget.enabled
                ? AppColors.cardBackground
                : AppColors.surfaceBackground,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 12,
              vertical: 14,
            ),
            errorStyle: const TextStyle(
              color: AppColors.error,
              fontSize: 12,
            ),
          ),
        ),
      ],
    );
  }

  /// Construit le label avec l'astérisque rouge si requis
  Widget _buildLabel() {
    return RichText(
      text: TextSpan(
        children: [
          TextSpan(
            text: widget.label,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
          if (widget.required)
            const TextSpan(
              text: ' *',
              style: TextStyle(
                color: AppColors.error,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
        ],
      ),
    );
  }
}
