import '../../domain/entities/examen_incorporation.dart';

/// Model de données pour ProfilSigycop avec sérialisation JSON
class ProfilSigycopModel extends ProfilSigycop {
  const ProfilSigycopModel({
    super.s,
    super.i,
    super.g,
    super.y,
    super.c,
    super.o,
    super.p,
  });

  /// Crée un ProfilSigycopModel depuis JSON
  factory ProfilSigycopModel.fromJson(Map<String, dynamic> json) {
    return ProfilSigycopModel(
      s: json['s'] as int? ?? 0,
      i: json['i'] as int? ?? 0,
      g: json['g'] as int? ?? 0,
      y: json['y'] as int? ?? 0,
      c: json['c'] as int? ?? 0,
      o: json['o'] as int? ?? 0,
      p: json['p'] as int? ?? 0,
    );
  }

  /// Convertit ProfilSigycopModel vers JSON
  Map<String, dynamic> toJson() {
    return {
      's': s,
      'i': i,
      'g': g,
      'y': y,
      'c': c,
      'o': o,
      'p': p,
    };
  }

  /// Crée un ProfilSigycopModel depuis une entité ProfilSigycop
  factory ProfilSigycopModel.fromEntity(ProfilSigycop profil) {
    return ProfilSigycopModel(
      s: profil.s,
      i: profil.i,
      g: profil.g,
      y: profil.y,
      c: profil.c,
      o: profil.o,
      p: profil.p,
    );
  }
}

/// Model de données pour NotesAdditionnelles avec sérialisation JSON
class NotesAdditionnellesModel extends NotesAdditionnelles {
  const NotesAdditionnellesModel({
    super.v,
    super.a,
    super.e,
    super.s,
    super.i,
    super.f,
    super.x,
  });

  /// Crée un NotesAdditionnellesModel depuis JSON
  factory NotesAdditionnellesModel.fromJson(Map<String, dynamic> json) {
    return NotesAdditionnellesModel(
      v: json['v'] as String?,
      a: json['a'] as String?,
      e: json['e'] as String?,
      s: json['s'] as String?,
      i: json['i'] as String?,
      f: json['f'] as String?,
      x: json['x'] as String?,
    );
  }

  /// Convertit NotesAdditionnellesModel vers JSON
  Map<String, dynamic> toJson() {
    return {
      'v': v,
      'a': a,
      'e': e,
      's': s,
      'i': i,
      'f': f,
      'x': x,
    };
  }

  /// Crée un NotesAdditionnellesModel depuis une entité NotesAdditionnelles
  factory NotesAdditionnellesModel.fromEntity(NotesAdditionnelles notes) {
    return NotesAdditionnellesModel(
      v: notes.v,
      a: notes.a,
      e: notes.e,
      s: notes.s,
      i: notes.i,
      f: notes.f,
      x: notes.x,
    );
  }
}

/// Model de données pour ExamenIncorporation avec sérialisation JSON
class ExamenIncorporationModel extends ExamenIncorporation {
  const ExamenIncorporationModel({
    required super.id,
    required super.sapeurPompierId,
    super.antecedentsHereditaires,
    super.antecedentsPersonnels,
    super.antecedentsCollateraux,
    super.appareilRespiratoire,
    super.radiographie,
    super.appareilGenitoUrinaire,
    super.appareilDigestif,
    super.appareilCirculatoire,
    super.systemeNerveux,
    super.dentureEtat,
    super.coefficientMastication,
    super.peauAnnexes,
    super.fc,
    super.ta,
    super.sucre,
    super.albumine,
    super.avOdSans,
    super.avOdAvec,
    super.avOgSans,
    super.avOgAvec,
    super.sensChromatique,
    super.aaOdHaute,
    super.aaOdChuchotee,
    super.aaOgHaute,
    super.aaOgChuchotee,
    super.profilSigycop,
    super.notesAdditionnelles,
    super.dateCloture,
    super.decision,
    super.aSurveiller,
    super.mentionsSpeciales,
    super.entrainementSpecial,
    super.entrainementSpecialDetails,
    super.utilisationPreferentielle,
    super.nomMedecin,
    super.signatureMedecinPath,
  });

