import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/constants/app_colors.dart';

/// Widget TextFormField stylisé et réutilisable pour toute l'application.
///
/// Supporte:
/// - Label avec indicateur requis (*)
/// - Icônes préfixe et suffixe
/// - Validation intégrée
/// - Mode lecture seule
/// - Textarea multi-lignes
/// - Types de clavier configurables
/// - Callback onChanged
class CustomTextField extends StatelessWidget {
  /// Label affiché au-dessus du champ
  final String label;

  /// Texte d'indication dans le champ vide
  final String? hint;

  /// Contrôleur de texte
  final TextEditingController? controller;

  /// Icône affichée à gauche du champ
  final IconData? prefixIcon;

  /// Widget affiché à droite du champ (ex: bouton mot de passe)
  final Widget? suffixIcon;

  /// Fonction de validation, retourne un message d'erreur ou null
  final String? Function(String?)? validator;

  /// Callback appelé à chaque modification du texte
  final ValueChanged<String>? onChanged;

  /// Callback appelé lors de la soumission du formulaire
  final ValueChanged<String>? onFieldSubmitted;

  /// Si true, le champ est non modifiable
  final bool readOnly;

  /// Nombre maximum de lignes (>1 = textarea)
  final int maxLines;

  /// Nombre minimum de lignes
  final int? minLines;

  /// Type de clavier à afficher
  final TextInputType keyboardType;

  /// Si true, ajoute un astérisque rouge au label
  final bool required;

  /// Si true, masque le texte (pour les mots de passe)
  final bool obscureText;

  /// Valeur initiale du champ (sans contrôleur)
  final String? initialValue;

  /// Si false, le champ est désactivé
  final bool enabled;

  /// Longueur maximale du texte
  final int? maxLength;

  /// Formateurs d'entrée (ex: seulement des chiffres)
  final List<TextInputFormatter>? inputFormatters;

  /// Action du clavier (ex: TextInputAction.next)
  final TextInputAction? textInputAction;

  /// Focus node pour gérer le focus entre les champs
  final FocusNode? focusNode;

  /// Callback appelé lors du tap sur le champ (utile avec readOnly)
  final VoidCallback? onTap;

  const CustomTextField({
    super.key,
    required this.label,
    this.hint,
    this.controller,
    this.prefixIcon,
    this.suffixIcon,
    this.validator,
    this.onChanged,
    this.onFieldSubmitted,
    this.readOnly = false,
    this.maxLines = 1,
    this.minLines,
    this.keyboardType = TextInputType.text,
    this.required = false,
    this.obscureText = false,
    this.initialValue,
    this.enabled = true,
    this.maxLength,
    this.inputFormatters,
    this.textInputAction,
    this.focusNode,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Label avec indicateur requis
        _buildLabel(),
        const SizedBox(height: 6),
        // Champ de texte
        TextFormField(
          controller: controller,
          initialValue: initialValue,
          readOnly: readOnly,
          maxLines: obscureText ? 1 : maxLines,
          minLines: minLines,
          keyboardType: keyboardType,
          obscureText: obscureText,
          enabled: enabled,
          maxLength: maxLength,
          inputFormatters: inputFormatters,
          textInputAction: textInputAction,
          focusNode: focusNode,
          onTap: onTap,
          onChanged: onChanged,
          onFieldSubmitted: onFieldSubmitted,
          validator: required
              ? (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Ce champ est obligatoire';
                  }
                  return validator?.call(value);
                }
              : validator,
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontSize: 14,
          ),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(
              color: AppColors.textHint,
              fontSize: 14,
            ),
            // Icône préfixe
            prefixIcon: prefixIcon != null
                ? Icon(
                    prefixIcon,
                    color: AppColors.textSecondary,
                    size: 20,
                  )
                : null,
            // Icône/widget suffixe
            suffixIcon: suffixIcon,
            // Style de la bordure normale
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(
                color: AppColors.border,
                width: 1.5,
              ),
            ),
            // Style de la bordure au focus
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(
                color: AppColors.primary,
                width: 2,
              ),
            ),
            // Style de la bordure en erreur
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(
                color: AppColors.error,
                width: 1.5,
              ),
            ),
            // Style de la bordure au focus avec erreur
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(
                color: AppColors.error,
                width: 2,
              ),
            ),
            // Style de la bordure désactivée
            disabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(
                color: AppColors.border,
                width: 1,
              ),
            ),
            // Couleur de fond
            filled: true,
            fillColor: enabled && !readOnly
                ? AppColors.cardBackground
                : AppColors.surfaceBackground,
            // Padding interne
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 12,
              vertical: 14,
            ),
            // Style du texte d'erreur
            errorStyle: const TextStyle(
              color: AppColors.error,
              fontSize: 12,
            ),
            // Supprimer le compteur de caractères par défaut
            counterText: '',
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
            text: label,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
          if (required)
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
