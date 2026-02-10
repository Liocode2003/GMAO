import 'package:flutter_test/flutter_test.dart';
import 'package:sapeur_pompier_manager/domain/entities/constantes.dart';

void main() {
  group('Constantes entity', () {
    group('calculateImc', () {
      test('calcule correctement l\'IMC avec des valeurs normales', () {
        // IMC = 70 / (1.75)² = 70 / 3.0625 ≈ 22.86
        final imc = Constantes.calculateImc(70.0, 175.0);
        expect(imc, isNotNull);
        expect(imc!, closeTo(22.86, 0.01));
      });

      test('calcule correctement l\'IMC en surpoids', () {
        // IMC = 90 / (1.75)² ≈ 29.39
        final imc = Constantes.calculateImc(90.0, 175.0);
        expect(imc, isNotNull);
        expect(imc!, closeTo(29.39, 0.01));
      });

      test('calcule correctement l\'IMC en insuffisance pondérale', () {
        // IMC = 50 / (1.75)² ≈ 16.33
        final imc = Constantes.calculateImc(50.0, 175.0);
        expect(imc, isNotNull);
        expect(imc!, closeTo(16.33, 0.01));
      });

      test('retourne null quand la taille est nulle', () {
        final imc = Constantes.calculateImc(70.0, null);
        expect(imc, isNull);
      });

      test('retourne null quand le poids est nul', () {
        final imc = Constantes.calculateImc(null, 175.0);
        expect(imc, isNull);
      });

      test('retourne null quand les deux valeurs sont nulles', () {
        final imc = Constantes.calculateImc(null, null);
        expect(imc, isNull);
      });

      test('retourne null quand la taille vaut zéro (division par zéro)', () {
        final imc = Constantes.calculateImc(70.0, 0.0);
        expect(imc, isNull);
      });
    });

    group('imcInterpretation', () {
      test('retourne "Non calculé" quand l\'IMC est null', () {
        final constantes = Constantes(
          id: '1',
          sapeurPompierId: 'sp-1',
          imc: null,
        );
        expect(constantes.imcInterpretation, equals('Non calculé'));
      });

      test('retourne "Insuffisance pondérale" pour IMC < 18.5', () {
        final constantes = Constantes(
          id: '1',
          sapeurPompierId: 'sp-1',
          imc: 16.0,
        );
        expect(constantes.imcInterpretation, equals('Insuffisance pondérale'));
      });

      test('retourne "Poids normal" pour IMC entre 18.5 et 24.9', () {
        final constantes = Constantes(
          id: '1',
          sapeurPompierId: 'sp-1',
          imc: 22.0,
        );
        expect(constantes.imcInterpretation, equals('Poids normal'));
      });

      test('retourne "Surpoids" pour IMC entre 25 et 29.9', () {
        final constantes = Constantes(
          id: '1',
          sapeurPompierId: 'sp-1',
          imc: 27.5,
        );
        expect(constantes.imcInterpretation, equals('Surpoids'));
      });

      test('retourne "Obésité modérée" pour IMC entre 30 et 34.9', () {
        final constantes = Constantes(
          id: '1',
          sapeurPompierId: 'sp-1',
          imc: 32.0,
        );
        expect(constantes.imcInterpretation, equals('Obésité modérée'));
      });

      test('retourne "Obésité sévère" pour IMC entre 35 et 39.9', () {
        final constantes = Constantes(
          id: '1',
          sapeurPompierId: 'sp-1',
          imc: 37.0,
        );
        expect(constantes.imcInterpretation, equals('Obésité sévère'));
      });

      test('retourne "Obésité morbide" pour IMC >= 40', () {
        final constantes = Constantes(
          id: '1',
          sapeurPompierId: 'sp-1',
          imc: 42.0,
        );
        expect(constantes.imcInterpretation, equals('Obésité morbide'));
      });

      test('retourne "Insuffisance pondérale" pour IMC exactement 18.5 - 1', () {
        final constantes = Constantes(
          id: '1',
          sapeurPompierId: 'sp-1',
          imc: 18.4,
        );
        expect(constantes.imcInterpretation, equals('Insuffisance pondérale'));
      });
    });

    group('isComplete', () {
      test('retourne true quand toutes les mesures de base sont présentes', () {
        final constantes = Constantes(
          id: '1',
          sapeurPompierId: 'sp-1',
          taille: 175.0,
          poids: 70.0,
          perimetreThoracique: 95.0,
          perimetreAbdominal: 82.0,
        );
        expect(constantes.isComplete, isTrue);
      });

      test('retourne false quand la taille est manquante', () {
        final constantes = Constantes(
          id: '1',
          sapeurPompierId: 'sp-1',
          poids: 70.0,
          perimetreThoracique: 95.0,
          perimetreAbdominal: 82.0,
        );
        expect(constantes.isComplete, isFalse);
      });

      test('retourne false quand le poids est manquant', () {
        final constantes = Constantes(
          id: '1',
          sapeurPompierId: 'sp-1',
          taille: 175.0,
          perimetreThoracique: 95.0,
          perimetreAbdominal: 82.0,
        );
        expect(constantes.isComplete, isFalse);
      });

      test('retourne false quand les périmètres sont manquants', () {
        final constantes = Constantes(
          id: '1',
          sapeurPompierId: 'sp-1',
          taille: 175.0,
          poids: 70.0,
        );
        expect(constantes.isComplete, isFalse);
      });

      test('retourne false quand toutes les mesures sont nulles', () {
        final constantes = Constantes(
          id: '1',
          sapeurPompierId: 'sp-1',
        );
        expect(constantes.isComplete, isFalse);
      });
    });

    group('hasEmpreintes et hasSignature', () {
      test('hasEmpreintes retourne true quand le chemin est défini', () {
        final constantes = Constantes(
          id: '1',
          sapeurPompierId: 'sp-1',
          empreintesPath: '/path/to/empreintes.png',
        );
        expect(constantes.hasEmpreintes, isTrue);
      });

      test('hasEmpreintes retourne false quand le chemin est null', () {
        final constantes = Constantes(id: '1', sapeurPompierId: 'sp-1');
        expect(constantes.hasEmpreintes, isFalse);
      });

      test('hasEmpreintes retourne false quand le chemin est vide', () {
        final constantes = Constantes(
          id: '1',
          sapeurPompierId: 'sp-1',
          empreintesPath: '',
        );
        expect(constantes.hasEmpreintes, isFalse);
      });

      test('hasSignature retourne true quand le chemin est défini', () {
        final constantes = Constantes(
          id: '1',
          sapeurPompierId: 'sp-1',
          signaturePath: '/path/to/signature.png',
        );
        expect(constantes.hasSignature, isTrue);
      });
    });
  });

  group('HistoriquePoids entity', () {
    test('copyWith retourne une copie modifiée correctement', () {
      final original = HistoriquePoids(
        id: 'hist-1',
        sapeurPompierId: 'sp-1',
        annee: 5,
        poids: 72.0,
        dateMesure: DateTime(2023, 6, 15),
      );

      final updated = original.copyWith(poids: 75.0, annee: 6);

      expect(updated.id, equals(original.id));
      expect(updated.sapeurPompierId, equals(original.sapeurPompierId));
      expect(updated.poids, equals(75.0));
      expect(updated.annee, equals(6));
      expect(updated.dateMesure, equals(original.dateMesure));
    });

    test('copyWith sans arguments conserve toutes les valeurs', () {
      final original = HistoriquePoids(
        id: 'hist-2',
        sapeurPompierId: 'sp-2',
        annee: 10,
        poids: 80.0,
      );
      final copy = original.copyWith();

      expect(copy.id, equals(original.id));
      expect(copy.annee, equals(original.annee));
      expect(copy.poids, equals(original.poids));
    });

    test('deux HistoriquePoids identiques sont égaux', () {
      final h1 = HistoriquePoids(
        id: 'h-1',
        sapeurPompierId: 'sp-1',
        annee: 3,
        poids: 68.0,
      );
      final h2 = HistoriquePoids(
        id: 'h-1',
        sapeurPompierId: 'sp-1',
        annee: 3,
        poids: 68.0,
      );
      expect(h1, equals(h2));
    });
  });
}
