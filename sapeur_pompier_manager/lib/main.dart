import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sapeur_pompier_manager/core/constants/app_colors.dart';
import 'package:sapeur_pompier_manager/core/constants/app_strings.dart';
import 'package:sapeur_pompier_manager/data/datasources/local_database.dart';
import 'package:sapeur_pompier_manager/presentation/providers/auth_provider.dart';
import 'package:sapeur_pompier_manager/presentation/screens/login_screen.dart';
import 'package:sapeur_pompier_manager/presentation/screens/dashboard_screen.dart';
import 'package:window_manager/window_manager.dart';
import 'dart:io';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialiser la base de données
  try {
    await LocalDatabase.instance.database;
    debugPrint('Base de données initialisée avec succès');
  } catch (e) {
    debugPrint('Erreur initialisation base de données: $e');
  }

  // Configuration de la fenêtre pour desktop
  if (Platform.isWindows || Platform.isLinux || Platform.isMacOS) {
    await windowManager.ensureInitialized();

    const windowOptions = WindowOptions(
      size: Size(1280, 800),
      minimumSize: Size(1024, 600),
      center: true,
      backgroundColor: Colors.transparent,
      skipTaskbar: false,
      title: AppStrings.appName,
      titleBarStyle: TitleBarStyle.normal,
      maximumSize: Size.infinite,
    );
    await windowManager.setResizable(true);
    await windowManager.setMaximizable(true);
    await windowManager.setMinimizable(true);

    windowManager.waitUntilReadyToShow(windowOptions, () async {
      await windowManager.show();
      await windowManager.focus();
    });
  }

  runApp(
    const ProviderScope(
      child: SapeurPompierApp(),
    ),
  );
}

class SapeurPompierApp extends StatelessWidget {
  const SapeurPompierApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: AppStrings.appName,
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.primary,
          primary: AppColors.primary,
          secondary: AppColors.secondary,
          error: AppColors.error,
          surface: AppColors.cardBackground,
          background: AppColors.background,
        ),
        textTheme: GoogleFonts.robotoTextTheme(),
        scaffoldBackgroundColor: AppColors.background,
        cardTheme: CardThemeData(
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          color: AppColors.cardBackground,
        ),
        appBarTheme: AppBarTheme(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          centerTitle: false,
          titleTextStyle: GoogleFonts.roboto(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            elevation: 2,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: AppColors.border),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: AppColors.border),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: AppColors.primary, width: 2),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: AppColors.error),
          ),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 12,
          ),
        ),
      ),
      home: const AuthWrapper(),
    );
  }
}

/// Wrapper pour gérer l'authentification automatique
class AuthWrapper extends ConsumerWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    // Afficher un écran de chargement pendant la vérification
    if (authState.isLoading) {
      return Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.local_fire_department,
                size: 80,
                color: AppColors.primary,
              ),
              const SizedBox(height: 24),
              const CircularProgressIndicator(),
              const SizedBox(height: 16),
              Text(
                'Chargement...',
                style: GoogleFonts.roboto(
                  fontSize: 16,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      );
    }

    // Rediriger vers le dashboard si authentifié, sinon vers le login
    if (authState.isAuthenticated && authState.user != null) {
      return const DashboardScreen();
    }

    return const LoginScreen();
  }
}
