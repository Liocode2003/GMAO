import 'package:flutter/services.dart';

/// Validators réutilisables compatibles avec [TextFormField.validator].
///
/// Toutes les méthodes retournent `null` si la valeur est valide,
/// ou un message d'erreur en français si la validation échoue.
///
/// Usage:
/// ```dart
/// TextFormField(
///   validator: (v) => FormValidators.combine(v, [
///     (v) => FormValidators.required(v, fieldName: 'Nom'),
///     (v) => FormValidators.minLength(v, 2),
///   ]),
/// )
/// ```
class FormValidators {
  FormValidators._();

  // ---------------------------------------------------------------------------
  // Validators de base
  // ---------------------------------------------------------------------------

  /// Vérifie que le champ n'est pas vide.
  static String? required(String? value, {String fieldName = 'Ce champ'}) {
    if (value == null || value.trim().isEmpty) {
      return '$fieldName est obligatoire.';
    }
    return null;
  }

  /// Vérifie que la valeur est un email valide.
  static String? email(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'L\'adresse email est obligatoire.';
    }
    final emailRegex = RegExp(
      r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$',
    );
    if (!emailRegex.hasMatch(value.trim())) {
      return 'L\'adresse email n\'est pas valide.';
    }
    return null;
  }

  /// Vérifie que la valeur fait au moins [min] caractères.
  static String? minLength(
    String? value,
    int min, {
    String? fieldName,
  }) {
    if (value == null || value.isEmpty) return null;
    if (value.length < min) {
      final label = fieldName ?? 'Ce champ';
      return '$label doit contenir au moins $min caractère${min > 1 ? 's' : ''}.';
    }
    return null;
  }

  /// Vérifie que la valeur ne dépasse pas [max] caractères.
  static String? maxLength(
    String? value,
    int max, {
    String? fieldName,
  }) {
    if (value == null || value.isEmpty) return null;
    if (value.length > max) {
      final label = fieldName ?? 'Ce champ';
      return '$label ne peut pas dépasser $max caractère${max > 1 ? 's' : ''}.';
    }
    return null;
  }

  /// Vérifie que la valeur est une date au format dd/MM/yyyy.
  static String? date(String? value) {
    if (value == null || value.isEmpty) return null;
    final dateRegex = RegExp(r'^\d{2}/\d{2}/\d{4}$');
    if (!dateRegex.hasMatch(value)) {
      return 'La date doit être au format JJ/MM/AAAA.';
    }
    try {
      final parts = value.split('/');
      final day = int.parse(parts[0]);
      final month = int.parse(parts[1]);
      final year = int.parse(parts[2]);
      final parsed = DateTime(year, month, day);
      // Vérifie la cohérence (ex: 31/02 serait recalé)
      if (parsed.day != day || parsed.month != month || parsed.year != year) {
        return 'La date saisie n\'est pas valide.';
      }
      if (year < 1900 || year > 2100) {
        return 'L\'année doit être comprise entre 1900 et 2100.';
      }
    } catch (_) {
      return 'La date saisie n\'est pas valide.';
    }
    return null;
  }

  /// Vérifie que la valeur est un nombre strictement positif.
  static String? positiveNumber(String? value, {String? fieldName}) {
    if (value == null || value.isEmpty) return null;
    final number = double.tryParse(value.replaceAll(',', '.'));
    if (number == null) {
      return '${fieldName ?? 'Ce champ'} doit être un nombre valide.';
    }
    if (number <= 0) {
      return '${fieldName ?? 'Ce champ'} doit être un nombre positif.';
    }
    return null;
  }

  /// Vérifie que la valeur est un nombre dans l'intervalle [[min], [max]].
  static String? range(
    String? value,
    double min,
    double max, {
    String? fieldName,
  }) {
    if (value == null || value.isEmpty) return null;
    final number = double.tryParse(value.replaceAll(',', '.'));
    if (number == null) {
      return '${fieldName ?? 'Ce champ'} doit être un nombre valide.';
    }
    if (number < min || number > max) {
      return '${fieldName ?? 'Ce champ'} doit être compris entre $min et $max.';
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Validators métier
  // ---------------------------------------------------------------------------

  /// Vérifie le format du matricule: SPR-XXXXX (lettres et chiffres).
  ///
  /// Exemples valides: SPR-00001, SPR-AB123
  static String? matricule(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Le matricule est obligatoire.';
    }
    final matriculeRegex = RegExp(r'^SPR-[A-Z0-9]{4,6}$');
    if (!matriculeRegex.hasMatch(value.trim().toUpperCase())) {
      return 'Le matricule doit être au format SPR-XXXXX (ex: SPR-00001).';
    }
    return null;
  }

  /// Vérifie un numéro de téléphone du Burkina Faso.
  ///
  /// Formats acceptés: 70-12-34-56, 70123456, +22670123456
  static String? phone(String? value) {
    if (value == null || value.isEmpty) return null;
    // Supprime les séparateurs avant la vérification
    final cleaned = value.replaceAll(RegExp(r'[\s\-\.]'), '');
    final phoneRegex = RegExp(
      r'^(\+226)?[0-9]{8}$',
    );
    if (!phoneRegex.hasMatch(cleaned)) {
      return 'Numéro de téléphone invalide (ex: 70-12-34-56 ou +22670123456).';
    }
    return null;
  }

  /// Vérifie le format de la tension artérielle: "120/80".
  ///
  /// Systolique: 60–250 mmHg, Diastolique: 40–150 mmHg.
  static String? tensionArterielle(String? value) {
    if (value == null || value.isEmpty) return null;
    final taRegex = RegExp(r'^(\d{2,3})/(\d{2,3})$');
    final match = taRegex.firstMatch(value.trim());
    if (match == null) {
      return 'Format invalide. Utilisez le format 120/80.';
    }
    final systolique = int.tryParse(match.group(1)!);
    final diastolique = int.tryParse(match.group(2)!);
    if (systolique == null || systolique < 60 || systolique > 250) {
      return 'La tension systolique doit être entre 60 et 250 mmHg.';
    }
    if (diastolique == null || diastolique < 40 || diastolique > 150) {
      return 'La tension diastolique doit être entre 40 et 150 mmHg.';
    }
    return null;
  }

  /// Vérifie qu'un mot de passe respecte les critères minimaux de sécurité.
  ///
  /// Critères: au moins 8 caractères, au moins 1 chiffre.
  static String? password(String? value) {
    if (value == null || value.isEmpty) {
      return 'Le mot de passe est obligatoire.';
    }
    if (value.length < 8) {
      return 'Le mot de passe doit contenir au moins 8 caractères.';
    }
    if (!RegExp(r'\d').hasMatch(value)) {
      return 'Le mot de passe doit contenir au moins un chiffre.';
    }
    return null;
  }

  /// Vérifie que [value] correspond à [original] (confirmation de mot de passe).
  static String? confirmPassword(String? value, String? original) {
    if (value == null || value.isEmpty) {
      return 'La confirmation du mot de passe est obligatoire.';
    }
    if (value != original) {
      return 'Les mots de passe ne correspondent pas.';
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Combinateur
  // ---------------------------------------------------------------------------

  /// Applique plusieurs validators dans l'ordre et retourne le premier message
  /// d'erreur rencontré, ou `null` si tous passent.
  ///
  /// ```dart
  /// validator: (v) => FormValidators.combine(v, [
  ///   (v) => FormValidators.required(v, fieldName: 'Nom'),
  ///   (v) => FormValidators.minLength(v, 2),
  ///   (v) => FormValidators.maxLength(v, 100),
  /// ]),
  /// ```
  static String? combine(
    String? value,
    List<String? Function(String?)> validators,
  ) {
    for (final validator in validators) {
      final result = validator(value);
      if (result != null) return result;
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// FormFormatters
// ---------------------------------------------------------------------------

/// [TextInputFormatter]s réutilisables pour les champs de formulaire.
///
/// Usage:
/// ```dart
/// inputFormatters: [FormFormatters.dateFormatter()],
/// ```
class FormFormatters {
  FormFormatters._();

  /// Formateur de date: insère automatiquement les '/' après JJ et MM.
  ///
  /// Produit le format JJ/MM/AAAA.
  static TextInputFormatter dateFormatter() => _DateInputFormatter();

  /// Formateur de téléphone burkinabè: produit le format XXX-XX-XX-XX.
  static TextInputFormatter phoneFormatter() => _PhoneInputFormatter();

  /// Formateur de tension artérielle: produit le format XXX/XX.
  static TextInputFormatter tensionFormatter() => _TensionInputFormatter();

  /// Formateur de matricule: produit le format SPR-XXXXX en majuscules.
  static TextInputFormatter matriculeFormatter() => _MatriculeInputFormatter();

  /// Convertit automatiquement la saisie en majuscules.
  static TextInputFormatter upperCase() => _UpperCaseFormatter();

  /// Filtre: accepte uniquement les chiffres.
  static TextInputFormatter numbersOnly() =>
      FilteringTextInputFormatter.digitsOnly;
}

// ---------------------------------------------------------------------------
// Implémentations privées des formatters
// ---------------------------------------------------------------------------

/// Formatter de date: JJ/MM/AAAA
class _DateInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final rawText = newValue.text.replaceAll('/', '');

    // Suppression: on laisse passer
    if (newValue.text.length < oldValue.text.length) {
      return newValue;
    }

    if (rawText.length > 8) {
      return oldValue;
    }

    final buffer = StringBuffer();
    for (int i = 0; i < rawText.length; i++) {
      if (!RegExp(r'\d').hasMatch(rawText[i])) continue;
      buffer.write(rawText[i]);
      if (i == 1 || i == 3) buffer.write('/');
    }

    final formatted = buffer.toString();
    return newValue.copyWith(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}

/// Formatter de téléphone: XXX-XX-XX-XX
class _PhoneInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final rawText = newValue.text.replaceAll('-', '').replaceAll(' ', '');

    if (newValue.text.length < oldValue.text.length) {
      return newValue;
    }

    if (rawText.length > 8) return oldValue;

    final buffer = StringBuffer();
    for (int i = 0; i < rawText.length; i++) {
      if (!RegExp(r'\d').hasMatch(rawText[i])) continue;
      buffer.write(rawText[i]);
      if (i == 1 || i == 3 || i == 5) buffer.write('-');
    }

    final formatted = buffer.toString();
    return newValue.copyWith(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}

/// Formatter de tension artérielle: XXX/XX
class _TensionInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final rawText = newValue.text.replaceAll('/', '');

    if (newValue.text.length < oldValue.text.length) {
      return newValue;
    }

    if (rawText.length > 6) return oldValue;

    final buffer = StringBuffer();
    int digitCount = 0;
    bool slashInserted = false;

    for (int i = 0; i < rawText.length; i++) {
      final char = rawText[i];
      if (!RegExp(r'\d').hasMatch(char)) continue;
      digitCount++;
      buffer.write(char);
      // Après 3 chiffres (systolique), on insère le '/'
      if (digitCount == 3 && !slashInserted && i < rawText.length - 1) {
        buffer.write('/');
        slashInserted = true;
      }
    }

    final formatted = buffer.toString();
    return newValue.copyWith(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}

/// Formatter de matricule: SPR-XXXXX (préfixe auto + majuscules)
class _MatriculeInputFormatter extends TextInputFormatter {
  static const String _prefix = 'SPR-';

  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    String text = newValue.text.toUpperCase();

    // Suppression: ne pas supprimer le préfixe obligatoire
    if (!text.startsWith(_prefix)) {
      text = _prefix + text.replaceAll(_prefix, '');
    }

    // Partie après le préfixe: uniquement alphanumérique, max 6 caractères
    final suffix = text.substring(_prefix.length);
    final cleanSuffix = suffix.replaceAll(RegExp(r'[^A-Z0-9]'), '');
    final limitedSuffix = cleanSuffix.length > 6
        ? cleanSuffix.substring(0, 6)
        : cleanSuffix;

    final formatted = '$_prefix$limitedSuffix';

    return newValue.copyWith(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}

/// Formatter majuscules: convertit toute la saisie en majuscules.
class _UpperCaseFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    return newValue.copyWith(
      text: newValue.text.toUpperCase(),
      selection: newValue.selection,
    );
  }
}
