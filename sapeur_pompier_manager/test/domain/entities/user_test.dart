import 'package:flutter_test/flutter_test.dart';
import 'package:sapeur_pompier_manager/domain/entities/user.dart';

void main() {
  final baseDate = DateTime(2024, 1, 1);

  User makeUser({
    String id = 'user-1',
    String username = 'test_user',
    String email = 'test@example.com',
    String role = 'consultation',
    String? nomComplet,
    bool isActive = true,
  }) {
    return User(
      id: id,
      username: username,
      email: email,
      role: role,
      nomComplet: nomComplet,
      createdAt: baseDate,
      isActive: isActive,
    );
  }

  group('User entity', () {
    group('isAdmin', () {
      test('retourne true quand le rôle est admin', () {
        final user = makeUser(role: 'admin');
        expect(user.isAdmin, isTrue);
      });

      test('retourne false quand le rôle est medecin', () {
        final user = makeUser(role: 'medecin');
        expect(user.isAdmin, isFalse);
      });

      test('retourne false quand le rôle est consultation', () {
        final user = makeUser(role: 'consultation');
        expect(user.isAdmin, isFalse);
      });
    });

    group('isMedecin', () {
      test('retourne true quand le rôle est medecin', () {
        final user = makeUser(role: 'medecin');
        expect(user.isMedecin, isTrue);
      });

      test('retourne true quand le rôle est admin (admin est aussi medecin)', () {
        final user = makeUser(role: 'admin');
        expect(user.isMedecin, isTrue);
      });

      test('retourne false quand le rôle est consultation', () {
        final user = makeUser(role: 'consultation');
        expect(user.isMedecin, isFalse);
      });
    });

    group('canEdit', () {
      test('retourne true pour le rôle admin', () {
        final user = makeUser(role: 'admin');
        expect(user.canEdit, isTrue);
      });

      test('retourne true pour le rôle medecin', () {
        final user = makeUser(role: 'medecin');
        expect(user.canEdit, isTrue);
      });

      test('retourne false pour le rôle consultation', () {
        final user = makeUser(role: 'consultation');
        expect(user.canEdit, isFalse);
      });
    });

    group('isReadOnly', () {
      test('retourne true pour le rôle consultation', () {
        final user = makeUser(role: 'consultation');
        expect(user.isReadOnly, isTrue);
      });

      test('retourne false pour le rôle admin', () {
        final user = makeUser(role: 'admin');
        expect(user.isReadOnly, isFalse);
      });

      test('retourne false pour le rôle medecin', () {
        final user = makeUser(role: 'medecin');
        expect(user.isReadOnly, isFalse);
      });
    });

    group('copyWith', () {
      test('retourne une copie avec le rôle modifié', () {
        final user = makeUser(role: 'consultation');
        final updated = user.copyWith(role: 'admin');

        expect(updated.role, equals('admin'));
        expect(updated.id, equals(user.id));
        expect(updated.username, equals(user.username));
        expect(updated.email, equals(user.email));
      });

      test('retourne une copie avec le username modifié', () {
        final user = makeUser(username: 'ancien_nom');
        final updated = user.copyWith(username: 'nouveau_nom');

        expect(updated.username, equals('nouveau_nom'));
        expect(updated.email, equals(user.email));
        expect(updated.role, equals(user.role));
      });

      test('retourne une copie avec isActive modifié', () {
        final user = makeUser(isActive: true);
        final updated = user.copyWith(isActive: false);

        expect(updated.isActive, isFalse);
        expect(user.isActive, isTrue);
      });

      test('retourne une copie avec lastLogin ajouté', () {
        final user = makeUser();
        final loginDate = DateTime(2024, 6, 15);
        final updated = user.copyWith(lastLogin: loginDate);

        expect(updated.lastLogin, equals(loginDate));
        expect(user.lastLogin, isNull);
      });

      test('conserve les valeurs inchangées si aucun paramètre fourni', () {
        final user = makeUser(
          id: 'id-42',
          username: 'pompier',
          email: 'pompier@bnsp.bf',
          role: 'medecin',
          nomComplet: 'Jean Dupont',
        );
        final copy = user.copyWith();

        expect(copy.id, equals(user.id));
        expect(copy.username, equals(user.username));
        expect(copy.email, equals(user.email));
        expect(copy.role, equals(user.role));
        expect(copy.nomComplet, equals(user.nomComplet));
      });
    });

    group('équalité (Equatable)', () {
      test('deux utilisateurs identiques sont égaux', () {
        final user1 = makeUser(id: 'abc', role: 'admin');
        final user2 = makeUser(id: 'abc', role: 'admin');
        expect(user1, equals(user2));
      });

      test('deux utilisateurs avec des ids différents ne sont pas égaux', () {
        final user1 = makeUser(id: 'id-1');
        final user2 = makeUser(id: 'id-2');
        expect(user1, isNot(equals(user2)));
      });
    });
  });
}
