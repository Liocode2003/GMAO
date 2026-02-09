import 'package:equatable/equatable.dart';

/// Profil SIGYCOP
class ProfilSigycop extends Equatable {
  final int s; // État général (0-5)
  final int i; // Membres inférieurs (0-5)
  final int g; // Membres supérieurs (0-5)
  final int y; // Yeux - vision (0-5)
  final int c; // Appareil circulatoire (0-5)
  final int o; // Oreilles - audition (0-5)
  final int p; // Psychisme (0-5)

  const ProfilSigycop({
    this.s = 0,
    this.i = 0,
    this.g = 0,
    this.y = 0,
    this.c = 0,
    this.o = 0,
    this.p = 0,
  });

  /// Calcule le score total SIGYCOP
  int get scoreTotal => s + i + g + y + c + o + p;

  /// Vérifie si le profil est complet
  bool get isComplete => s > 0 && i > 0 && g > 0 && y > 0 && c > 0 && o > 0 && p > 0;

  @override
  List<Object?> get props => [s, i, g, y, c, o, p];

  ProfilSigycop copyWith({
    int? s,
    int? i,
    int? g,
    int? y,
    int? c,
    int? o,
    int? p,
  }) {
    return ProfilSigycop(
      s: s ?? this.s,
      i: i ?? this.i,
      g: g ?? this.g,
      y: y ?? this.y,
      c: c ?? this.c,
      o: o ?? this.o,
      p: p ?? this.p,
    );
  }
}

/// Notes additionnelles
class NotesAdditionnelles extends Equatable {
  final String? v;
  final String? a;
  final String? e;
  final String? s;
  final String? i;
  final String? f;
  final String? x;

  const NotesAdditionnelles({
    this.v,
    this.a,
    this.e,
    this.s,
    this.i,
    this.f,
    this.x,
  });

  @override
  List<Object?> get props => [v, a, e, s, i, f, x];

  NotesAdditionnelles copyWith({
    String? v,
    String? a,
    String? e,
    String? s,
    String? i,
    String? f,
    String? x,
  }) {
    return NotesAdditionnelles(
      v: v ?? this.v,
      a: a ?? this.a,
      e: e ?? this.e,
      s: s ?? this.s,
      i: i ?? this.i,
      f: f ?? this.f,
      x: x ?? this.x,
    );
  }
}

/// Entité représentant l'examen médical d'incorporation
class ExamenIncorporation extends Equatable {
  final String id;
  final String sapeurPompierId;

  // Antécédents
  final String? antecedentsHereditaires;
  final String? antecedentsPersonnels;
  final String? antecedentsCollateraux;

  // Examens cliniques
  final String? appareilRespiratoire;
  final String? radiographie;
  final String? appareilGenitoUrinaire;
  final String? appareilDigestif;
  final String? appareilCirculatoire;
  final String? systemeNerveux;
  final String? dentureEtat;
  final String? coefficientMastication;
  final String? peauAnnexes;
  final int? fc; // Fréquence cardiaque
  final String? ta; // Tension artérielle
  final String? sucre;
  final String? albumine;

  // Vision
  final String? avOdSans; // Acuité visuelle Œil Droit sans correction
  final String? avOdAvec; // Acuité visuelle Œil Droit avec correction
  final String? avOgSans; // Acuité visuelle Œil Gauche sans correction
  final String? avOgAvec; // Acuité visuelle Œil Gauche avec correction
  final String? sensChromatique;

  // Audition
  final String? aaOdHaute; // Acuité auditive OD voix haute
  final String? aaOdChuchotee; // Acuité auditive OD voix chuchotée
  final String? aaOgHaute; // Acuité auditive OG voix haute
  final String? aaOgChuchotee; // Acuité auditive OG voix chuchotée

  // Profil SIGYCOP
  final ProfilSigycop profilSigycop;

  // Notes additionnelles
  final NotesAdditionnelles notesAdditionnelles;

  // Conclusions
  final DateTime? dateCloture;
  final String? decision; // 'Apte', 'Inapte définitif', 'Inapte temporaire', 'À surveiller'
  final String? aSurveiller;
  final String? mentionsSpeciales;
  final bool entrainementSpecial;
  final String? entrainementSpecialDetails;
  final String? utilisationPreferentielle;
  final String? nomMedecin;
  final String? signatureMedecinPath;

  const ExamenIncorporation({
    required this.id,
    required this.sapeurPompierId,
    this.antecedentsHereditaires,
    this.antecedentsPersonnels,
    this.antecedentsCollateraux,
    this.appareilRespiratoire,
    this.radiographie,
    this.appareilGenitoUrinaire,
    this.appareilDigestif,
    this.appareilCirculatoire,
    this.systemeNerveux,
    this.dentureEtat,
    this.coefficientMastication,
    this.peauAnnexes,
    this.fc,
    this.ta,
    this.sucre,
    this.albumine,
    this.avOdSans,
    this.avOdAvec,
    this.avOgSans,
    this.avOgAvec,
    this.sensChromatique,
    this.aaOdHaute,
    this.aaOdChuchotee,
    this.aaOgHaute,
    this.aaOgChuchotee,
    this.profilSigycop = const ProfilSigycop(),
    this.notesAdditionnelles = const NotesAdditionnelles(),
    this.dateCloture,
    this.decision,
    this.aSurveiller,
    this.mentionsSpeciales,
    this.entrainementSpecial = false,
    this.entrainementSpecialDetails,
    this.utilisationPreferentielle,
    this.nomMedecin,
    this.signatureMedecinPath,
  });

