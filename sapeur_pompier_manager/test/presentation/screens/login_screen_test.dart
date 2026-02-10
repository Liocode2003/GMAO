// Widget tests for LoginScreen.
//
// Strategy: override [authProvider] via ProviderScope so no real database,
// SharedPreferences, or window_manager is involved.
//
// LoginScreen uses a username field (not email) — the label is
// "Nom d'utilisateur". Tests reference that label.
//
// The password visibility toggle icon switches between
// Icons.visibility_off (hidden) and Icons.visibility (shown).

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:sapeur_pompier_manager/presentation/screens/login_screen.dart';
import 'package:sapeur_pompier_manager/presentation/providers/auth_provider.dart';
import 'package:sapeur_pompier_manager/core/constants/app_colors.dart';

// =============================================================================
// Fake AuthNotifier — controls authState without touching real infrastructure
// =============================================================================

class FakeAuthNotifier extends AuthNotifier {
  FakeAuthNotifier(AuthState initialState)
      : _initialState = initialState,
        super._fake();

  final AuthState _initialState;

  // Called by super constructor path — must be overridden to avoid real repo.
  @override
  AuthState get state => _initialState;

  @override
  Future<bool> login(String username, String password) async => false;

  @override
  Future<void> logout() async {}
}

// ---------------------------------------------------------------------------
// Because AuthNotifier's constructor calls _checkAuthStatus() (which hits the
// repo), we provide a minimal alternative via a direct StateNotifier subclass.
// ---------------------------------------------------------------------------
class _StubAuthNotifier extends StateNotifier<AuthState> {
  _StubAuthNotifier(AuthState state) : super(state);

  Future<bool> login(String username, String password) async {
    // Simulate async login: transition to loading then stay loading
    state = state.copyWith(isLoading: true, error: null);
    return false;
  }
}

// =============================================================================
// Helper: pump LoginScreen wrapped in ProviderScope with overridden authProvider
// =============================================================================

Widget _buildLoginScreen({AuthState? authState}) {
  final effectiveState = authState ??
      const AuthState(
        isLoading: false,
        isAuthenticated: false,
      );

  final stubNotifier = _StubAuthNotifier(effectiveState);

  return ProviderScope(
    overrides: [
      authProvider.overrideWith((_) => stubNotifier as AuthNotifier),
    ],
    child: MaterialApp(
      // Minimal theme so AppColors constants don't break the widget tree
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: AppColors.primary),
        useMaterial3: true,
      ),
      home: const LoginScreen(),
    ),
  );
}

// =============================================================================
// Tests
// =============================================================================

