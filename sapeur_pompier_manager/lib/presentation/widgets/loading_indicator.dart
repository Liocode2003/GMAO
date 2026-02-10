import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

// ---------------------------------------------------------------------------
// LoadingIndicator
// ---------------------------------------------------------------------------

/// Indicateur de chargement circulaire centré dans son espace parent.
///
/// Utilisation simple pour les états de chargement de contenu.
/// ```dart
/// if (isLoading) return const LoadingIndicator();
/// ```
class LoadingIndicator extends StatelessWidget {
  /// Couleur du spinner (défaut: primary)
  final Color? color;

  /// Taille du spinner en pixels (défaut: 40)
  final double size;

  /// Épaisseur du trait du spinner (défaut: 3.5)
  final double strokeWidth;

  /// Message optionnel affiché sous le spinner
  final String? message;

  const LoadingIndicator({
    super.key,
    this.color,
    this.size = 40,
    this.strokeWidth = 3.5,
    this.message,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: size,
            height: size,
            child: CircularProgressIndicator(
              strokeWidth: strokeWidth,
              valueColor: AlwaysStoppedAnimation<Color>(
                color ?? AppColors.primary,
              ),
            ),
          ),
          if (message != null) ...[
            const SizedBox(height: 16),
            Text(
              message!,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 14,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// LoadingOverlay
// ---------------------------------------------------------------------------

/// Superposition semi-transparente avec spinner central.
///
/// S'affiche par-dessus le contenu existant pendant les opérations asynchrones.
/// ```dart
/// Stack(
///   children: [
///     MyContent(),
///     if (isLoading) const LoadingOverlay(),
///   ],
/// )
/// ```
///
/// Ou sous forme de widget wrapper:
/// ```dart
/// LoadingOverlay(
///   isLoading: _isSaving,
///   child: MyForm(),
/// )
/// ```
class LoadingOverlay extends StatelessWidget {
  /// Contenu affiché sous l'overlay
  final Widget? child;

  /// Si true, l'overlay est visible
  final bool isLoading;

  /// Couleur de fond de l'overlay (défaut: noir semi-transparent)
  final Color? overlayColor;

  /// Message affiché sous le spinner
  final String? message;

  const LoadingOverlay({
    super.key,
    this.child,
    this.isLoading = true,
    this.overlayColor,
    this.message,
  });

  @override
  Widget build(BuildContext context) {
    // Mode wrapper: encapsule un child avec l'overlay conditionnel
    if (child != null) {
      return Stack(
        children: [
          child!,
          if (isLoading) _buildOverlay(),
        ],
      );
    }

    // Mode standalone: juste l'overlay (à utiliser dans un Stack externe)
    return _buildOverlay();
  }

  Widget _buildOverlay() {
    return Container(
      color: overlayColor ?? Colors.black.withOpacity(0.45),
      child: Center(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: AppColors.elevatedShadow,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(
                width: 44,
                height: 44,
                child: CircularProgressIndicator(
                  strokeWidth: 3.5,
                  valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
                ),
              ),
              if (message != null) ...[
                const SizedBox(height: 16),
                Text(
                  message!,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// SkeletonCard
// ---------------------------------------------------------------------------

/// Carte placeholder animée style skeleton loading.
///
/// Simule la structure d'une carte avec des blocs gris animés
/// pendant le chargement des données.
///
/// ```dart
/// if (isLoading)
///   return ListView.builder(
///     itemBuilder: (_, __) => const SkeletonCard(),
///     itemCount: 5,
///   );
/// ```
class SkeletonCard extends StatefulWidget {
  /// Hauteur de la carte (défaut: 120)
  final double height;

  /// Nombre de lignes de texte simulées (défaut: 3)
  final int lineCount;

  /// Si true, affiche un avatar circulaire à gauche
  final bool showAvatar;

  /// Largeur de la carte (défaut: pleine largeur)
  final double? width;

  const SkeletonCard({
    super.key,
    this.height = 120,
    this.lineCount = 3,
    this.showAvatar = false,
    this.width,
  });

  @override
  State<SkeletonCard> createState() => _SkeletonCardState();
}

class _SkeletonCardState extends State<SkeletonCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    // Animation de pulsation pour l'effet shimmer
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);

    _animation = Tween<double>(begin: 0.4, end: 0.9).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          width: widget.width,
          height: widget.height,
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: AppColors.cardShadow,
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Avatar circulaire optionnel
              if (widget.showAvatar) ...[
                _SkeletonBox(
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  opacity: _animation.value,
                ),
                const SizedBox(width: 12),
              ],
              // Colonnes de lignes simulées
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(widget.lineCount, (index) {
                    // Variation des largeurs pour un aspect naturel
                    final widthFactor = index == 0
                        ? 0.7
                        : index == widget.lineCount - 1
                            ? 0.5
                            : 0.9;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: FractionallySizedBox(
                        widthFactor: widthFactor,
                        child: _SkeletonBox(
                          height: index == 0 ? 16 : 12,
                          opacity: _animation.value,
                        ),
                      ),
                    );
                  }),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

/// Bloc rectangulaire gris utilisé dans le SkeletonCard
class _SkeletonBox extends StatelessWidget {
  final double? width;
  final double height;
  final double borderRadius;
  final double opacity;

  const _SkeletonBox({
    this.width,
    required this.height,
    this.borderRadius = 4,
    required this.opacity,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: AppColors.border.withOpacity(opacity),
        borderRadius: BorderRadius.circular(borderRadius),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// SkeletonListView
// ---------------------------------------------------------------------------

/// Liste de SkeletonCards pour les états de chargement de listes entières.
///
/// ```dart
/// if (isLoading) return const SkeletonListView(itemCount: 6);
/// ```
class SkeletonListView extends StatelessWidget {
  /// Nombre de cartes skeleton à afficher
  final int itemCount;

  /// Hauteur de chaque carte
  final double cardHeight;

  /// Si true, affiche un avatar dans chaque carte
  final bool showAvatar;

  const SkeletonListView({
    super.key,
    this.itemCount = 5,
    this.cardHeight = 100,
    this.showAvatar = true,
  });

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: itemCount,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemBuilder: (_, index) => SkeletonCard(
        height: cardHeight,
        showAvatar: showAvatar,
        lineCount: 3,
      ),
    );
  }
}
