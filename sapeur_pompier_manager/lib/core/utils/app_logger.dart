import 'package:flutter/foundation.dart';

/// Log level enum for filtering log output.
enum _LogLevel { debug, info, warning, error }

/// A simple structured logger for the GMAO app.
///
/// In debug mode, all levels are printed to the console.
/// In release mode, only [warning] and [error] messages are emitted
/// (to avoid leaking sensitive data).
///
/// Example usage:
/// ```dart
/// AppLogger.info('Dossier chargé', tag: 'DossierRepo');
/// AppLogger.error('Échec de la sauvegarde', tag: 'DB', error: e, stackTrace: st);
/// ```
class AppLogger {
  AppLogger._();

  static bool _verbose = kDebugMode;

  /// Enable or disable verbose (debug) logging at runtime.
  static void setVerbose(bool enabled) => _verbose = enabled;

  // ── Public API ────────────────────────────────────────────────────────────

  /// Logs an informational message.
  static void info(String message, {String? tag}) {
    _log(_LogLevel.info, message, tag: tag);
  }

  /// Logs a warning message.
  static void warning(String message, {String? tag}) {
    _log(_LogLevel.warning, message, tag: tag);
  }

  /// Logs an error message with optional [error] object and [stackTrace].
  static void error(
    String message, {
    String? tag,
    Object? error,
    StackTrace? stackTrace,
  }) {
    _log(
      _LogLevel.error,
      message,
      tag: tag,
      error: error,
      stackTrace: stackTrace,
    );
  }

  /// Logs a debug message. Only printed when verbose mode is enabled.
  static void debug(String message, {String? tag}) {
    if (!_verbose) return;
    _log(_LogLevel.debug, message, tag: tag);
  }

  // ── Internal ─────────────────────────────────────────────────────────────

  static void _log(
    _LogLevel level,
    String message, {
    String? tag,
    Object? error,
    StackTrace? stackTrace,
  }) {
    // In release mode, suppress debug and info to limit data exposure.
    if (!kDebugMode && level == _LogLevel.debug) return;
    if (!kDebugMode && level == _LogLevel.info) return;

    final prefix = _prefix(level);
    final tagPart = tag != null ? '[$tag] ' : '';
    final timestamp = _timestamp();

    // ignore: avoid_print
    print('$prefix $timestamp $tagPart$message');

    if (error != null) {
      // ignore: avoid_print
      print('$prefix   ERROR: $error');
    }

    if (stackTrace != null) {
      // ignore: avoid_print
      print('$prefix   STACK:\n$stackTrace');
    }
  }

  static String _prefix(_LogLevel level) {
    switch (level) {
      case _LogLevel.debug:
        return '[DEBUG]';
      case _LogLevel.info:
        return '[INFO ]';
      case _LogLevel.warning:
        return '[WARN ]';
      case _LogLevel.error:
        return '[ERROR]';
    }
  }

  static String _timestamp() {
    final now = DateTime.now();
    final h = now.hour.toString().padLeft(2, '0');
    final min = now.minute.toString().padLeft(2, '0');
    final sec = now.second.toString().padLeft(2, '0');
    final ms = now.millisecond.toString().padLeft(3, '0');
    return '$h:$min:$sec.$ms';
  }
}
