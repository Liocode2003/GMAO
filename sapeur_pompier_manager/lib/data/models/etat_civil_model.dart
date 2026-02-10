import '../../domain/entities/etat_civil.dart';

/// Model de données pour ContactUrgence avec sérialisation JSON
class ContactUrgenceModel extends ContactUrgence {
  const ContactUrgenceModel({
    required super.nom,
    required super.telephone,
    required super.lien,
  });

  /// Crée un ContactUrgenceModel depuis JSON
  factory ContactUrgenceModel.fromJson(Map<String, dynamic> json) {
    return ContactUrgenceModel(
      nom: json['nom'] as String,
      telephone: json['telephone'] as String,
      lien: json['lien'] as String,
    );
  }

  /// Convertit ContactUrgenceModel vers JSON
  Map<String, dynamic> toJson() {
    return {
      'nom': nom,
      'telephone': telephone,
      'lien': lien,
    };
  }

  /// Crée un ContactUrgenceModel depuis une entité ContactUrgence
  factory ContactUrgenceModel.fromEntity(ContactUrgence contact) {
    return ContactUrgenceModel(
      nom: contact.nom,
      telephone: contact.telephone,
      lien: contact.lien,
    );
  }
}

/// Model de données pour EtatCivil avec sérialisation JSON
class EtatCivilModel extends EtatCivil {
  const EtatCivilModel({
    required super.id,
    required super.sapeurPompierId,
    required super.nom,
    required super.prenoms,
    required super.dateNaissance,
    required super.lieuNaissance,
    super.nomPere,
    super.nomMere,
    super.photoPath,
    super.contactUrgence1,
    super.contactUrgence2,
    super.contactUrgence3,
  });

  /// Crée un EtatCivilModel depuis JSON
  factory EtatCivilModel.fromJson(Map<String, dynamic> json) {
    return EtatCivilModel(
      id: json['id'] as String,
      sapeurPompierId: json['sapeurPompierId'] as String,
      nom: json['nom'] as String,
      prenoms: json['prenoms'] as String,
      dateNaissance: DateTime.parse(json['dateNaissance'] as String),
      lieuNaissance: json['lieuNaissance'] as String,
      nomPere: json['nomPere'] as String?,
      nomMere: json['nomMere'] as String?,
      photoPath: json['photoPath'] as String?,
      contactUrgence1: json['contactUrgence1'] != null
          ? ContactUrgenceModel.fromJson(
              json['contactUrgence1'] as Map<String, dynamic>)
          : null,
      contactUrgence2: json['contactUrgence2'] != null
          ? ContactUrgenceModel.fromJson(
              json['contactUrgence2'] as Map<String, dynamic>)
          : null,
      contactUrgence3: json['contactUrgence3'] != null
          ? ContactUrgenceModel.fromJson(
              json['contactUrgence3'] as Map<String, dynamic>)
          : null,
    );
  }

  /// Convertit EtatCivilModel vers JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'sapeurPompierId': sapeurPompierId,
      'nom': nom,
      'prenoms': prenoms,
      'dateNaissance': dateNaissance.toIso8601String(),
      'lieuNaissance': lieuNaissance,
      'nomPere': nomPere,
      'nomMere': nomMere,
      'photoPath': photoPath,
      'contactUrgence1': contactUrgence1 != null
          ? ContactUrgenceModel.fromEntity(contactUrgence1!).toJson()
          : null,
      'contactUrgence2': contactUrgence2 != null
          ? ContactUrgenceModel.fromEntity(contactUrgence2!).toJson()
          : null,
      'contactUrgence3': contactUrgence3 != null
          ? ContactUrgenceModel.fromEntity(contactUrgence3!).toJson()
          : null,
    };
  }

  /// Crée un EtatCivilModel depuis une ligne de base de données SQLite
  factory EtatCivilModel.fromDatabase(Map<String, dynamic> map) {
    return EtatCivilModel(
      id: map['id'] as String,
      sapeurPompierId: map['sapeur_pompier_id'] as String,
      nom: map['nom'] as String,
      prenoms: map['prenoms'] as String,
      dateNaissance: DateTime.parse(map['date_naissance'] as String),
      lieuNaissance: map['lieu_naissance'] as String,
      nomPere: map['nom_pere'] as String?,
      nomMere: map['nom_mere'] as String?,
      photoPath: map['photo_path'] as String?,
      contactUrgence1: map['contact_urgence_1_nom'] != null
          ? ContactUrgenceModel(
              nom: map['contact_urgence_1_nom'] as String,
              telephone: map['contact_urgence_1_tel'] as String,
              lien: map['contact_urgence_1_lien'] as String,
            )
          : null,
      contactUrgence2: map['contact_urgence_2_nom'] != null
          ? ContactUrgenceModel(
              nom: map['contact_urgence_2_nom'] as String,
              telephone: map['contact_urgence_2_tel'] as String,
              lien: map['contact_urgence_2_lien'] as String,
            )
          : null,
      contactUrgence3: map['contact_urgence_3_nom'] != null
          ? ContactUrgenceModel(
              nom: map['contact_urgence_3_nom'] as String,
              telephone: map['contact_urgence_3_tel'] as String,
              lien: map['contact_urgence_3_lien'] as String,
            )
          : null,
    );
  }

  /// Convertit EtatCivilModel vers format base de données SQLite
  Map<String, dynamic> toDatabase() {
    return {
      'id': id,
      'sapeur_pompier_id': sapeurPompierId,
      'nom': nom,
      'prenoms': prenoms,
      'date_naissance': dateNaissance.toIso8601String(),
      'lieu_naissance': lieuNaissance,
      'nom_pere': nomPere,
      'nom_mere': nomMere,
      'photo_path': photoPath,
      'contact_urgence_1_nom': contactUrgence1?.nom,
      'contact_urgence_1_tel': contactUrgence1?.telephone,
      'contact_urgence_1_lien': contactUrgence1?.lien,
      'contact_urgence_2_nom': contactUrgence2?.nom,
      'contact_urgence_2_tel': contactUrgence2?.telephone,
      'contact_urgence_2_lien': contactUrgence2?.lien,
      'contact_urgence_3_nom': contactUrgence3?.nom,
      'contact_urgence_3_tel': contactUrgence3?.telephone,
      'contact_urgence_3_lien': contactUrgence3?.lien,
    };
  }

  /// Crée un EtatCivilModel depuis une entité EtatCivil
  factory EtatCivilModel.fromEntity(EtatCivil etatCivil) {
    return EtatCivilModel(
      id: etatCivil.id,
      sapeurPompierId: etatCivil.sapeurPompierId,
      nom: etatCivil.nom,
      prenoms: etatCivil.prenoms,
      dateNaissance: etatCivil.dateNaissance,
      lieuNaissance: etatCivil.lieuNaissance,
      nomPere: etatCivil.nomPere,
      nomMere: etatCivil.nomMere,
      photoPath: etatCivil.photoPath,
      contactUrgence1: etatCivil.contactUrgence1,
      contactUrgence2: etatCivil.contactUrgence2,
      contactUrgence3: etatCivil.contactUrgence3,
    );
  }
}