  /// Crée un ExamenIncorporationModel depuis JSON
  factory ExamenIncorporationModel.fromJson(Map<String, dynamic> json) {
    return ExamenIncorporationModel(
      id: json['id'] as String,
      sapeurPompierId: json['sapeurPompierId'] as String,
      antecedentsHereditaires: json['antecedentsHereditaires'] as String?,
      antecedentsPersonnels: json['antecedentsPersonnels'] as String?,
      antecedentsCollateraux: json['antecedentsCollateraux'] as String?,
      appareilRespiratoire: json['appareilRespiratoire'] as String?,
      radiographie: json['radiographie'] as String?,
      appareilGenitoUrinaire: json['appareilGenitoUrinaire'] as String?,
      appareilDigestif: json['appareilDigestif'] as String?,
      appareilCirculatoire: json['appareilCirculatoire'] as String?,
      systemeNerveux: json['systemeNerveux'] as String?,
      dentureEtat: json['dentureEtat'] as String?,
      coefficientMastication: json['coefficientMastication'] as String?,
      peauAnnexes: json['peauAnnexes'] as String?,
      fc: json['fc'] as int?,
      ta: json['ta'] as String?,
      sucre: json['sucre'] as String?,
      albumine: json['albumine'] as String?,
      avOdSans: json['avOdSans'] as String?,
      avOdAvec: json['avOdAvec'] as String?,
      avOgSans: json['avOgSans'] as String?,
      avOgAvec: json['avOgAvec'] as String?,
      sensChromatique: json['sensChromatique'] as String?,
      aaOdHaute: json['aaOdHaute'] as String?,
      aaOdChuchotee: json['aaOdChuchotee'] as String?,
      aaOgHaute: json['aaOgHaute'] as String?,
      aaOgChuchotee: json['aaOgChuchotee'] as String?,
      profilSigycop: json['profilSigycop'] != null
          ? ProfilSigycopModel.fromJson(
              json['profilSigycop'] as Map<String, dynamic>)
          : const ProfilSigycopModel(),
      notesAdditionnelles: json['notesAdditionnelles'] != null
          ? NotesAdditionnellesModel.fromJson(
              json['notesAdditionnelles'] as Map<String, dynamic>)
          : const NotesAdditionnellesModel(),
      dateCloture: json['dateCloture'] != null
          ? DateTime.parse(json['dateCloture'] as String)
          : null,
      decision: json['decision'] as String?,
      aSurveiller: json['aSurveiller'] as String?,
      mentionsSpeciales: json['mentionsSpeciales'] as String?,
      entrainementSpecial: json['entrainementSpecial'] as bool? ?? false,
      entrainementSpecialDetails: json['entrainementSpecialDetails'] as String?,
      utilisationPreferentielle: json['utilisationPreferentielle'] as String?,
      nomMedecin: json['nomMedecin'] as String?,
      signatureMedecinPath: json['signatureMedecinPath'] as String?,
    );
  }

