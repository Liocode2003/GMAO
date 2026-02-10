// NOTE: This test requires the following dev dependency in pubspec.yaml:
//   mockito: ^5.4.4
//   build_runner: ^2.4.8
//
// Run code generation before testing:
//   flutter pub run build_runner build --delete-conflicting-outputs
//
// The LoginUser use case lives at:
//   lib/domain/usecases/login_user.dart  (class: LoginUser)
//
// AuthRepository.login() takes (username, password), not (email, password).
// AuthenticationFailure is the correct class for credential errors (no AuthFailure).

import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:dartz/dartz.dart';
import 'package:sapeur_pompier_manager/domain/entities/user.dart';
import 'package:sapeur_pompier_manager/domain/repositories/auth_repository.dart';
import 'package:sapeur_pompier_manager/domain/usecases/login_user.dart';
import 'package:sapeur_pompier_manager/core/errors/failures.dart';

// ---------------------------------------------------------------------------
// Manual mock — replace with @GenerateMocks([AuthRepository]) + build_runner
// once mockito is added to dev_dependencies.
// ---------------------------------------------------------------------------
class MockAuthRepository extends Mock implements AuthRepository {}

void main() {
  late MockAuthRepository mockRepository;
  late LoginUser loginUser;

  // Fixture: a valid user returned on successful authentication
  final tUser = User(
    id: 'user-001',
    username: 'admin',
    email: 'admin@pompiers.bf',
    role: 'admin',
    createdAt: DateTime(2024, 1, 1),
    isActive: true,
  );

  setUp(() {
    mockRepository = MockAuthRepository();
    loginUser = LoginUser(mockRepository);
  });

  // -------------------------------------------------------------------------
  group('LoginUser use case', () {
    // -----------------------------------------------------------------------
    test('successful login returns Right(User) when credentials are valid',
        () async {
      // Arrange
      when(mockRepository.login('admin', 'admin123'))
          .thenAnswer((_) async => Right(tUser));

      // Act
      final result =
          await loginUser(username: 'admin', password: 'admin123');

      // Assert
      expect(result, Right(tUser));
      verify(mockRepository.login('admin', 'admin123')).called(1);
      verifyNoMoreInteractions(mockRepository);
    });

    // -----------------------------------------------------------------------
    test('wrong password returns Left(AuthenticationFailure)', () async {
      // Arrange
      const failure = AuthenticationFailure('Mot de passe incorrect');
      when(mockRepository.login('admin', 'mauvais_mdp'))
          .thenAnswer((_) async => const Left(failure));

      // Act
      final result =
          await loginUser(username: 'admin', password: 'mauvais_mdp');

      // Assert
      expect(result, const Left(failure));
      expect(result.isLeft(), isTrue);
      result.fold(
        (f) => expect(f, isA<AuthenticationFailure>()),
        (_) => fail('Expected a Left(AuthenticationFailure)'),
      );
      verify(mockRepository.login('admin', 'mauvais_mdp')).called(1);
    });

    // -----------------------------------------------------------------------
    test('user not found returns Left(NotFoundFailure)', () async {
      // Arrange
      const failure = NotFoundFailure('Utilisateur introuvable');
      when(mockRepository.login('unknown_user', 'anypassword'))
          .thenAnswer((_) async => const Left(failure));

      // Act
      final result =
          await loginUser(username: 'unknown_user', password: 'anypassword');

      // Assert
      expect(result, const Left(failure));
      result.fold(
        (f) => expect(f, isA<NotFoundFailure>()),
        (_) => fail('Expected a Left(NotFoundFailure)'),
      );
      verify(mockRepository.login('unknown_user', 'anypassword')).called(1);
    });

    // -----------------------------------------------------------------------
    test(
        'empty username returns Left(ValidationFailure) without calling repository',
        () async {
      // Act — the use case itself guards against empty credentials
      final result = await loginUser(username: '', password: 'somepassword');

      // Assert
      expect(result.isLeft(), isTrue);
      result.fold(
        (f) => expect(f, isA<ValidationFailure>()),
        (_) => fail('Expected a Left(ValidationFailure)'),
      );
      // Repository must NOT be called when validation fails
      verifyZeroInteractions(mockRepository);
    });

    // -----------------------------------------------------------------------
    test(
        'empty password returns Left(ValidationFailure) without calling repository',
        () async {
      // Act
      final result = await loginUser(username: 'admin', password: '');

      // Assert
      expect(result.isLeft(), isTrue);
      result.fold(
        (f) => expect(f, isA<ValidationFailure>()),
        (_) => fail('Expected a Left(ValidationFailure)'),
      );
      verifyZeroInteractions(mockRepository);
    });

    // -----------------------------------------------------------------------
    test('both fields empty returns Left(ValidationFailure)', () async {
      // Act
      final result = await loginUser(username: '', password: '');

      // Assert
      expect(result.isLeft(), isTrue);
      result.fold(
        (f) {
          expect(f, isA<ValidationFailure>());
          expect(f.message, isNotEmpty);
        },
        (_) => fail('Expected a Left(ValidationFailure)'),
      );
      verifyZeroInteractions(mockRepository);
    });
  });
}
