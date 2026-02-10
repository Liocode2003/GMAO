import 'dart:io';
import 'package:bcrypt/bcrypt.dart';
import 'package:path/path.dart';
import 'package:path_provider/path_provider.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';
import 'package:logger/logger.dart';

/// Service de base de données SQLite locale
class LocalDatabase {
  static final LocalDatabase instance = LocalDatabase._internal();
  static Database? _database;
  final Logger _logger = Logger();

  LocalDatabase._internal();

  /// Obtient l'instance de la base de données
  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  /// Initialise la base de données
  Future<Database> _initDatabase() async {
    try {
      // Initialiser FFI pour desktop
      sqfliteFfiInit();
      databaseFactory = databaseFactoryFfi;

      // Obtenir le chemin du dossier de documents
      final documentsDirectory = await getApplicationDocumentsDirectory();
      final dbPath = join(documentsDirectory.path, 'sapeur_pompier_db.sqlite');

      _logger.i('Initialisation de la base de données à: $dbPath');

      // Ouvrir/créer la base de données
      return await openDatabase(
        dbPath,
        version: 1,
        onCreate: _createDatabase,
        onUpgrade: _upgradeDatabase,
      );
    } catch (e) {
      _logger.e('Erreur lors de l\'initialisation de la base de données: $e');
      rethrow;
    }
  }