void main() {
  // -------------------------------------------------------------------------
  group('LoginScreen rendering', () {
    testWidgets('renders login form with username and password fields',
        (tester) async {
      await tester.pumpWidget(_buildLoginScreen());
      await tester.pump();

      // Username field
      expect(find.byType(TextFormField), findsNWidgets(2));
      expect(find.text("Nom d'utilisateur"), findsOneWidget);

      // Password field
      expect(find.text('Mot de passe'), findsOneWidget);

      // Submit button
      expect(find.text('Se connecter'), findsOneWidget);
    });

    testWidgets('renders app icon and title', (tester) async {
      await tester.pumpWidget(_buildLoginScreen());
      await tester.pump();

      expect(find.byIcon(Icons.local_fire_department), findsOneWidget);
      // The form card should be visible
      expect(find.byType(Card), findsWidgets);
    });

    testWidgets('renders "Se souvenir de moi" checkbox', (tester) async {
      await tester.pumpWidget(_buildLoginScreen());
      await tester.pump();

      expect(find.byType(Checkbox), findsOneWidget);
      expect(find.text('Se souvenir de moi'), findsOneWidget);
    });
  });

  // -------------------------------------------------------------------------
  group('LoginScreen form validation', () {
    testWidgets(
        'shows validation error when form is submitted with empty fields',
        (tester) async {
      await tester.pumpWidget(_buildLoginScreen());
      await tester.pump();

      // Tap the submit button without filling in anything
      await tester.tap(find.text('Se connecter'));
      await tester.pump();

      // Both validators should fire
      expect(
        find.text("Veuillez entrer votre nom d'utilisateur"),
        findsOneWidget,
      );
      expect(
        find.text('Veuillez entrer votre mot de passe'),
        findsOneWidget,
      );
    });

    testWidgets('shows username validation error when only username is empty',
        (tester) async {
      await tester.pumpWidget(_buildLoginScreen());
      await tester.pump();

      // Fill password, leave username empty
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Mot de passe'),
        'somepassword',
      );
      await tester.tap(find.text('Se connecter'));
      await tester.pump();

      expect(
        find.text("Veuillez entrer votre nom d'utilisateur"),
        findsOneWidget,
      );
    });

    testWidgets('shows password validation error when only password is empty',
        (tester) async {
      await tester.pumpWidget(_buildLoginScreen());
      await tester.pump();

      // Fill username, leave password empty
      await tester.enterText(
        find.widgetWithText(TextFormField, "Nom d'utilisateur"),
        'admin',
      );
      await tester.tap(find.text('Se connecter'));
      await tester.pump();

      expect(
        find.text('Veuillez entrer votre mot de passe'),
        findsOneWidget,
      );
    });
  });

  // -------------------------------------------------------------------------
  group('LoginScreen password visibility toggle', () {
    testWidgets('password is hidden by default (visibility_off icon shown)',
        (tester) async {
      await tester.pumpWidget(_buildLoginScreen());
      await tester.pump();

      // Initially the password should be obscured — visibility_off icon shown
      expect(find.byIcon(Icons.visibility_off), findsOneWidget);
      expect(find.byIcon(Icons.visibility), findsNothing);
    });

    testWidgets('tapping toggle reveals password (visibility icon shown)',
        (tester) async {
      await tester.pumpWidget(_buildLoginScreen());
      await tester.pump();

      // Tap the suffix icon to toggle visibility
      await tester.tap(find.byIcon(Icons.visibility_off));
      await tester.pump();

      // Now the eye-open icon should be visible
      expect(find.byIcon(Icons.visibility), findsOneWidget);
      expect(find.byIcon(Icons.visibility_off), findsNothing);
    });

    testWidgets('tapping toggle twice hides password again', (tester) async {
      await tester.pumpWidget(_buildLoginScreen());
      await tester.pump();

      // Toggle ON (reveal)
      await tester.tap(find.byIcon(Icons.visibility_off));
      await tester.pump();
      expect(find.byIcon(Icons.visibility), findsOneWidget);

      // Toggle OFF (hide)
      await tester.tap(find.byIcon(Icons.visibility));
      await tester.pump();
      expect(find.byIcon(Icons.visibility_off), findsOneWidget);
    });
  });

  // -------------------------------------------------------------------------
  group('LoginScreen loading state', () {
    testWidgets('shows CircularProgressIndicator while isLoading is true',
        (tester) async {
      const loadingState = AuthState(isLoading: true, isAuthenticated: false);
      await tester.pumpWidget(_buildLoginScreen(authState: loadingState));
      await tester.pump();

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      // Submit button text should NOT be visible during loading
      expect(find.text('Se connecter'), findsNothing);
    });

    testWidgets('submit button is disabled while isLoading is true',
        (tester) async {
      const loadingState = AuthState(isLoading: true, isAuthenticated: false);
      await tester.pumpWidget(_buildLoginScreen(authState: loadingState));
      await tester.pump();

      // ElevatedButton with null onPressed is effectively disabled
      final button = tester.widget<ElevatedButton>(
        find.byType(ElevatedButton).first,
      );
      expect(button.onPressed, isNull);
    });

    testWidgets('text fields are disabled while isLoading is true',
        (tester) async {
      const loadingState = AuthState(isLoading: true, isAuthenticated: false);
      await tester.pumpWidget(_buildLoginScreen(authState: loadingState));
      await tester.pump();

      // Both TextFormFields should have enabled == false
      final fields = tester
          .widgetList<TextFormField>(find.byType(TextFormField))
          .toList();
      for (final field in fields) {
        expect(field.enabled, isFalse);
      }
    });

    testWidgets('shows submit button text when not loading', (tester) async {
      await tester.pumpWidget(_buildLoginScreen());
      await tester.pump();

      expect(find.text('Se connecter'), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsNothing);
    });
  });
}
