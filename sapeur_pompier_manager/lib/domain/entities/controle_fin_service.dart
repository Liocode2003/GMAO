import 'package:equatable/equatable.dart';

/// États de santé possibles pour le contrôle de fin de service
enum EtatSanteFinService {
  bonneSante('Bonne santé'),
  atteintDe('Atteint de');

  const EtatSanteFinService(this.libelle);
  final String libelle;
}

/// Entité représentant le contrôle de fin de service
class ControleFinService extends Equatable {
  final String id;
  final String sapeurPompierId;
  final DateTime? dateRadiation;
  final String? lieuExamen;
  final String? etatSante; // EtatSanteFinService enum value
  final String? atteintDe; // Si etatSante == 'atteintDe'
  final String? hospitaliseA;

  // Examen clinique final
  final double? poids;
  final double? taille;
  final double? indicePignet;
  final String? ta;
  final String? sucre;
  final String? albumine;

  // Vision finale
  final String? avOdSans;
  final String? avOdAvec;
  final String? avOgSans;
  final String? avOgAvec;

  // Audition finale
  final String? aaOdHaute;
  final String? aaOdChuchotee;
  final String? aaOgHaute;
  final String? aaOgChuchotee;

  // Profil SIGYCOP final (notes textuelles)
  final String? noteE;
  final String? noteV;
  final String? noteA;
  final String? noteS;
  final String? noteI;
  final String? noteF;
  final String? noteX;

  // Signature
  final String? nomMedecin;
  final DateTime? dateSignature;
  final String? signaturePath;

  const ControleFinService({
    required this.id,
    required this.sapeurPompierId,
    this.dateRadiation,
    this.lieuExamen,
    this.etatSante,
    this.atteintDe,
    this.hospitaliseA,
    this.poids,
    this.taille,
    this.indicePignet,
    this.ta,
    this.sucre,
    this.albumine,
    this.avOdSans,
    this.avOdAvec,
    this.avOgSans,
    this.avOgAvec,
    this.aaOdHaute,
    this.aaOdChuchotee,
    this.aaOgHaute,
    this.aaOgChuchotee,
    this.noteE,
    this.noteV,
    this.noteA,
    this.noteS,
    this.noteI,
    this.noteF,
    this.noteX,
    this.nomMedecin,
    this.dateSignature,
    this.signaturePath,
  });

  /// Calcule l'indice Pignet automatiquement
  /// Formule: Indice Pignet = taille (cm) - (poids (kg) + périmètre thoracique (cm))
  /// Note: le périmètre thoracique devrait venir des constantes
  static double? calculateIndicePignet(
    double? taille,
    double? poids,
    double? perimetreThoracique,
  ) {
    if (taille == null || poids == null || perimetreThoracique == null) {
      return null;
    }
    return taille - (poids + perimetreThoracique);
  }

  /// Interprétation de l'indice Pignet
  String get indicePignetInterpretation {
    if (indicePignet == null) return 'Non calculé';
    if (indicePignet! > 20) return 'Excellent';
    if (indicePignet! > 10) return 'Bon';
    if (indicePignet! > 0) return 'Moyen';
    if (indicePignet! > -10) return 'Faible';
    return 'Très faible';
  }

  /// Vérifie si l'état de santé est "Bonne santé"
  bool get isBonneSante =>
      etatSante == EtatSanteFinService.bonneSante.name;

  /// Vérifie si la signature est disponible
  bool get hasSignature => signaturePath != null && signaturePath!.isNotEmpty;

  /// Vérifie si le contrôle est complet
  bool get isComplete =>
      dateRadiation != null &&
      lieuExamen != null &&
      etatSante != null &&
      nomMedecin != null &&
      dateSignature != null;

  @override
  List<Object?> get props => [
        id,
        sapeurPompierId,
        dateRadiation,
        lieuExamen,
        etatSante,
        atteintDe,
        hospitaliseA,
        poids,
        taille,
        indicePignet,
        ta,
        sucre,
        albumine,
        avOdSans,
        avOdAvec,
        avOgSans,
        avOgAvec,
        aaOdHaute,
        aaOdChuchotee,
        aaOgHaute,
        aaOgChuchotee,
        noteE,
        noteV,
        noteA,
        noteS,
        noteI,
        noteF,
        noteX,
        nomMedecin,
        dateSignature,
        signaturePath,
      ];

  ControleFinService copyWith({
    String? id,
    String? sapeurPompierId,
    DateTime? dateRadiation,
    String? lieuExamen,
    String? etatSante,
    String? atteintDe,
    String? hospitaliseA,
    double? poids,
    double? taille,
    double? indicePignet,
    String? ta,
    String? sucre,
    String? albumine,
    String? avOdSans,
    String? avOdAvec,
    String? avOgSans,
    String? avOgAvec,
    String? aaOdHaute,
    String? aaOdChuchotee,
    String? aaOgHaute,
    String? aaOgChuchotee,
    String? noteE,
    String? noteV,
    String? noteA,
    String? noteS,
    String? noteI,
    String? noteF,
    String? noteX,
    String? nomMedecin,
    DateTime? dateSignature,
    String? signaturePath,
  }) {
    return ControleFinService(
      id: id ?? this.id,
      sapeurPompierId: sapeurPompierId ?? this.sapeurPompierId,
      dateRadiation: dateRadiation ?? this.dateRadiation,
      lieuExamen: lieuExamen ?? this.lieuExamen,
      etatSante: etatSante ?? this.etatSante,
      atteintDe: atteintDe ?? this.atteintDe,
      hospitaliseA: hospitaliseA ?? this.hospitaliseA,
      poids: poids ?? this.poids,
      taille: taille ?? this.taille,
      indicePignet: indicePignet ?? this.indicePignet,
      ta: ta ?? this.ta,
      sucre: sucre ?? this.sucre,
      albumine: albumine ?? this.albumine,
      avOdSans: avOdSans ?? this.avOdSans,
      avOdAvec: avOdAvec ?? this.avOdAvec,
      avOgSans: avOgSans ?? this.avOgSans,
      avOgAvec: avOgAvec ?? this.avOgAvec,
      aaOdHaute: aaOdHaute ?? this.aaOdHaute,
      aaOdChuchotee: aaOdChuchotee ?? this.aaOdChuchotee,
      aaOgHaute: aaOgHaute ?? this.aaOgHaute,
      aaOgChuchotee: aaOgChuchotee ?? this.aaOgChuchotee,
      noteE: noteE ?? this.noteE,
      noteV: noteV ?? this.noteV,
      noteA: noteA ?? this.noteA,
      noteS: noteS ?? this.noteS,
      noteI: noteI ?? this.noteI,
      noteF: noteF ?? this.noteF,
      noteX: noteX ?? this.noteX,
      nomMedecin: nomMedecin ?? this.nomMedecin,
      dateSignature: dateSignature ?? this.dateSignature,
      signaturePath: signaturePath ?? this.signaturePath,
    );
  }
}