  /// Crée les tables de la base de données
  Future<void> _createDatabase(Database db, int version) async {
    _logger.i('Création des tables de la base de données...');

    // Table sapeurs_pompiers
    await db.execute('''
      CREATE TABLE sapeurs_pompiers (
        id TEXT PRIMARY KEY,
        matricule TEXT UNIQUE NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        created_by TEXT,
        updated_by TEXT
      )
    ''');

    // Table etat_civil
    await db.execute('''
      CREATE TABLE etat_civil (
        id TEXT PRIMARY KEY,
        sapeur_pompier_id TEXT NOT NULL,
        nom TEXT NOT NULL,
        prenoms TEXT NOT NULL,
        date_naissance TEXT NOT NULL,
        lieu_naissance TEXT NOT NULL,
        nom_pere TEXT,
        nom_mere TEXT,
        photo_path TEXT,
        contact_urgence_1_nom TEXT,
        contact_urgence_1_tel TEXT,
        contact_urgence_1_lien TEXT,
        contact_urgence_2_nom TEXT,
        contact_urgence_2_tel TEXT,
        contact_urgence_2_lien TEXT,
        contact_urgence_3_nom TEXT,
        contact_urgence_3_tel TEXT,
        contact_urgence_3_lien TEXT,
        FOREIGN KEY (sapeur_pompier_id) REFERENCES sapeurs_pompiers(id) ON DELETE CASCADE
      )
    ''');

    // Table constantes
    await db.execute('''
      CREATE TABLE constantes (
        id TEXT PRIMARY KEY,
        sapeur_pompier_id TEXT NOT NULL,
        taille REAL,
        poids REAL,
        imc REAL,
        perimetre_thoracique REAL,
        perimetre_abdominal REAL,
        empreintes_path TEXT,
        signature_path TEXT,
        date_mesure TEXT,
        FOREIGN KEY (sapeur_pompier_id) REFERENCES sapeurs_pompiers(id) ON DELETE CASCADE
      )
    ''');

    // Table historique_poids
    await db.execute('''
      CREATE TABLE historique_poids (
        id TEXT PRIMARY KEY,
        sapeur_pompier_id TEXT NOT NULL,
        annee INTEGER NOT NULL,
        poids REAL NOT NULL,
        date_mesure TEXT,
        FOREIGN KEY (sapeur_pompier_id) REFERENCES sapeurs_pompiers(id) ON DELETE CASCADE
      )
    ''');

    // Table examens_incorporation
    await db.execute('''
      CREATE TABLE examens_incorporation (
        id TEXT PRIMARY KEY,
        sapeur_pompier_id TEXT NOT NULL,
        antecedents_hereditaires TEXT,
        antecedents_personnels TEXT,
        antecedents_collateraux TEXT,
        appareil_respiratoire TEXT,
        radiographie TEXT,
        appareil_genito_urinaire TEXT,
        appareil_digestif TEXT,
        appareil_circulatoire TEXT,
        systeme_nerveux TEXT,
        denture_etat TEXT,
        coefficient_mastication TEXT,
        peau_annexes TEXT,
        fc INTEGER,
        ta TEXT,
        sucre TEXT,
        albumine TEXT,
        av_od_sans TEXT,
        av_od_avec TEXT,
        av_og_sans TEXT,
        av_og_avec TEXT,
        sens_chromatique TEXT,
        aa_od_haute TEXT,
        aa_od_chuchotee TEXT,
        aa_og_haute TEXT,
        aa_og_chuchotee TEXT,
        sigycop_s INTEGER,
        sigycop_i INTEGER,
        sigycop_g INTEGER,
        sigycop_y INTEGER,
        sigycop_c INTEGER,
        sigycop_o INTEGER,
        sigycop_p INTEGER,
        note_v TEXT,
        note_a TEXT,
        note_e TEXT,
        note_s TEXT,
        note_i TEXT,
        note_f TEXT,
        note_x TEXT,
        date_cloture TEXT,
        decision TEXT,
        a_surveiller TEXT,
        mentions_speciales TEXT,
        entrainement_special INTEGER,
        entrainement_special_details TEXT,
        utilisation_preferentielle TEXT,
        nom_medecin TEXT,
        signature_medecin_path TEXT,
        FOREIGN KEY (sapeur_pompier_id) REFERENCES sapeurs_pompiers(id) ON DELETE CASCADE
      )
    ''');

    // Table operations
    await db.execute('''
      CREATE TABLE operations (
        id TEXT PRIMARY KEY,
        sapeur_pompier_id TEXT NOT NULL,
        numero_sejour INTEGER NOT NULL,
        lieu_sejour TEXT,
        date_depart TEXT,
        etat_sante_depart TEXT,
        poids_depart REAL,
        ta_depart TEXT,
        av_depart TEXT,
        glycemie_depart TEXT,
        aa_depart TEXT,
        observations_depart TEXT,
        lieu_signature_depart TEXT,
        date_signature_depart TEXT,
        nom_medecin_depart TEXT,
        date_retour TEXT,
        etat_sante_retour TEXT,
        poids_retour REAL,
        ta_retour TEXT,
        av_retour TEXT,
        glycemie_retour TEXT,
        aa_retour TEXT,
        observations_retour TEXT,
        lieu_signature_retour TEXT,
        date_signature_retour TEXT,
        nom_medecin_retour TEXT,
        FOREIGN KEY (sapeur_pompier_id) REFERENCES sapeurs_pompiers(id) ON DELETE CASCADE
      )
    ''');

    // Table vaccinations
    await db.execute('''
      CREATE TABLE vaccinations (
        id TEXT PRIMARY KEY,
        sapeur_pompier_id TEXT NOT NULL,
        type_vaccin TEXT NOT NULL,
        date_vaccination TEXT NOT NULL,
        nombre_doses INTEGER,
        reference_lot TEXT,
        nom_medecin TEXT,
        signature_path TEXT,
        observations TEXT,
        date_rappel TEXT,
        FOREIGN KEY (sapeur_pompier_id) REFERENCES sapeurs_pompiers(id) ON DELETE CASCADE
      )
    ''');

    // Table visites_sanitaires
    await db.execute('''
      CREATE TABLE visites_sanitaires (
        id TEXT PRIMARY KEY,
        sapeur_pompier_id TEXT NOT NULL,
        entite_corps TEXT,
        date_visite TEXT NOT NULL,
        resultats TEXT,
        observations TEXT,
        nom_medecin TEXT,
        signature_path TEXT,
        FOREIGN KEY (sapeur_pompier_id) REFERENCES sapeurs_pompiers(id) ON DELETE CASCADE
      )
    ''');

    // Table indisponibilites
    await db.execute('''
      CREATE TABLE indisponibilites (
        id TEXT PRIMARY KEY,
        sapeur_pompier_id TEXT NOT NULL,
        corps_entite TEXT,
        date_debut TEXT NOT NULL,
        date_fin TEXT NOT NULL,
        diagnostic TEXT,
        duree_hopital INTEGER,
        duree_infirmerie INTEGER,
        duree_chambre INTEGER,
        observations TEXT,
        nom_medecin TEXT,
        visa_signature_path TEXT,
        FOREIGN KEY (sapeur_pompier_id) REFERENCES sapeurs_pompiers(id) ON DELETE CASCADE
      )
    ''');

    // Table certificats
    await db.execute('''
      CREATE TABLE certificats (
        id TEXT PRIMARY KEY,
        sapeur_pompier_id TEXT NOT NULL,
        titre TEXT NOT NULL,
        date_certificat TEXT,
        type_certificat TEXT,
        fichier_path TEXT,
        notes TEXT,
        FOREIGN KEY (sapeur_pompier_id) REFERENCES sapeurs_pompiers(id) ON DELETE CASCADE
      )
    ''');

    // Table decisions_reforme
    await db.execute('''
      CREATE TABLE decisions_reforme (
        id TEXT PRIMARY KEY,
        sapeur_pompier_id TEXT NOT NULL,
        date_decision TEXT NOT NULL,
        diagnostic TEXT,
        type_decision TEXT,
        observations TEXT,
        signature_autorite_path TEXT,
        FOREIGN KEY (sapeur_pompier_id) REFERENCES sapeurs_pompiers(id) ON DELETE CASCADE
      )
    ''');

    // Table controles_fin_service
    await db.execute('''
      CREATE TABLE controles_fin_service (
        id TEXT PRIMARY KEY,
        sapeur_pompier_id TEXT NOT NULL,
        date_radiation TEXT,
        lieu_examen TEXT,
        etat_sante TEXT,
        atteint_de TEXT,
        hospitalise_a TEXT,
        poids REAL,
        taille REAL,
        indice_pignet REAL,
        ta TEXT,
        sucre TEXT,
        albumine TEXT,
        av_od_sans TEXT,
        av_od_avec TEXT,
        av_og_sans TEXT,
        av_og_avec TEXT,
        aa_od_haute TEXT,
        aa_od_chuchotee TEXT,
        aa_og_haute TEXT,
        aa_og_chuchotee TEXT,
        note_e TEXT,
        note_v TEXT,
        note_a TEXT,
        note_s TEXT,
        note_i TEXT,
        note_f TEXT,
        note_x TEXT,
        nom_medecin TEXT,
        date_signature TEXT,
        signature_path TEXT,
        FOREIGN KEY (sapeur_pompier_id) REFERENCES sapeurs_pompiers(id) ON DELETE CASCADE
      )
    ''');

    // Table users
    await db.execute('''
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        nom_complet TEXT,
        created_at TEXT NOT NULL,
        last_login TEXT,
        is_active INTEGER DEFAULT 1
      )
    ''');

    // Table access_logs
    await db.execute('''
      CREATE TABLE access_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        action TEXT NOT NULL,
        sapeur_pompier_id TEXT,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    ''');

    // Table settings
    await db.execute('''
      CREATE TABLE settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    ''');

    // Créer des index pour améliorer les performances
    await db.execute('CREATE INDEX idx_sapeurs_matricule ON sapeurs_pompiers(matricule)');
    await db.execute('CREATE INDEX idx_etat_civil_sp ON etat_civil(sapeur_pompier_id)');
    await db.execute('CREATE INDEX idx_vaccinations_sp ON vaccinations(sapeur_pompier_id)');
    await db.execute('CREATE INDEX idx_vaccinations_date ON vaccinations(date_rappel)');
    await db.execute('CREATE INDEX idx_visites_sp ON visites_sanitaires(sapeur_pompier_id)');
    await db.execute('CREATE INDEX idx_logs_user ON access_logs(user_id)');
    await db.execute('CREATE INDEX idx_logs_timestamp ON access_logs(timestamp)');

    _logger.i('Tables créées avec succès');

    // Insérer les paramètres par défaut
    await _insertDefaultSettings(db);

    // Créer un utilisateur admin par défaut
    await _createDefaultAdmin(db);
  }

