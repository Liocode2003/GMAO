import 'package:flutter/material.dart';
import '../../presentation/screens/login_screen.dart';
import '../../presentation/screens/dashboard_screen.dart';
import '../../presentation/screens/liste_screen.dart';
import '../../presentation/screens/sapeur_pompier/creation_wizard_screen.dart';
import '../../presentation/screens/livret/etat_civil_screen.dart';
import '../../presentation/screens/livret/constantes_screen.dart';
import '../../presentation/screens/livret/examen_incorporation_screen.dart';
import '../../presentation/screens/livret/operations_screen.dart';
import '../../presentation/screens/livret/vaccinations_screen.dart';
import '../../presentation/screens/livret/visites_sanitaires_screen.dart';

/// Gestionnaire centralisé de la navigation de l'application
///
/// Définit toutes les routes nommées et fournit des helpers
/// pour naviguer de façon cohérente dans l'application.
///
/// Utilisation:
///   // Dans MaterialApp:
///   onGenerateRoute: AppRouter.generateRoute,
///   initialRoute: AppRouter.login,
///
///   // Pour naviguer:
///   AppRouter.navigateTo(context, AppRouter.dashboard);
///   AppRouter.navigateTo(context, AppRouter.detail, arguments: {'id': '123'});
class AppRouter {
  AppRouter._();

  // -------------------------------------------------------------------------
  // Définition des routes nommées
  // -------------------------------------------------------------------------

  /// Ecran de connexion
  static const String login = '/login';

  /// Tableau de bord principal
  static const String dashboard = '/dashboard';

  /// Liste de tous les sapeurs-pompiers
  static const String liste = '/liste';

  /// Fiche détail d'un sapeur-pompier (argument: Map<String, dynamic> avec 'id')
  static const String detail = '/sapeur-pompier/detail';

  /// Assistant de création d'un nouveau dossier
  static const String creation = '/sapeur-pompier/create';

  // --- Sections du livret sanitaire ----------------------------------------

  /// Section état civil
  static const String etatCivil = '/livret/etat-civil';

  /// Section constantes morphologiques
  static const String constantes = '/livret/constantes';

  /// Section examen d'incorporation
  static const String examen = '/livret/examen';

  /// Section opérations extérieures et intérieures (OPEX/OPINT)
  static const String operations = '/livret/operations';

  /// Section vaccinations et immunisations
  static const String vaccinations = '/livret/vaccinations';

  /// Section visites sanitaires périodiques
  static const String visites = '/livret/visites';

  /// Section indisponibilités médicales
  static const String indisponibilites = '/livret/indisponibilites';

  /// Section copies de certificats
  static const String certificats = '/livret/certificats';

  /// Section décisions de réforme
  static const String decisionsReforme = '/livret/decisions-reforme';

  /// Section contrôle de fin de service
  static const String controleFinService = '/livret/controle-fin-service';

  // --- Administration -------------------------------------------------------

  /// Gestion des comptes utilisateurs (admin seulement)
  static const String users = '/admin/users';

  /// Paramètres de l'application (admin seulement)
  static const String settings = '/admin/settings';

  /// Gestion des sauvegardes (admin seulement)
  static const String backup = '/admin/backup';

  // -------------------------------------------------------------------------
  // Générateur de routes
  // -------------------------------------------------------------------------

