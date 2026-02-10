import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

/// Dimensions par défaut pour tous les boutons
const double _kButtonHeight = 48.0;
const double _kButtonBorderRadius = 8.0;
const double _kButtonFontSize = 14.0;
const EdgeInsets _kButtonPadding =
    EdgeInsets.symmetric(horizontal: 24, vertical: 12);

// ---------------------------------------------------------------------------
// PrimaryButton
// ---------------------------------------------------------------------------

/// Bouton principal de l'application (ElevatedButton rouge pompier).
///
/// Utilisation:
/// ```dart
/// PrimaryButton(
///   label: 'Enregistrer',
///   icon: Icons.save,
///   onPressed: () => _save(),
/// )
/// ```
class PrimaryButton extends StatelessWidget {
  /// Texte affiché sur le bouton
  final String label;

  /// Icône optionnelle à gauche du texte
  final IconData? icon;

  /// Callback déclenché au tap. Si null, le bouton est désactivé.
  final VoidCallback? onPressed;

  /// Si true, le bouton prend toute la largeur disponible
  final bool fullWidth;

  /// Taille des boutons (défaut: medium)
  final ButtonSize size;

  const PrimaryButton({
    super.key,
    required this.label,
    this.icon,
    this.onPressed,
    this.fullWidth = false,
    this.size = ButtonSize.medium,
  });

  @override
  Widget build(BuildContext context) {
    final buttonChild = _buildChild();

    final button = ElevatedButton(
      onPressed: onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        disabledBackgroundColor: AppColors.textDisabled,
        disabledForegroundColor: Colors.white,
        minimumSize: Size(0, _sizeHeight),
        padding: _sizePadding,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(_kButtonBorderRadius),
        ),
        elevation: 2,
        shadowColor: AppColors.primary.withOpacity(0.4),
        textStyle: TextStyle(
          fontSize: _sizeFontSize,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
        ),
      ),
      child: buttonChild,
    );

    return fullWidth ? SizedBox(width: double.infinity, child: button) : button;
  }

  Widget _buildChild() {
    if (icon != null) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: _sizeIconSize),
          const SizedBox(width: 8),
          Text(label),
        ],
      );
    }
    return Text(label);
  }

  double get _sizeHeight => switch (size) {
        ButtonSize.small => 36,
        ButtonSize.medium => _kButtonHeight,
        ButtonSize.large => 56,
      };

  double get _sizeFontSize => switch (size) {
        ButtonSize.small => 12,
        ButtonSize.medium => _kButtonFontSize,
        ButtonSize.large => 16,
      };

  double get _sizeIconSize => switch (size) {
        ButtonSize.small => 14,
        ButtonSize.medium => 18,
        ButtonSize.large => 22,
      };

  EdgeInsets get _sizePadding => switch (size) {
        ButtonSize.small => const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        ButtonSize.medium => _kButtonPadding,
        ButtonSize.large => const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
      };
}

// ---------------------------------------------------------------------------
// SecondaryButton
// ---------------------------------------------------------------------------

/// Bouton secondaire (OutlinedButton avec bordure rouge pompier).
///
/// Utilisation:
/// ```dart
/// SecondaryButton(
///   label: 'Annuler',
///   icon: Icons.close,
///   onPressed: () => Navigator.pop(context),
/// )
/// ```
class SecondaryButton extends StatelessWidget {
  /// Texte affiché sur le bouton
  final String label;

  /// Icône optionnelle à gauche du texte
  final IconData? icon;

  /// Callback déclenché au tap. Si null, le bouton est désactivé.
  final VoidCallback? onPressed;

  /// Si true, le bouton prend toute la largeur disponible
  final bool fullWidth;

  /// Taille du bouton
  final ButtonSize size;

  /// Couleur de la bordure et du texte (défaut: primary)
  final Color? color;