  /// Convertit ExamenIncorporationModel vers JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'sapeurPompierId': sapeurPompierId,
      'antecedentsHereditaires': antecedentsHereditaires,
      'antecedentsPersonnels': antecedentsPersonnels,
      'antecedentsCollateraux': antecedentsCollateraux,
      'appareilRespiratoire': appareilRespiratoire,
      'radiographie': radiographie,
      'appareilGenitoUrinaire': appareilGenitoUrinaire,
      'appareilDigestif': appareilDigestif,
      'appareilCirculatoire': appareilCirculatoire,
      'systemeNerveux': systemeNerveux,
      'dentureEtat': dentureEtat,
      'coefficientMastication': coefficientMastication,
      'peauAnnexes': peauAnnexes,
      'fc': fc,
      'ta': ta,
      'sucre': sucre,
      'albumine': albumine,
      'avOdSans': avOdSans,
      'avOdAvec': avOdAvec,
      'avOgSans': avOgSans,
      'avOgAvec': avOgAvec,
      'sensChromatique': sensChromatique,
      'aaOdHaute': aaOdHaute,
      'aaOdChuchotee': aaOdChuchotee,
      'aaOgHaute': aaOgHaute,
      'aaOgChuchotee': aaOgChuchotee,
      'profilSigycop':
          ProfilSigycopModel.fromEntity(profilSigycop).toJson(),
      'notesAdditionnelles':
          NotesAdditionnellesModel.fromEntity(notesAdditionnelles).toJson(),
      'dateCloture': dateCloture?.toIso8601String(),
      'decision': decision,
      'aSurveiller': aSurveiller,
      'mentionsSpeciales': mentionsSpeciales,
      'entrainementSpecial': entrainementSpecial,
      'entrainementSpecialDetails': entrainementSpecialDetails,
      'utilisationPreferentielle': utilisationPreferentielle,
      'nomMedecin': nomMedecin,
      'signatureMedecinPath': signatureMedecinPath,
    };
  }

  /// Crée un ExamenIncorporationModel depuis une ligne de base de données SQLite
  factory ExamenIncorporationModel.fromDatabase(Map<String, dynamic> map) {
    return ExamenIncorporationModel(
      id: map['id'] as String,
      sapeurPompierId: map['sapeur_pompier_id'] as String,
      antecedentsHereditaires: map['antecedents_hereditaires'] as String?,
      antecedentsPersonnels: map['antecedents_personnels'] as String?,
      antecedentsCollateraux: map['antecedents_collateraux'] as String?,
      appareilRespiratoire: map['appareil_respiratoire'] as String?,
      radiographie: map['radiographie'] as String?,
      appareilGenitoUrinaire: map['appareil_genito_urinaire'] as String?,
      appareilDigestif: map['appareil_digestif'] as String?,
      appareilCirculatoire: map['appareil_circulatoire'] as String?,
      systemeNerveux: map['systeme_nerveux'] as String?,
      dentureEtat: map['denture_etat'] as String?,
      coefficientMastication: map['coefficient_mastication'] as String?,
      peauAnnexes: map['peau_annexes'] as String?,
      fc: map['fc'] as int?,
      ta: map['ta'] as String?,
      sucre: map['sucre'] as String?,
      albumine: map['albumine'] as String?,
      avOdSans: map['av_od_sans'] as String?,
      avOdAvec: map['av_od_avec'] as String?,
      avOgSans: map['av_og_sans'] as String?,
      avOgAvec: map['av_og_avec'] as String?,
      sensChromatique: map['sens_chromatique'] as String?,
      aaOdHaute: map['aa_od_haute'] as String?,
      aaOdChuchotee: map['aa_od_chuchotee'] as String?,
      aaOgHaute: map['aa_og_haute'] as String?,
      aaOgChuchotee: map['aa_og_chuchotee'] as String?,
      profilSigycop: ProfilSigycopModel(
        s: map['sigycop_s'] as int? ?? 0,
        i: map['sigycop_i'] as int? ?? 0,
        g: map['sigycop_g'] as int? ?? 0,
        y: map['sigycop_y'] as int? ?? 0,
        c: map['sigycop_c'] as int? ?? 0,
        o: map['sigycop_o'] as int? ?? 0,
        p: map['sigycop_p'] as int? ?? 0,
      ),
      notesAdditionnelles: NotesAdditionnellesModel(
        v: map['note_v'] as String?,
        a: map['note_a'] as String?,
        e: map['note_e'] as String?,
        s: map['note_s'] as String?,
        i: map['note_i'] as String?,
        f: map['note_f'] as String?,
        x: map['note_x'] as String?,
      ),
      dateCloture: map['date_cloture'] != null
          ? DateTime.parse(map['date_cloture'] as String)
          : null,
      decision: map['decision'] as String?,
      aSurveiller: map['a_surveiller'] as String?,
      mentionsSpeciales: map['mentions_speciales'] as String?,
      entrainementSpecial: (map['entrainement_special'] as int?) == 1,
      entrainementSpecialDetails:
          map['entrainement_special_details'] as String?,
      utilisationPreferentielle: map['utilisation_preferentielle'] as String?,
      nomMedecin: map['nom_medecin'] as String?,
      signatureMedecinPath: map['signature_medecin_path'] as String?,
    );
  }

  /// Convertit ExamenIncorporationModel vers format base de données SQLite
  Map<String, dynamic> toDatabase() {
    return {
      'id': id,
      'sapeur_pompier_id': sapeurPompierId,
      'antecedents_hereditaires': antecedentsHereditaires,
      'antecedents_personnels': antecedentsPersonnels,
      'antecedents_collateraux': antecedentsCollateraux,
      'appareil_respiratoire': appareilRespiratoire,
      'radiographie': radiographie,
      'appareil_genito_urinaire': appareilGenitoUrinaire,
      'appareil_digestif': appareilDigestif,
      'appareil_circulatoire': appareilCirculatoire,
      'systeme_nerveux': systemeNerveux,
      'denture_etat': dentureEtat,
      'coefficient_mastication': coefficientMastication,
      'peau_annexes': peauAnnexes,
      'fc': fc,
      'ta': ta,
      'sucre': sucre,
      'albumine': albumine,
      'av_od_sans': avOdSans,
      'av_od_avec': avOdAvec,
      'av_og_sans': avOgSans,
      'av_og_avec': avOgAvec,
      'sens_chromatique': sensChromatique,
      'aa_od_haute': aaOdHaute,
      'aa_od_chuchotee': aaOdChuchotee,
      'aa_og_haute': aaOgHaute,
      'aa_og_chuchotee': aaOgChuchotee,
      'sigycop_s': profilSigycop.s,
      'sigycop_i': profilSigycop.i,
      'sigycop_g': profilSigycop.g,
      'sigycop_y': profilSigycop.y,
      'sigycop_c': profilSigycop.c,
      'sigycop_o': profilSigycop.o,
      'sigycop_p': profilSigycop.p,
      'note_v': notesAdditionnelles.v,
      'note_a': notesAdditionnelles.a,
      'note_e': notesAdditionnelles.e,
      'note_s': notesAdditionnelles.s,
      'note_i': notesAdditionnelles.i,
      'note_f': notesAdditionnelles.f,
      'note_x': notesAdditionnelles.x,
      'date_cloture': dateCloture?.toIso8601String(),
      'decision': decision,
      'a_surveiller': aSurveiller,
      'mentions_speciales': mentionsSpeciales,
      'entrainement_special': entrainementSpecial ? 1 : 0,
      'entrainement_special_details': entrainementSpecialDetails,
      'utilisation_preferentielle': utilisationPreferentielle,
      'nom_medecin': nomMedecin,
      'signature_medecin_path': signatureMedecinPath,
    };
  }

  /// Crée un ExamenIncorporationModel depuis une entité ExamenIncorporation
  factory ExamenIncorporationModel.fromEntity(ExamenIncorporation examen) {
    return ExamenIncorporationModel(
      id: examen.id,
      sapeurPompierId: examen.sapeurPompierId,
      antecedentsHereditaires: examen.antecedentsHereditaires,
      antecedentsPersonnels: examen.antecedentsPersonnels,
      antecedentsCollateraux: examen.antecedentsCollateraux,
      appareilRespiratoire: examen.appareilRespiratoire,
      radiographie: examen.radiographie,
      appareilGenitoUrinaire: examen.appareilGenitoUrinaire,
      appareilDigestif: examen.appareilDigestif,
      appareilCirculatoire: examen.appareilCirculatoire,
      systemeNerveux: examen.systemeNerveux,
      dentureEtat: examen.dentureEtat,
      coefficientMastication: examen.coefficientMastication,
      peauAnnexes: examen.peauAnnexes,
      fc: examen.fc,
      ta: examen.ta,
      sucre: examen.sucre,
      albumine: examen.albumine,
      avOdSans: examen.avOdSans,
      avOdAvec: examen.avOdAvec,
      avOgSans: examen.avOgSans,
      avOgAvec: examen.avOgAvec,
      sensChromatique: examen.sensChromatique,
      aaOdHaute: examen.aaOdHaute,
      aaOdChuchotee: examen.aaOdChuchotee,
      aaOgHaute: examen.aaOgHaute,
      aaOgChuchotee: examen.aaOgChuchotee,
      profilSigycop: examen.profilSigycop,
      notesAdditionnelles: examen.notesAdditionnelles,
      dateCloture: examen.dateCloture,
      decision: examen.decision,
      aSurveiller: examen.aSurveiller,
      mentionsSpeciales: examen.mentionsSpeciales,
      entrainementSpecial: examen.entrainementSpecial,
      entrainementSpecialDetails: examen.entrainementSpecialDetails,
      utilisationPreferentielle: examen.utilisationPreferentielle,
      nomMedecin: examen.nomMedecin,
      signatureMedecinPath: examen.signatureMedecinPath,
    );
  }
}