  /// Génère la route correspondant à [RouteSettings.name].
  ///
  /// Appelé automatiquement par [MaterialApp.onGenerateRoute].
  /// Retourne un [MaterialPageRoute] vers l'écran correspondant,
  /// ou vers [_NotFoundScreen] si la route est inconnue.
  static Route<dynamic> generateRoute(RouteSettings routeSettings) {
    final args = routeSettings.arguments;

    switch (routeSettings.name) {
      // --- Authentification -------------------------------------------------
      case login:
        return _buildRoute(const LoginScreen(), routeSettings);

      // --- Navigation principale --------------------------------------------
      case dashboard:
        return _buildRoute(const DashboardScreen(), routeSettings);

      case liste:
        return _buildRoute(const ListeScreen(), routeSettings);

      // --- Sapeur-pompier ---------------------------------------------------
      case detail:
        final sapeurId = _extractStringArg(args, 'id');
        return _buildRoute(
          _DetailScreen(sapeurPompierId: sapeurId),
          routeSettings,
        );

      case creation:
        return _buildRoute(const CreationWizardScreen(), routeSettings);

      // --- Sections du livret sanitaire ------------------------------------
      case etatCivil:
        final sapeurId = _extractStringArg(args, 'id') ?? '';
        return _buildRoute(
          EtatCivilScreen(sapeurPompierId: sapeurId),
          routeSettings,
        );

      case constantes:
        final sapeurId = _extractStringArg(args, 'id') ?? '';
        return _buildRoute(
          ConstantesScreen(sapeurPompierId: sapeurId),
          routeSettings,
        );

      case examen:
        final sapeurId = _extractStringArg(args, 'id') ?? '';
        return _buildRoute(
          ExamenIncorporationScreen(sapeurPompierId: sapeurId),
          routeSettings,
        );

      case operations:
        final sapeurId = _extractStringArg(args, 'id') ?? '';
        return _buildRoute(
          OperationsScreen(sapeurPompierId: sapeurId),
          routeSettings,
        );

      case vaccinations:
        final sapeurId = _extractStringArg(args, 'id') ?? '';
        return _buildRoute(
          VaccinationsScreen(sapeurPompierId: sapeurId),
          routeSettings,
        );

      case visites:
        final sapeurId = _extractStringArg(args, 'id') ?? '';
        return _buildRoute(
          VisitesSanitairesScreen(sapeurPompierId: sapeurId),
          routeSettings,
        );

      case indisponibilites:
        final sapeurId = _extractStringArg(args, 'id');
        return _buildRoute(
          _IndisponibilitesScreen(sapeurPompierId: sapeurId),
          routeSettings,
        );

      case certificats:
        final sapeurId = _extractStringArg(args, 'id');
        return _buildRoute(
          _CertificatsScreen(sapeurPompierId: sapeurId),
          routeSettings,
        );

      case decisionsReforme:
        final sapeurId = _extractStringArg(args, 'id');
        return _buildRoute(
          _DecisionsReformeScreen(sapeurPompierId: sapeurId),
          routeSettings,
        );

      case controleFinService:
        final sapeurId = _extractStringArg(args, 'id');
        return _buildRoute(
          _ControleFinServiceScreen(sapeurPompierId: sapeurId),
          routeSettings,
        );

      // --- Administration --------------------------------------------------
      case users:
        return _buildRoute(const _AdminUsersScreen(), routeSettings);

      case settings:
        return _buildRoute(const _AdminSettingsScreen(), routeSettings);

      case backup:
        return _buildRoute(const _AdminBackupScreen(), routeSettings);

      // --- Route inconnue --------------------------------------------------
      default:
        return _buildRoute(
          _NotFoundScreen(routeName: routeSettings.name ?? 'inconnue'),
          routeSettings,
        );
    }
  }

  // -------------------------------------------------------------------------
  // Helpers de navigation
  // -------------------------------------------------------------------------

  /// Navigue vers [routeName] en empilant l'écran sur la pile de navigation.
  ///
  /// Utiliser [arguments] pour passer des données à l'écran cible.
  /// Exemple:
  ///   AppRouter.navigateTo(context, AppRouter.detail, arguments: {'id': sp.id});
  static Future<T?> navigateTo<T>(
    BuildContext context,
    String routeName, {
    Object? arguments,
  }) {
    return Navigator.pushNamed<T>(context, routeName, arguments: arguments);
  }

