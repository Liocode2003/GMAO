import 'package:flutter/material.dart';

/// Palette de couleurs de l'application
class AppColors {
  AppColors._();

  // Couleurs principales
  static const Color primary = Color(0xFFD32F2F); // Rouge pompier
  static const Color primaryDark = Color(0xFFB71C1C);
  static const Color primaryLight = Color(0xFFEF5350);

  static const Color secondary = Color(0xFF1976D2); // Bleu
  static const Color secondaryDark = Color(0xFF0D47A1);
  static const Color secondaryLight = Color(0xFF42A5F5);

  // Couleurs fonctionnelles
  static const Color success = Color(0xFF388E3C); // Vert
  static const Color warning = Color(0xFFF57C00); // Orange
  static const Color error = Color(0xFFC62828); // Rouge foncé
  static const Color info = Color(0xFF0288D1); // Bleu clair
  static const Color infoLight = Color(0xFFE1F5FE); // Bleu très clair

  // Couleurs de fond
  static const Color background = Color(0xFFF5F5F5);
  static const Color cardBackground = Color(0xFFFFFFFF);
  static const Color surfaceBackground = Color(0xFFFAFAFA);

  // Couleurs de texte
  static const Color textPrimary = Color(0xFF212121);
  static const Color textSecondary = Color(0xFF757575);
  static const Color textDisabled = Color(0xFFBDBDBD);
  static const Color textHint = Color(0xFF9E9E9E);

  // Couleurs de bordure
  static const Color border = Color(0xFFE0E0E0);
  static const Color divider = Color(0xFFBDBDBD);

  // Couleurs de statut
  static const Color statusApte = Color(0xFF4CAF50);
  static const Color statusInapte = Color(0xFFF44336);
  static const Color statusEnAttente = Color(0xFFFF9800);
  static const Color statusEnCours = Color(0xFF2196F3);

  // Couleurs du sidebar
  static const Color sidebarBackground = Color(0xFF263238);
  static const Color sidebarSelected = Color(0xFFD32F2F);
  static const Color sidebarHover = Color(0xFF37474F);
  static const Color sidebarText = Color(0xFFECEFF1);

  // Couleurs du graphique
  static const Color chartLine1 = Color(0xFFD32F2F);
  static const Color chartLine2 = Color(0xFF1976D2);
  static const Color chartLine3 = Color(0xFF388E3C);
  static const Color chartLine4 = Color(0xFFF57C00);
  static const Color chartGrid = Color(0xFFE0E0E0);

  // Couleurs d'alerte
  static const Color alertCritical = Color(0xFFD32F2F);
  static const Color alertHigh = Color(0xFFFF6F00);
  static const Color alertMedium = Color(0xFFFFA726);
  static const Color alertLow = Color(0xFF42A5F5);

  // Ombres
  static List<BoxShadow> cardShadow = [
    BoxShadow(
      color: Colors.black.withOpacity(0.08),
      blurRadius: 8,
      offset: const Offset(0, 2),
    ),
  ];

  static List<BoxShadow> elevatedShadow = [
    BoxShadow(
      color: Colors.black.withOpacity(0.12),
      blurRadius: 12,
      offset: const Offset(0, 4),
    ),
  ];
}