  /// Mise à jour de la base de données
  Future<void> _upgradeDatabase(Database db, int oldVersion, int newVersion) async {
    _logger.i('Mise à jour de la base de données de v$oldVersion à v$newVersion');
    // Ajouter ici les migrations futures si nécessaire
  }

  /// Insère les paramètres par défaut
  Future<void> _insertDefaultSettings(Database db) async {
    await db.insert('settings', {
      'key': 'backup_path',
      'value': 'backups/',
    });
    await db.insert('settings', {
      'key': 'auto_backup_frequency',
      'value': 'daily',
    });
    await db.insert('settings', {
      'key': 'auto_logout_delay',
      'value': '30',
    });
    await db.insert('settings', {
      'key': 'institution_name',
      'value': 'Service des Sapeurs-Pompiers - Burkina Faso',
    });
    await db.insert('settings', {
      'key': 'institution_address',
      'value': 'Ouagadougou, Burkina Faso',
    });
    _logger.i('Paramètres par défaut insérés');
  }

  /// Crée l'utilisateur administrateur par défaut
  Future<void> _createDefaultAdmin(Database db) async {
    // Génère le hash bcrypt du mot de passe par défaut "admin123"
    final passwordHash = BCrypt.hashpw('admin123', BCrypt.gensalt(logRounds: 10));

    await db.insert('users', {
      'id': 'admin-default-id',
      'username': 'admin',
      'email': 'admin@spr.bf',
      'password_hash': passwordHash,
      'role': 'admin',
      'nom_complet': 'Administrateur',
      'created_at': DateTime.now().toIso8601String(),
      'last_login': null,
      'is_active': 1,
    });

    _logger.i('Utilisateur administrateur créé (admin/admin123)');
  }

