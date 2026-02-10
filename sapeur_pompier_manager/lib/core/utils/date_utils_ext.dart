extension DateTimeUtils on DateTime {
  static const List<String> _frenchMonths = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ];

  /// Returns a French long-form date: "10 février 2026"
  String toFrenchDate() {
    return '$day ${_frenchMonths[month - 1]} $year';
  }

  /// Returns a short date string: "10/02/2026"
  String toShortDate() {
    final d = day.toString().padLeft(2, '0');
    final m = month.toString().padLeft(2, '0');
    return '$d/$m/$year';
  }

  /// Returns an ISO date string: "2026-02-10"
  String toIsoDate() {
    final d = day.toString().padLeft(2, '0');
    final m = month.toString().padLeft(2, '0');
    return '$year-$m-$d';
  }

  /// Returns true if this date is strictly before now.
  bool isExpired() {
    return isBefore(DateTime.now());
  }

  /// Returns true if this date is within [days] days from now (and not yet expired).
  bool isExpiringSoon(int days) {
    final now = DateTime.now();
    final threshold = now.add(Duration(days: days));
    return !isBefore(now) && isBefore(threshold);
  }

  /// Calculates the age in completed years from this date to today.
  int ageInYears() {
    final now = DateTime.now();
    int age = now.year - year;
    final hadBirthdayThisYear = (now.month > month) ||
        (now.month == month && now.day >= day);
    if (!hadBirthdayThisYear) age--;
    return age < 0 ? 0 : age;
  }
}

extension StringDateUtils on String {
  /// Parses a "yyyy-MM-dd" string to a DateTime, or returns null on failure.
  DateTime? toDateTime() {
    try {
      return DateTime.parse(trim());
    } catch (_) {
      return null;
    }
  }

  /// Converts a "yyyy-MM-dd" string to a French long-form date: "10 février 2026".
  /// Returns the original string if parsing fails.
  String toFrenchDate() {
    final dt = toDateTime();
    if (dt == null) return this;
    return dt.toFrenchDate();
  }

  /// Returns true if the string matches a valid "yyyy-MM-dd" date format and is a real date.
  bool isValidDate() {
    final pattern = RegExp(r'^\d{4}-\d{2}-\d{2}$');
    if (!pattern.hasMatch(trim())) return false;
    try {
      final dt = DateTime.parse(trim());
      final parts = trim().split('-');
      return dt.month == int.parse(parts[1]) && dt.day == int.parse(parts[2]);
    } catch (_) {
      return false;
    }
  }
}
