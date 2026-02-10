import 'package:flutter_test/flutter_test.dart';
import 'package:sapeur_pompier_manager/domain/entities/vaccination.dart';

void main() {
  final now = DateTime.now();

  Vaccination makeVaccination({
    String id = 'vacc-1',
    String sapeurPompierId = 'sp-1',
    String typeVaccin = 'antitetanique',
    DateTime? dateVaccination,
    DateTime? dateRappel,
  }) {
    return Vaccination(
      id: id,
      sapeurPompierId: sapeurPompierId,
      typeVaccin: typeVaccin,
      dateVaccination: dateVaccination ?? DateTime(2020, 1, 1),
      dateRappel: dateRappel,
    );
  }

  group('Vaccination entity', () {
    group('isExpire', () {
      test('retourne true quand la date de rappel est dans le passé', () {
        final vaccination = makeVaccination(
          dateRappel: now.subtract(const Duration(days: 1)),
        );
        expect(vaccination.isExpire, isTrue);
      });

      test('retourne false quand la date de rappel est dans le futur', () {
        final vaccination = makeVaccination(
          dateRappel: now.add(const Duration(days: 365)),
        );
        expect(vaccination.isExpire, isFalse);
      });

      test('retourne false quand il n\'y a pas de date de rappel', () {
        final vaccination = makeVaccination(dateRappel: null);
        expect(vaccination.isExpire, isFalse);
      });
    });

    group('isProcheDExpiration', () {
      test('retourne true quand le rappel est dans 29 jours', () {
        final vaccination = makeVaccination(
          dateRappel: now.add(const Duration(days: 29)),
        );
        expect(vaccination.isProcheDExpiration, isTrue);
      });

      test('retourne true quand le rappel est dans 1 jour', () {
        final vaccination = makeVaccination(
          dateRappel: now.add(const Duration(days: 1)),
        );
        expect(vaccination.isProcheDExpiration, isTrue);
      });

      test('retourne true quand le rappel est exactement dans 30 jours', () {
        final vaccination = makeVaccination(
          dateRappel: now.add(const Duration(days: 30)),
        );
        expect(vaccination.isProcheDExpiration, isTrue);
      });

      test('retourne false quand le rappel est dans 31 jours', () {
        final vaccination = makeVaccination(
          dateRappel: now.add(const Duration(days: 31)),
        );
        expect(vaccination.isProcheDExpiration, isFalse);
      });

      test('retourne false quand la date de rappel est dépassée', () {
        final vaccination = makeVaccination(
          dateRappel: now.subtract(const Duration(days: 5)),
        );
        expect(vaccination.isProcheDExpiration, isFalse);
      });

      test('retourne false quand il n\'y a pas de date de rappel', () {
        final vaccination = makeVaccination(dateRappel: null);
        expect(vaccination.isProcheDExpiration, isFalse);
      });
    });

    group('calculateDateRappel', () {
      final dateBase = DateTime(2020, 6, 15);

      test('calcule la date de rappel pour antiamaril (10 ans)', () {
        final rappel = Vaccination.calculateDateRappel(
          TypeVaccin.antiamaril.name,
          dateBase,
        );
        expect(rappel, equals(DateTime(2030, 6, 15)));
      });

      test('calcule la date de rappel pour antitetanique (10 ans)', () {
        final rappel = Vaccination.calculateDateRappel(
          TypeVaccin.antitetanique.name,
          dateBase,
        );
        expect(rappel, equals(DateTime(2030, 6, 15)));
      });

      test('calcule la date de rappel pour antiméningite (3 ans)', () {
        final rappel = Vaccination.calculateDateRappel(
          TypeVaccin.antimeningite.name,
          dateBase,
        );
        expect(rappel, equals(DateTime(2023, 6, 15)));
      });

      test('calcule la date de rappel pour anti-COVID-19 (1 an)', () {
        final rappel = Vaccination.calculateDateRappel(
          TypeVaccin.antiCovid.name,
          dateBase,
        );
        expect(rappel, equals(DateTime(2021, 6, 15)));
      });

      test('calcule la date de rappel pour antihépatite B (10 ans)', () {
        final rappel = Vaccination.calculateDateRappel(
          TypeVaccin.antihepatiteB.name,
          dateBase,
        );
        expect(rappel, equals(DateTime(2030, 6, 15)));
      });

      test('retourne null pour "autres" (durée 0)', () {
        final rappel = Vaccination.calculateDateRappel(
          TypeVaccin.autres.name,
          dateBase,
        );
        expect(rappel, isNull);
      });

      test('retourne null pour un type inconnu (traité comme "autres")', () {
        final rappel = Vaccination.calculateDateRappel(
          'typeInconnu',
          dateBase,
        );
        expect(rappel, isNull);
      });
    });

    group('statut', () {
      test('retourne "Expiré" quand le vaccin est expiré', () {
        final vaccination = makeVaccination(
          dateRappel: now.subtract(const Duration(days: 10)),
        );
        expect(vaccination.statut, equals('Expiré'));
      });

      test('retourne "Proche expiration" quand le rappel est dans 20 jours', () {
        final vaccination = makeVaccination(
          dateRappel: now.add(const Duration(days: 20)),
        );
        expect(vaccination.statut, equals('Proche expiration'));
      });

      test('retourne "À jour" quand le vaccin est valide et non proche expiration', () {
        final vaccination = makeVaccination(
          dateRappel: now.add(const Duration(days: 200)),
        );
        expect(vaccination.statut, equals('À jour'));
      });

      test('retourne "À jour" quand il n\'y a pas de date de rappel', () {
        final vaccination = makeVaccination(dateRappel: null);
        expect(vaccination.statut, equals('À jour'));
      });
    });

    group('typeVaccinLibelle', () {
      test('retourne le libellé pour antiamaril', () {
        final vaccination = makeVaccination(
          typeVaccin: TypeVaccin.antiamaril.name,
        );
        expect(vaccination.typeVaccinLibelle, equals('Antiamaril (fièvre jaune)'));
      });

      test('retourne le libellé pour antitetanique', () {
        final vaccination = makeVaccination(
          typeVaccin: TypeVaccin.antitetanique.name,
        );
        expect(vaccination.typeVaccinLibelle, equals('Antitétanique'));
      });

      test('retourne le libellé pour antiméningite', () {
        final vaccination = makeVaccination(
          typeVaccin: TypeVaccin.antimeningite.name,
        );
        expect(vaccination.typeVaccinLibelle, equals('Antiméningite'));
      });

      test('retourne le libellé pour antiCovid', () {
        final vaccination = makeVaccination(
          typeVaccin: TypeVaccin.antiCovid.name,
        );
        expect(vaccination.typeVaccinLibelle, equals('Anti-COVID-19'));
      });

      test('retourne le libellé pour antihepatiteB', () {
        final vaccination = makeVaccination(
          typeVaccin: TypeVaccin.antihepatiteB.name,
        );
        expect(vaccination.typeVaccinLibelle, equals('Antihépatite B'));
      });

      test('retourne le libellé pour autres', () {
        final vaccination = makeVaccination(
          typeVaccin: TypeVaccin.autres.name,
        );
        expect(vaccination.typeVaccinLibelle, equals('Autres'));
      });

      test('retourne la valeur brute pour un type inconnu', () {
        final vaccination = makeVaccination(typeVaccin: 'typeInconnu');
        expect(vaccination.typeVaccinLibelle, equals('typeInconnu'));
      });
    });

    group('hasSignature', () {
      test('retourne true quand la signature est définie', () {
        final vaccination = Vaccination(
          id: 'v-1',
          sapeurPompierId: 'sp-1',
          typeVaccin: 'antitetanique',
          dateVaccination: DateTime(2023, 1, 1),
          signaturePath: '/path/to/signature.png',
        );
        expect(vaccination.hasSignature, isTrue);
      });

      test('retourne false quand la signature est null', () {
        final vaccination = makeVaccination();
        expect(vaccination.hasSignature, isFalse);
      });

      test('retourne false quand la signature est une chaîne vide', () {
        final vaccination = Vaccination(
          id: 'v-1',
          sapeurPompierId: 'sp-1',
          typeVaccin: 'antitetanique',
          dateVaccination: DateTime(2023, 1, 1),
          signaturePath: '',
        );
        expect(vaccination.hasSignature, isFalse);
      });
    });
  });

  group('TypeVaccin enum', () {
    test('antiamaril a une durée de validité de 10 ans', () {
      expect(TypeVaccin.antiamaril.dureeValiditeAnnees, equals(10));
    });

    test('antitetanique a une durée de validité de 10 ans', () {
      expect(TypeVaccin.antitetanique.dureeValiditeAnnees, equals(10));
    });

    test('antimeningite a une durée de validité de 3 ans', () {
      expect(TypeVaccin.antimeningite.dureeValiditeAnnees, equals(3));
    });

    test('antiCovid a une durée de validité de 1 an', () {
      expect(TypeVaccin.antiCovid.dureeValiditeAnnees, equals(1));
    });

    test('autres a une durée de validité de 0 (pas de rappel automatique)', () {
      expect(TypeVaccin.autres.dureeValiditeAnnees, equals(0));
    });
  });
}
