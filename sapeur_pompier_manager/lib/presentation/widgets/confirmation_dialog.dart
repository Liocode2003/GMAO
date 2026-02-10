import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

/// Dialogue de confirmation réutilisable.
///
/// Affiche un dialog modal avec un titre, un message et deux boutons
/// (confirmer / annuler). La couleur du bouton de confirmation change
/// selon que l'action est destructive (isDanger) ou standard.
///
/// Usage recommandé via la méthode statique:
/// ```dart
/// final confirmed = await ConfirmationDialog.show(
///   context,
///   title: 'Supprimer le sapeur-pompier',
///   message: 'Cette action est irréversible. Continuer ?',
///   isDanger: true,
/// );
/// if (confirmed == true) {
///   _deleteSapeur();
/// }
/// ```
class ConfirmationDialog extends StatelessWidget {
  /// Titre du dialogue
  final String title;

  /// Corps du message explicatif
  final String message;

  /// Texte du bouton de confirmation (défaut: 'Confirmer')
  final String confirmText;

  /// Texte du bouton d'annulation (défaut: 'Annuler')
  final String cancelText;

  /// Si true, le bouton de confirmation est rouge (action destructive)
  final bool isDanger;

  /// Icône affichée dans l'en-tête du dialogue (optionnelle)
  final IconData? icon;

  const ConfirmationDialog({
    super.key,
    required this.title,
    required this.message,
    this.confirmText = 'Confirmer',
    this.cancelText = 'Annuler',
    this.isDanger = false,
    this.icon,
  });

  // ---------------------------------------------------------------------------
  // Méthode statique utilitaire
  // ---------------------------------------------------------------------------

  /// Affiche le dialogue de confirmation et retourne le résultat.
  ///
  /// Retourne:
  /// - `true` si l'utilisateur confirme
  /// - `false` si l'utilisateur annule
  /// - `null` si le dialogue est fermé sans action (retour arrière)
  static Future<bool?> show(
    BuildContext context, {
    required String title,
    required String message,
    String confirmText = 'Confirmer',
    String cancelText = 'Annuler',
    bool isDanger = false,
    IconData? icon,
  }) {
    return showDialog<bool>(
      context: context,
      barrierDismissible: true,
      builder: (_) => ConfirmationDialog(
        title: title,
        message: message,
        confirmText: confirmText,
        cancelText: cancelText,
        isDanger: isDanger,
        icon: icon,
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Variantes prédéfinies
  // ---------------------------------------------------------------------------

  /// Dialogue de suppression avec paramètres préconfigurés.
  static Future<bool?> showDelete(
    BuildContext context, {
    required String itemName,
    String? customMessage,
  }) {
    return show(
      context,
      title: 'Supprimer $itemName ?',
      message: customMessage ??
          'Cette action est irréversible. '
              '$itemName sera définitivement supprimé.',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      isDanger: true,
      icon: Icons.delete_outline,
    );
  }

  /// Dialogue de déconnexion.
  static Future<bool?> showLogout(BuildContext context) {
    return show(
      context,
      title: 'Se déconnecter ?',
      message: 'Vous serez redirigé vers la page de connexion.',
      confirmText: 'Se déconnecter',
      cancelText: 'Rester',
      isDanger: false,
      icon: Icons.logout,
    );
  }

  // ---------------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    final confirmColor = isDanger ? AppColors.error : AppColors.primary;

    return AlertDialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      // En-tête
      title: Row(
        children: [
          if (icon != null) ...[
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: confirmColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                icon,
                color: confirmColor,
                size: 22,
              ),
            ),
            const SizedBox(width: 12),
          ],
          Expanded(
            child: Text(
              title,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 17,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
      // Corps du message
      content: Text(
        message,
        style: const TextStyle(
          color: AppColors.textSecondary,
          fontSize: 14,
          height: 1.5,
        ),
      ),
      // Boutons d'action
      actionsPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      actions: [
        // Bouton Annuler
        OutlinedButton(
          onPressed: () => Navigator.of(context).pop(false),
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.textSecondary,
            side: const BorderSide(color: AppColors.border, width: 1.5),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          ),
          child: Text(cancelText),
        ),
        // Bouton Confirmer
        ElevatedButton(
          onPressed: () => Navigator.of(context).pop(true),
          style: ElevatedButton.styleFrom(
            backgroundColor: confirmColor,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            elevation: 0,
          ),
          child: Text(
            confirmText,
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }
}
