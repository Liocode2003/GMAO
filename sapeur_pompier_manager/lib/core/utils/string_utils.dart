class StringUtils {
  StringUtils._();

  /// Capitalizes the first letter of a string, lowercases the rest.
  /// Example: "hELLO" -> "Hello"
  static String capitalize(String text) {
    if (text.isEmpty) return text;
    return text[0].toUpperCase() + text.substring(1).toLowerCase();
  }

  /// Capitalizes the first letter of each word.
  /// Example: "jean dupont" -> "Jean Dupont"
  static String capitalizeWords(String text) {
    if (text.isEmpty) return text;
    return text
        .split(RegExp(r'\s+'))
        .map((word) => word.isEmpty ? word : capitalize(word))
        .join(' ');
  }

  /// Truncates text to [maxLength] characters, appending "..." if truncated.
  static String truncate(String text, int maxLength) {
    if (text.length <= maxLength) return text;
    if (maxLength <= 3) return '...' .substring(0, maxLength.clamp(0, 3));
    return '${text.substring(0, maxLength - 3)}...';
  }

  /// Extracts initials from a full name.
  /// Example: "Jean Dupont" -> "JD", "Marie" -> "M"
  static String initials(String fullName) {
    final parts = fullName.trim().split(RegExp(r'\s+'));
    final filtered = parts.where((p) => p.isNotEmpty).toList();
    if (filtered.isEmpty) return '';
    if (filtered.length == 1) return filtered[0][0].toUpperCase();
    return filtered.map((p) => p[0].toUpperCase()).take(2).join();
  }

  /// Returns true if [email] is a valid email address.
  static bool isValidEmail(String email) {
    final pattern = RegExp(
      r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$',
    );
    return pattern.hasMatch(email.trim());
  }

  /// Returns true if [matricule] matches the Burkina Faso format.
  /// Expected formats: alphanumeric, 4-12 characters (e.g., "SP12345", "2024001").
  static bool isValidMatricule(String matricule) {
    final pattern = RegExp(r'^[A-Za-z0-9\-/]{3,15}$');
    return pattern.hasMatch(matricule.trim());
  }

  /// Formats a phone number to Burkina Faso convention.
  /// Strips non-digit characters, then formats as "XX XX XX XX".
  /// Handles numbers with country prefix +226.
  static String formatPhone(String phone) {
    String digits = phone.replaceAll(RegExp(r'\D'), '');

    // Remove Burkina country code if present
    if (digits.startsWith('226') && digits.length == 11) {
      digits = digits.substring(3);
    }

    if (digits.length != 8) return phone;

    return '${digits.substring(0, 2)} ${digits.substring(2, 4)} '
        '${digits.substring(4, 6)} ${digits.substring(6, 8)}';
  }

  /// Removes common French accented characters for search/comparison purposes.
  static String removeAccents(String text) {
    const Map<String, String> _accentMap = {
      'à': 'a', 'â': 'a', 'ä': 'a', 'á': 'a', 'ã': 'a',
      'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
      'î': 'i', 'ï': 'i', 'í': 'i', 'ì': 'i',
      'ô': 'o', 'ö': 'o', 'ò': 'o', 'ó': 'o', 'õ': 'o',
      'ù': 'u', 'û': 'u', 'ü': 'u', 'ú': 'u',
      'ç': 'c', 'ñ': 'n',
      'À': 'A', 'Â': 'A', 'Ä': 'A', 'Á': 'A', 'Ã': 'A',
      'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E',
      'Î': 'I', 'Ï': 'I', 'Í': 'I', 'Ì': 'I',
      'Ô': 'O', 'Ö': 'O', 'Ò': 'O', 'Ó': 'O', 'Õ': 'O',
      'Ù': 'U', 'Û': 'U', 'Ü': 'U', 'Ú': 'U',
      'Ç': 'C', 'Ñ': 'N',
    };
    return text.replaceAllMapped(
      RegExp('[àâäáãèéêëîïíìôöòóõùûüúçñÀÂÄÁÃÈÉÊËÎÏÍÌÔÖÒÓÕÙÛÜÚÇÑ]'),
      (match) => _accentMap[match.group(0)] ?? match.group(0)!,
    );
  }

  /// Returns a standard abbreviated grade for display purposes.
  /// Handles common Burkina Faso sapeur-pompier grades.
  static String formatGrade(String grade) {
    const Map<String, String> _gradeMap = {
      'sapeur': 'Sap.',
      'sapeur 1ère classe': 'Sap.1CL',
      'caporal': 'Cap.',
      'caporal-chef': 'Cap.Ch.',
      'sergent': 'Sgt',
      'sergent-chef': 'Sgt.Ch.',
      'adjudant': 'Adj.',
      'adjudant-chef': 'Adj.Ch.',
      'major': 'Maj.',
      'lieutenant': 'Lt',
      'capitaine': 'Cpt',
      'commandant': 'Cdt',
      'lieutenant-colonel': 'Lt.Col',
      'colonel': 'Col.',
      'général': 'Gén.',
    };

    final normalized = grade.trim().toLowerCase();
    return _gradeMap[normalized] ?? grade;
  }
}