  /// Remplace l'écran courant par [routeName] (sans retour arrière possible).
  ///
  /// Utile après une connexion réussie pour passer au dashboard.
  static Future<T?> replaceTo<T>(
    BuildContext context,
    String routeName, {
    Object? arguments,
  }) {
    return Navigator.pushReplacementNamed<T, dynamic>(
      context,
      routeName,
      arguments: arguments,
    );
  }

  /// Vide toute la pile de navigation et navigue vers [routeName].
  ///
  /// Utile pour la déconnexion : empêche de revenir aux écrans authentifiés.
  static Future<T?> clearAndNavigateTo<T>(
    BuildContext context,
    String routeName, {
    Object? arguments,
  }) {
    return Navigator.pushNamedAndRemoveUntil<T>(
      context,
      routeName,
      (route) => false,
      arguments: arguments,
    );
  }

  /// Retourne à l'écran précédent en passant un [result] optionnel.
  static void goBack<T>(BuildContext context, [T? result]) {
    if (Navigator.canPop(context)) {
      Navigator.pop<T>(context, result);
    }
  }

  /// Navigue vers le livret sanitaire d'un sapeur-pompier à la section [section].
  ///
  /// Raccourci pour les sections du livret qui nécessitent toutes un 'id'.
  static Future<void> navigateToLivretSection(
    BuildContext context, {
    required String section,
    required String sapeurPompierId,
  }) {
    return navigateTo(
      context,
      section,
      arguments: {'id': sapeurPompierId},
    );
  }

  // -------------------------------------------------------------------------
  // Utilitaires privés
  // -------------------------------------------------------------------------

  /// Construit un [MaterialPageRoute] avec la transition par défaut.
  static MaterialPageRoute<dynamic> _buildRoute(
    Widget screen,
    RouteSettings routeSettings,
  ) {
    return MaterialPageRoute(
      builder: (_) => screen,
      settings: routeSettings,
    );
  }

  /// Extrait un argument String depuis un Map d'arguments.
  ///
  /// Retourne null si [args] n'est pas un Map ou si la clé est absente.
  static String? _extractStringArg(Object? args, String key) {
    if (args is Map<String, dynamic>) {
      return args[key] as String?;
    }
    return null;
  }
}

// =============================================================================
// Écrans placeholder (à remplacer par les implémentations complètes)
// =============================================================================

/// Ecran de détail d'un sapeur-pompier
///
/// Affiche les informations générales et les accès rapides aux sections
/// du livret sanitaire.
class _DetailScreen extends StatelessWidget {
  final String? sapeurPompierId;

  const _DetailScreen({this.sapeurPompierId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dossier du sapeur-pompier'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => AppRouter.goBack(context),
        ),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.local_fire_department,
              size: 64,
              color: Color(0xFFD32F2F),
            ),
            const SizedBox(height: 16),
            Text(
              'Dossier #${sapeurPompierId ?? "inconnu"}',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            const Text('Écran en cours de développement'),
          ],
        ),
      ),
    );
  }
}

/// Ecran des indisponibilités médicales (placeholder)
class _IndisponibilitesScreen extends StatelessWidget {
  final String? sapeurPompierId;

  const _IndisponibilitesScreen({this.sapeurPompierId});

  @override
  Widget build(BuildContext context) {
    return _PlaceholderLivretScreen(
      title: 'Indisponibilités',
      icon: Icons.sick,
      sapeurPompierId: sapeurPompierId,
    );
  }
}

/// Ecran des copies de certificats (placeholder)
class _CertificatsScreen extends StatelessWidget {
  final String? sapeurPompierId;

  const _CertificatsScreen({this.sapeurPompierId});

  @override
  Widget build(BuildContext context) {
    return _PlaceholderLivretScreen(
      title: 'Copies des certificats',
      icon: Icons.description,
      sapeurPompierId: sapeurPompierId,
    );
  }
}