  /// Vérifie si l'examen est complet
  bool get isComplete =>
      antecedentsHereditaires != null &&
      antecedentsPersonnels != null &&
      appareilRespiratoire != null &&
      appareilCirculatoire != null &&
      profilSigycop.isComplete &&
      decision != null;

  /// Vérifie si la décision est "Apte"
  bool get isApte => decision == 'Apte';

  /// Vérifie si la décision est "Inapte"
  bool get isInapte =>
      decision == 'Inapte définitif' || decision == 'Inapte temporaire';

  @override
  List<Object?> get props => [
        id,
        sapeurPompierId,
        antecedentsHereditaires,
        antecedentsPersonnels,
        antecedentsCollateraux,
        appareilRespiratoire,
        radiographie,
        appareilGenitoUrinaire,
        appareilDigestif,
        appareilCirculatoire,
        systemeNerveux,
        dentureEtat,
        coefficientMastication,
        peauAnnexes,
        fc,
        ta,
        sucre,
        albumine,
        avOdSans,
        avOdAvec,
        avOgSans,
        avOgAvec,
        sensChromatique,
        aaOdHaute,
        aaOdChuchotee,
        aaOgHaute,
        aaOgChuchotee,
        profilSigycop,
        notesAdditionnelles,
        dateCloture,
        decision,
        aSurveiller,
        mentionsSpeciales,
        entrainementSpecial,
        entrainementSpecialDetails,
        utilisationPreferentielle,
        nomMedecin,
        signatureMedecinPath,
      ];

  ExamenIncorporation copyWith({
    String? id,
    String? sapeurPompierId,
    String? antecedentsHereditaires,
    String? antecedentsPersonnels,
    String? antecedentsCollateraux,
    String? appareilRespiratoire,
    String? radiographie,
    String? appareilGenitoUrinaire,
    String? appareilDigestif,
    String? appareilCirculatoire,
    String? systemeNerveux,
    String? dentureEtat,
    String? coefficientMastication,
    String? peauAnnexes,
    int? fc,
    String? ta,
    String? sucre,
    String? albumine,
    String? avOdSans,
    String? avOdAvec,
    String? avOgSans,
    String? avOgAvec,
    String? sensChromatique,
    String? aaOdHaute,
    String? aaOdChuchotee,
    String? aaOgHaute,
    String? aaOgChuchotee,
    ProfilSigycop? profilSigycop,
    NotesAdditionnelles? notesAdditionnelles,
    DateTime? dateCloture,
    String? decision,
    String? aSurveiller,
    String? mentionsSpeciales,
    bool? entrainementSpecial,
    String? entrainementSpecialDetails,
    String? utilisationPreferentielle,
    String? nomMedecin,
    String? signatureMedecinPath,
  }) {
    return ExamenIncorporation(
      id: id ?? this.id,
      sapeurPompierId: sapeurPompierId ?? this.sapeurPompierId,
      antecedentsHereditaires:
          antecedentsHereditaires ?? this.antecedentsHereditaires,
      antecedentsPersonnels:
          antecedentsPersonnels ?? this.antecedentsPersonnels,
      antecedentsCollateraux:
          antecedentsCollateraux ?? this.antecedentsCollateraux,
      appareilRespiratoire: appareilRespiratoire ?? this.appareilRespiratoire,
      radiographie: radiographie ?? this.radiographie,
      appareilGenitoUrinaire:
          appareilGenitoUrinaire ?? this.appareilGenitoUrinaire,
      appareilDigestif: appareilDigestif ?? this.appareilDigestif,
      appareilCirculatoire: appareilCirculatoire ?? this.appareilCirculatoire,
      systemeNerveux: systemeNerveux ?? this.systemeNerveux,
      dentureEtat: dentureEtat ?? this.dentureEtat,
      coefficientMastication:
          coefficientMastication ?? this.coefficientMastication,
      peauAnnexes: peauAnnexes ?? this.peauAnnexes,
      fc: fc ?? this.fc,
      ta: ta ?? this.ta,
      sucre: sucre ?? this.sucre,
      albumine: albumine ?? this.albumine,
      avOdSans: avOdSans ?? this.avOdSans,
      avOdAvec: avOdAvec ?? this.avOdAvec,
      avOgSans: avOgSans ?? this.avOgSans,
      avOgAvec: avOgAvec ?? this.avOgAvec,
      sensChromatique: sensChromatique ?? this.sensChromatique,
      aaOdHaute: aaOdHaute ?? this.aaOdHaute,
      aaOdChuchotee: aaOdChuchotee ?? this.aaOdChuchotee,
      aaOgHaute: aaOgHaute ?? this.aaOgHaute,
      aaOgChuchotee: aaOgChuchotee ?? this.aaOgChuchotee,
      profilSigycop: profilSigycop ?? this.profilSigycop,
      notesAdditionnelles: notesAdditionnelles ?? this.notesAdditionnelles,
      dateCloture: dateCloture ?? this.dateCloture,
      decision: decision ?? this.decision,
      aSurveiller: aSurveiller ?? this.aSurveiller,
      mentionsSpeciales: mentionsSpeciales ?? this.mentionsSpeciales,
      entrainementSpecial: entrainementSpecial ?? this.entrainementSpecial,
      entrainementSpecialDetails:
          entrainementSpecialDetails ?? this.entrainementSpecialDetails,
      utilisationPreferentielle:
          utilisationPreferentielle ?? this.utilisationPreferentielle,
      nomMedecin: nomMedecin ?? this.nomMedecin,
      signatureMedecinPath: signatureMedecinPath ?? this.signatureMedecinPath,
    );
  }
}
