import 'package:sapeur_pompier_manager/core/constants/app_strings.dart';

/// Classe de validation des champs de formulaire
class Validators {
  Validators._();

  /// Validateur pour champ obligatoire
  static String? required(String? value, [String? fieldName]) {
    if (value == null || value.trim().isEmpty) {
      return fieldName != null
          ? '$fieldName est obligatoire'
          : AppStrings.requiredField;
    }
    return null;
  }

  /// Validateur pour email
  static String? email(String? value) {
    if (value == null || value.isEmpty) {
      return AppStrings.emailRequired;
    }

    final emailRegex = RegExp(
      r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    );

    if (!emailRegex.hasMatch(value)) {
      return AppStrings.invalidEmail;
    }

    return null;
  }

  /// Validateur pour mot de passe
  static String? password(String? value) {
    if (value == null || value.isEmpty) {
      return AppStrings.passwordRequired;
    }

    if (value.length < 6) {
      return AppStrings.passwordTooShort;
    }

    return null;
  }

  /// Validateur pour numéro de téléphone
  static String? phone(String? value) {
    if (value == null || value.isEmpty) {
      return null; // Optionnel
    }

    // Format international ou local burkinabé
    final phoneRegex = RegExp(r'^[\+]?[(]?[0-9]{2,4}[)]?[-\s\.]?[0-9]{2}[-\s\.]?[0-9]{2}[-\s\.]?[0-9]{2}[-\s\.]?[0-9]{2}$');

    if (!phoneRegex.hasMatch(value.replaceAll(' ', ''))) {
      return AppStrings.phoneInvalid;
    }

    return null;
  }

  /// Validateur pour nombre décimal positif
  static String? positiveNumber(String? value, [String? fieldName]) {
    if (value == null || value.isEmpty) {
      return null; // Optionnel
    }

    final number = double.tryParse(value);
    if (number == null) {
      return AppStrings.invalidNumber;
    }

    if (number < 0) {
      return '${fieldName ?? 'Ce champ'} doit être positif';
    }

    return null;
  }

  /// Validateur pour entier positif
  static String? positiveInteger(String? value, [String? fieldName]) {
    if (value == null || value.isEmpty) {
      return null; // Optionnel
    }

    final number = int.tryParse(value);
    if (number == null) {
      return AppStrings.invalidNumber;
    }

    if (number < 0) {
      return '${fieldName ?? 'Ce champ'} doit être positif';
    }

    return null;
  }

  /// Validateur pour date
  static String? date(String? value) {
    if (value == null || value.isEmpty) {
      return null; // Optionnel
    }

    try {
      DateTime.parse(value);
      return null;
    } catch (e) {
      return AppStrings.invalidDate;
    }
  }

  /// Validateur pour IMC (18.5 - 40)
  static String? imc(double? value) {
    if (value == null) {
      return null;
    }

    if (value < 10 || value > 50) {
      return 'IMC invalide (doit être entre 10 et 50)';
    }

    return null;
  }

  /// Validateur pour taille (cm)
  static String? taille(String? value) {
    if (value == null || value.isEmpty) {
      return null;
    }

    final taille = double.tryParse(value);
    if (taille == null) {
      return 'Taille invalide';
    }

    if (taille < 100 || taille > 250) {
      return 'Taille doit être entre 100 et 250 cm';
    }

    return null;
  }

  /// Validateur pour poids (kg)
  static String? poids(String? value) {
    if (value == null || value.isEmpty) {
      return null;
    }

    final poids = double.tryParse(value);
    if (poids == null) {
      return 'Poids invalide';
    }

    if (poids < 30 || poids > 200) {
      return 'Poids doit être entre 30 et 200 kg';
    }

    return null;
  }

  /// Validateur pour tension artérielle (format: 120/80)
  static String? tensionArterielle(String? value) {
    if (value == null || value.isEmpty) {
      return null;
    }

    final taRegex = RegExp(r'^\d{2,3}\/\d{2,3}$');
    if (!taRegex.hasMatch(value)) {
      return 'Format invalide (ex: 120/80)';
    }

    return null;
  }

  /// Validateur pour note SIGYCOP (0-5)
  static String? noteSigycop(String? value) {
    if (value == null || value.isEmpty) {
      return null;
    }

    final note = int.tryParse(value);
    if (note == null) {
      return 'Note invalide';
    }

    if (note < 0 || note > 5) {
      return 'Note doit être entre 0 et 5';
    }

    return null;
  }

  /// Validateur pour matricule unique
  static String? matricule(String? value) {
    if (value == null || value.isEmpty) {
      return AppStrings.matriculeRequired;
    }

    // Format matricule: au moins 4 caractères alphanumériques
    final matriculeRegex = RegExp(r'^[A-Z0-9]{4,}$');
    if (!matriculeRegex.hasMatch(value.toUpperCase())) {
      return 'Matricule invalide (min 4 caractères alphanumériques)';
    }

    return null;
  }

  /// Validateur combiné (plusieurs validateurs)
  static String? combine(
    String? value,
    List<String? Function(String?)> validators,
  ) {
    for (final validator in validators) {
      final result = validator(value);
      if (result != null) {
        return result;
      }
    }
    return null;
  }

  /// Validateur pour longueur min
  static String? Function(String?) minLength(int min, String fieldName) {
    return (String? value) {
      if (value == null || value.isEmpty) {
        return null;
      }
      if (value.length < min) {
        return '$fieldName doit contenir au moins $min caractères';
      }
      return null;
    };
  }

  /// Validateur pour longueur max
  static String? Function(String?) maxLength(int max, String fieldName) {
    return (String? value) {
      if (value == null || value.isEmpty) {
        return null;
      }
      if (value.length > max) {
        return '$fieldName ne peut pas dépasser $max caractères';
      }
      return null;
    };
  }

  /// Validateur pour plage de nombres
  static String? Function(String?) numberRange(
    double min,
    double max,
    String fieldName,
  ) {
    return (String? value) {
      if (value == null || value.isEmpty) {
        return null;
      }

      final number = double.tryParse(value);
      if (number == null) {
        return AppStrings.invalidNumber;
      }

      if (number < min || number > max) {
        return '$fieldName doit être entre $min et $max';
      }

      return null;
    };
  }
}