  const SecondaryButton({
    super.key,
    required this.label,
    this.icon,
    this.onPressed,
    this.fullWidth = false,
    this.size = ButtonSize.medium,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveColor = color ?? AppColors.primary;

    final button = OutlinedButton(
      onPressed: onPressed,
      style: OutlinedButton.styleFrom(
        foregroundColor: effectiveColor,
        disabledForegroundColor: AppColors.textDisabled,
        minimumSize: Size(0, _sizeHeight),
        padding: _sizePadding,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(_kButtonBorderRadius),
        ),
        side: BorderSide(
          color: onPressed != null ? effectiveColor : AppColors.textDisabled,
          width: 1.5,
        ),
        textStyle: TextStyle(
          fontSize: _sizeFontSize,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
        ),
      ),
      child: _buildChild(),
    );

    return fullWidth ? SizedBox(width: double.infinity, child: button) : button;
  }

  Widget _buildChild() {
    if (icon != null) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: _sizeIconSize),
          const SizedBox(width: 8),
          Text(label),
        ],
      );
    }
    return Text(label);
  }

  double get _sizeHeight => switch (size) {
        ButtonSize.small => 36,
        ButtonSize.medium => _kButtonHeight,
        ButtonSize.large => 56,
      };

  double get _sizeFontSize => switch (size) {
        ButtonSize.small => 12,
        ButtonSize.medium => _kButtonFontSize,
        ButtonSize.large => 16,
      };

  double get _sizeIconSize => switch (size) {
        ButtonSize.small => 14,
        ButtonSize.medium => 18,
        ButtonSize.large => 22,
      };

  EdgeInsets get _sizePadding => switch (size) {
        ButtonSize.small => const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        ButtonSize.medium => _kButtonPadding,
        ButtonSize.large => const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
      };
}

// ---------------------------------------------------------------------------
// DangerButton
// ---------------------------------------------------------------------------

/// Bouton d'action destructive (ElevatedButton rouge foncé).
///
/// Utilisation pour les actions irréversibles (suppression, désactivation).
/// ```dart
/// DangerButton(
///   label: 'Supprimer',
///   icon: Icons.delete_outline,
///   onPressed: () => _delete(),
/// )
/// ```
class DangerButton extends StatelessWidget {
  /// Texte affiché sur le bouton
  final String label;

  /// Icône optionnelle à gauche du texte
  final IconData? icon;

  /// Callback déclenché au tap. Si null, le bouton est désactivé.
  final VoidCallback? onPressed;

  /// Si true, le bouton prend toute la largeur disponible
  final bool fullWidth;

  /// Taille du bouton
  final ButtonSize size;

  const DangerButton({
    super.key,
    required this.label,
    this.icon,
    this.onPressed,
    this.fullWidth = false,
    this.size = ButtonSize.medium,
  });

  @override
  Widget build(BuildContext context) {
    final button = ElevatedButton(
      onPressed: onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.error,
        foregroundColor: Colors.white,
        disabledBackgroundColor: AppColors.textDisabled,
        disabledForegroundColor: Colors.white,
        minimumSize: Size(0, _sizeHeight),
        padding: _sizePadding,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(_kButtonBorderRadius),
        ),
        elevation: 2,
        shadowColor: AppColors.error.withOpacity(0.4),
        textStyle: TextStyle(
          fontSize: _sizeFontSize,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
        ),
      ),
      child: _buildChild(),
    );

    return fullWidth ? SizedBox(width: double.infinity, child: button) : button;
  }

  Widget _buildChild() {
    if (icon != null) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: _sizeIconSize),
          const SizedBox(width: 8),
          Text(label),
        ],
      );
    }
    return Text(label);
  }

  double get _sizeHeight => switch (size) {
        ButtonSize.small => 36,
        ButtonSize.medium => _kButtonHeight,
        ButtonSize.large => 56,
      };

  double get _sizeFontSize => switch (size) {
        ButtonSize.small => 12,
        ButtonSize.medium => _kButtonFontSize,
        ButtonSize.large => 16,
      };

  double get _sizeIconSize => switch (size) {
        ButtonSize.small => 14,
        ButtonSize.medium => 18,
        ButtonSize.large => 22,
      };

  EdgeInsets get _sizePadding => switch (size) {
        ButtonSize.small => const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        ButtonSize.medium => _kButtonPadding,
        ButtonSize.large => const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
      };
}

