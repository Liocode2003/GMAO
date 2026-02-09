import 'package:intl/intl.dart';

/// Utilitaire de formatage des dates
class DateFormatter {
  DateFormatter._();

  /// Format français standard: 12/03/2024
  static String toFrenchDate(DateTime date) {
    return DateFormat('dd/MM/yyyy').format(date);
  }

  /// Format avec mois en lettres: 12 mars 2024
  static String toFrenchDateWithMonth(DateTime date) {
    return DateFormat('dd MMMM yyyy', 'fr_FR').format(date);
  }

  /// Format avec heure: 12/03/2024 14:30
  static String toFrenchDateTime(DateTime date) {
    return DateFormat('dd/MM/yyyy HH:mm').format(date);
  }

  /// Format ISO pour base de données: 2024-03-12
  static String toIsoDate(DateTime date) {
    return DateFormat('yyyy-MM-dd').format(date);
  }

  /// Format ISO avec heure pour base de données: 2024-03-12 14:30:00
  static String toIsoDateTime(DateTime date) {
    return DateFormat('yyyy-MM-dd HH:mm:ss').format(date);
  }

  /// Parse date depuis format français
  static DateTime? fromFrenchDate(String date) {
    try {
      return DateFormat('dd/MM/yyyy').parse(date);
    } catch (e) {
      return null;
    }
  }

  /// Parse date depuis format ISO
  static DateTime? fromIsoDate(String date) {
    try {
      return DateTime.parse(date);
    } catch (e) {
      return null;
    }
  }

  /// Calcule l'âge à partir d'une date de naissance
  static int calculateAge(DateTime birthDate) {
    final today = DateTime.now();
    int age = today.year - birthDate.year;

    if (today.month < birthDate.month ||
        (today.month == birthDate.month && today.day < birthDate.day)) {
      age--;
    }

    return age;
  }

  /// Formatte l'âge avec unité
  static String formatAge(DateTime birthDate) {
    final age = calculateAge(birthDate);
    return '$age ans';
  }

  /// Vérifie si une date est expirée
  static bool isExpired(DateTime date) {
    return date.isBefore(DateTime.now());
  }

  /// Vérifie si une date est proche (dans les X jours)
  static bool isNear(DateTime date, int days) {
    final now = DateTime.now();
    final difference = date.difference(now).inDays;
    return difference >= 0 && difference <= days;
  }

  /// Calcule le nombre de jours entre deux dates
  static int daysBetween(DateTime from, DateTime to) {
    return to.difference(from).inDays;
  }

  /// Calcule le nombre d'années entre deux dates
  static int yearsBetween(DateTime from, DateTime to) {
    int years = to.year - from.year;

    if (to.month < from.month ||
        (to.month == from.month && to.day < from.day)) {
      years--;
    }

    return years;
  }

  /// Formatte une durée en jours vers un format lisible
  static String formatDuration(int days) {
    if (days == 0) {
      return 'Aujourd\'hui';
    } else if (days == 1) {
      return '1 jour';
    } else if (days < 7) {
      return '$days jours';
    } else if (days < 30) {
      final weeks = (days / 7).floor();
      return weeks == 1 ? '1 semaine' : '$weeks semaines';
    } else if (days < 365) {
      final months = (days / 30).floor();
      return months == 1 ? '1 mois' : '$months mois';
    } else {
      final years = (days / 365).floor();
      return years == 1 ? '1 an' : '$years ans';
    }
  }

  /// Obtient le premier jour du mois
  static DateTime getFirstDayOfMonth(DateTime date) {
    return DateTime(date.year, date.month, 1);
  }

  /// Obtient le dernier jour du mois
  static DateTime getLastDayOfMonth(DateTime date) {
    return DateTime(date.year, date.month + 1, 0);
  }

  /// Obtient la date d'aujourd'hui à minuit
  static DateTime getToday() {
    final now = DateTime.now();
    return DateTime(now.year, now.month, now.day);
  }

  /// Format pour nom de fichier: 2024-03-12_14-30-00
  static String toFileNameFormat(DateTime date) {
    return DateFormat('yyyy-MM-dd_HH-mm-ss').format(date);
  }

  /// Format relatif: "Il y a 2 jours", "Dans 3 jours"
  static String toRelativeFormat(DateTime date) {
    final now = DateTime.now();
    final difference = date.difference(now);

    if (difference.isNegative) {
      // Dans le passé
      final days = difference.inDays.abs();
      if (days == 0) {
        return 'Aujourd\'hui';
      } else if (days == 1) {
        return 'Hier';
      } else if (days < 7) {
        return 'Il y a $days jours';
      } else if (days < 30) {
        final weeks = (days / 7).floor();
        return weeks == 1 ? 'Il y a 1 semaine' : 'Il y a $weeks semaines';
      } else if (days < 365) {
        final months = (days / 30).floor();
        return months == 1 ? 'Il y a 1 mois' : 'Il y a $months mois';
      } else {
        final years = (days / 365).floor();
        return years == 1 ? 'Il y a 1 an' : 'Il y a $years ans';
      }
    } else {
      // Dans le futur
      final days = difference.inDays;
      if (days == 0) {
        return 'Aujourd\'hui';
      } else if (days == 1) {
        return 'Demain';
      } else if (days < 7) {
        return 'Dans $days jours';
      } else if (days < 30) {
        final weeks = (days / 7).floor();
        return weeks == 1 ? 'Dans 1 semaine' : 'Dans $weeks semaines';
      } else if (days < 365) {
        final months = (days / 30).floor();
        return months == 1 ? 'Dans 1 mois' : 'Dans $months mois';
      } else {
        final years = (days / 365).floor();
        return years == 1 ? 'Dans 1 an' : 'Dans $years ans';
      }
    }
  }

  /// Valide si une chaîne est une date valide
  static bool isValidDate(String date) {
    try {
      DateTime.parse(date);
      return true;
    } catch (e) {
      return false;
    }
  }

  /// Calcule la date de rappel pour un vaccin (en années)
  static DateTime calculateVaccineReminder(DateTime vaccineDate, int years) {
    return DateTime(
      vaccineDate.year + years,
      vaccineDate.month,
      vaccineDate.day,
    );
  }
}