/// Ecran des décisions de réforme (placeholder)
class _DecisionsReformeScreen extends StatelessWidget {
  final String? sapeurPompierId;

  const _DecisionsReformeScreen({this.sapeurPompierId});

  @override
  Widget build(BuildContext context) {
    return _PlaceholderLivretScreen(
      title: 'Décisions de réforme',
      icon: Icons.gavel,
      sapeurPompierId: sapeurPompierId,
    );
  }
}

/// Ecran du contrôle de fin de service (placeholder)
class _ControleFinServiceScreen extends StatelessWidget {
  final String? sapeurPompierId;

  const _ControleFinServiceScreen({this.sapeurPompierId});

  @override
  Widget build(BuildContext context) {
    return _PlaceholderLivretScreen(
      title: 'Contrôle de fin de service',
      icon: Icons.assignment_turned_in,
      sapeurPompierId: sapeurPompierId,
    );
  }
}

/// Ecran de gestion des utilisateurs - administration (placeholder)
class _AdminUsersScreen extends StatelessWidget {
  const _AdminUsersScreen();

  @override
  Widget build(BuildContext context) {
    return _PlaceholderAdminScreen(
      title: 'Gestion des utilisateurs',
      icon: Icons.manage_accounts,
    );
  }
}

/// Ecran des paramètres - administration (placeholder)
class _AdminSettingsScreen extends StatelessWidget {
  const _AdminSettingsScreen();

  @override
  Widget build(BuildContext context) {
    return _PlaceholderAdminScreen(
      title: 'Paramètres',
      icon: Icons.settings,
    );
  }
}

/// Ecran des sauvegardes - administration (placeholder)
class _AdminBackupScreen extends StatelessWidget {
  const _AdminBackupScreen();

  @override
  Widget build(BuildContext context) {
    return _PlaceholderAdminScreen(
      title: 'Sauvegardes',
      icon: Icons.backup,
    );
  }
}

// -------------------------------------------------------------------------
// Widgets réutilisables internes
// -------------------------------------------------------------------------

/// Widget générique pour les sections du livret en cours de développement
class _PlaceholderLivretScreen extends StatelessWidget {
  final String title;
  final IconData icon;
  final String? sapeurPompierId;

  const _PlaceholderLivretScreen({
    required this.title,
    required this.icon,
    this.sapeurPompierId,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => AppRouter.goBack(context),
        ),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 64, color: const Color(0xFFD32F2F)),
            const SizedBox(height: 16),
            Text(title, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(
              'Dossier #${sapeurPompierId ?? "inconnu"}',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 4),
            const Text('Section en cours de développement'),
          ],
        ),
      ),
    );
  }
}

/// Widget générique pour les écrans d'administration en cours de développement
class _PlaceholderAdminScreen extends StatelessWidget {
  final String title;
  final IconData icon;

  const _PlaceholderAdminScreen({
    required this.title,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => AppRouter.goBack(context),
        ),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 64, color: const Color(0xFF1976D2)),
            const SizedBox(height: 16),
            Text(title, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            const Text('Module en cours de développement'),
          ],
        ),
      ),
    );
  }
}

/// Ecran affiché quand une route inconnue est demandée (erreur 404)
class _NotFoundScreen extends StatelessWidget {
  final String routeName;

  const _NotFoundScreen({required this.routeName});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Page introuvable'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => AppRouter.goBack(context),
        ),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline,
                size: 80,
                color: Color(0xFFC62828),
              ),
              const SizedBox(height: 24),
              Text(
                '404 - Page introuvable',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 12),
              Text(
                'La route "$routeName" n\'existe pas.',
                style: Theme.of(context).textTheme.bodyLarge,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              ElevatedButton.icon(
                onPressed: () =>
                    AppRouter.clearAndNavigateTo(context, AppRouter.dashboard),
                icon: const Icon(Icons.home),
                label: const Text('Retour au tableau de bord'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