// ---------------------------------------------------------------------------
// LoadingButton
// ---------------------------------------------------------------------------

/// Bouton avec état de chargement (spinner intégré).
///
/// Passe automatiquement en mode chargement et désactive les interactions.
/// ```dart
/// LoadingButton(
///   label: 'Enregistrer',
///   isLoading: _isSaving,
///   onPressed: () => _save(),
/// )
/// ```
class LoadingButton extends StatelessWidget {
  /// Texte affiché sur le bouton
  final String label;

  /// Texte affiché pendant le chargement (défaut: même que label)
  final String? loadingLabel;

  /// Si true, affiche le spinner et désactive le bouton
  final bool isLoading;

  /// Callback déclenché au tap (ignoré si isLoading est true)
  final VoidCallback? onPressed;

  /// Si true, le bouton prend toute la largeur disponible
  final bool fullWidth;

  /// Taille du bouton
  final ButtonSize size;

  /// Couleur du bouton (défaut: primary)
  final Color? color;

  /// Si true, style outlined (défaut: filled)
  final bool outlined;

  const LoadingButton({
    super.key,
    required this.label,
    required this.isLoading,
    this.loadingLabel,
    this.onPressed,
    this.fullWidth = false,
    this.size = ButtonSize.medium,
    this.color,
    this.outlined = false,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveColor = color ?? AppColors.primary;

    final buttonChild = isLoading
        ? Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    outlined ? effectiveColor : Colors.white,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Text(loadingLabel ?? label),
            ],
          )
        : Text(label);

    final buttonStyle = outlined
        ? OutlinedButton.styleFrom(
            foregroundColor: effectiveColor,
            minimumSize: Size(0, _sizeHeight),
            padding: _sizePadding,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(_kButtonBorderRadius),
            ),
            side: BorderSide(color: effectiveColor, width: 1.5),
            textStyle: TextStyle(
              fontSize: _sizeFontSize,
              fontWeight: FontWeight.w600,
            ),
          )
        : ElevatedButton.styleFrom(
            backgroundColor: effectiveColor,
            foregroundColor: Colors.white,
            disabledBackgroundColor: effectiveColor.withOpacity(0.7),
            disabledForegroundColor: Colors.white,
            minimumSize: Size(0, _sizeHeight),
            padding: _sizePadding,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(_kButtonBorderRadius),
            ),
            elevation: isLoading ? 0 : 2,
            textStyle: TextStyle(
              fontSize: _sizeFontSize,
              fontWeight: FontWeight.w600,
            ),
          );

    final Widget button = outlined
        ? OutlinedButton(
            onPressed: isLoading ? null : onPressed,
            style: buttonStyle as ButtonStyle,
            child: buttonChild,
          )
        : ElevatedButton(
            onPressed: isLoading ? null : onPressed,
            style: buttonStyle as ButtonStyle,
            child: buttonChild,
          );

    return fullWidth ? SizedBox(width: double.infinity, child: button) : button;
  }

  double get _sizeHeight => switch (size) {
        ButtonSize.small => 36,
        ButtonSize.medium => _kButtonHeight,
        ButtonSize.large => 56,
      };

  double get _sizeFontSize => switch (size) {
        ButtonSize.small => 12,
        ButtonSize.medium => _kButtonFontSize,
        ButtonSize.large => 16,
      };

  EdgeInsets get _sizePadding => switch (size) {
        ButtonSize.small => const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        ButtonSize.medium => _kButtonPadding,
        ButtonSize.large => const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
      };
}

// ---------------------------------------------------------------------------
// ButtonSize enum
// ---------------------------------------------------------------------------

/// Tailles disponibles pour les boutons
enum ButtonSize {
  /// Petit bouton (hauteur 36px)
  small,

  /// Bouton standard (hauteur 48px)
  medium,

  /// Grand bouton (hauteur 56px)
  large,
}