  /// Ferme la base de données
  Future<void> close() async {
    final db = await database;
    await db.close();
    _database = null;
    _logger.i('Base de données fermée');
  }

  /// Effectue une sauvegarde de la base de données
  Future<String> backup() async {
    try {
      final db = await database;
      final dbPath = db.path;

      final documentsDirectory = await getApplicationDocumentsDirectory();
      final backupDir = Directory(join(documentsDirectory.path, 'backups'));

      if (!await backupDir.exists()) {
        await backupDir.create(recursive: true);
      }

      final timestamp = DateTime.now().toIso8601String().replaceAll(':', '-');
      final backupPath = join(backupDir.path, 'backup_$timestamp.db');

      await File(dbPath).copy(backupPath);

      _logger.i('Sauvegarde créée: $backupPath');
      return backupPath;
    } catch (e) {
      _logger.e('Erreur lors de la sauvegarde: $e');
      rethrow;
    }
  }

  /// Restaure une sauvegarde
  Future<void> restore(String backupPath) async {
    try {
      final db = await database;
      await db.close();
      _database = null;

      final documentsDirectory = await getApplicationDocumentsDirectory();
      final dbPath = join(documentsDirectory.path, 'sapeur_pompier_db.sqlite');

      await File(backupPath).copy(dbPath);

      _logger.i('Restauration effectuée depuis: $backupPath');

      // Réinitialiser la connexion
      _database = await _initDatabase();
    } catch (e) {
      _logger.e('Erreur lors de la restauration: $e');
      rethrow;
    }
  }

  /// Obtient toutes les sauvegardes disponibles
  Future<List<FileSystemEntity>> getBackups() async {
    try {
      final documentsDirectory = await getApplicationDocumentsDirectory();
      final backupDir = Directory(join(documentsDirectory.path, 'backups'));

      if (!await backupDir.exists()) {
        return [];
      }

      final files = backupDir.listSync()
        ..sort((a, b) => b.statSync().modified.compareTo(a.statSync().modified));

      return files.where((f) => f.path.endsWith('.db')).toList();
    } catch (e) {
      _logger.e('Erreur lors de la récupération des sauvegardes: $e');
      return [];
    }
  }
}
