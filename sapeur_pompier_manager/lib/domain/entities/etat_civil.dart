import 'package:equatable/equatable.dart';

/// Contact d'urgence
class ContactUrgence extends Equatable {
  final String nom;
  final String telephone;
  final String lien;

  const ContactUrgence({
    required this.nom,
    required this.telephone,
    required this.lien,
  });

  @override
  List<Object?> get props => [nom, telephone, lien];

  ContactUrgence copyWith({
    String? nom,
    String? telephone,
    String? lien,
  }) {
    return ContactUrgence(
      nom: nom ?? this.nom,
      telephone: telephone ?? this.telephone,
      lien: lien ?? this.lien,
    );
  }
}

/// Entité représentant l'état civil d'un sapeur-pompier
class EtatCivil extends Equatable {
  final String id;
  final String sapeurPompierId;
  final String nom;
  final String prenoms;
  final DateTime dateNaissance;
  final String lieuNaissance;
  final String? nomPere;
  final String? nomMere;
  final String? photoPath;
  final ContactUrgence? contactUrgence1;
  final ContactUrgence? contactUrgence2;
  final ContactUrgence? contactUrgence3;

  const EtatCivil({
    required this.id,
    required this.sapeurPompierId,
    required this.nom,
    required this.prenoms,
    required this.dateNaissance,
    required this.lieuNaissance,
    this.nomPere,
    this.nomMere,
    this.photoPath,
    this.contactUrgence1,
    this.contactUrgence2,
    this.contactUrgence3,
  });

  /// Calcule l'âge à partir de la date de naissance
  int get age {
    final today = DateTime.now();
    int age = today.year - dateNaissance.year;

    if (today.month < dateNaissance.month ||
        (today.month == dateNaissance.month && today.day < dateNaissance.day)) {
      age--;
    }

    return age;
  }

  /// Obtient le nom complet
  String get nomComplet => '$prenoms $nom';

  /// Vérifie si la photo est disponible
  bool get hasPhoto => photoPath != null && photoPath!.isNotEmpty;

  /// Vérifie si tous les contacts d'urgence sont remplis
  bool get hasAllContactsUrgence =>
      contactUrgence1 != null &&
      contactUrgence2 != null &&
      contactUrgence3 != null;

  @override
  List<Object?> get props => [
        id,
        sapeurPompierId,
        nom,
        prenoms,
        dateNaissance,
        lieuNaissance,
        nomPere,
        nomMere,
        photoPath,
        contactUrgence1,
        contactUrgence2,
        contactUrgence3,
      ];

  EtatCivil copyWith({
    String? id,
    String? sapeurPompierId,
    String? nom,
    String? prenoms,
    DateTime? dateNaissance,
    String? lieuNaissance,
    String? nomPere,
    String? nomMere,
    String? photoPath,
    ContactUrgence? contactUrgence1,
    ContactUrgence? contactUrgence2,
    ContactUrgence? contactUrgence3,
  }) {
    return EtatCivil(
      id: id ?? this.id,
      sapeurPompierId: sapeurPompierId ?? this.sapeurPompierId,
      nom: nom ?? this.nom,
      prenoms: prenoms ?? this.prenoms,
      dateNaissance: dateNaissance ?? this.dateNaissance,
      lieuNaissance: lieuNaissance ?? this.lieuNaissance,
      nomPere: nomPere ?? this.nomPere,
      nomMere: nomMere ?? this.nomMere,
      photoPath: photoPath ?? this.photoPath,
      contactUrgence1: contactUrgence1 ?? this.contactUrgence1,
      contactUrgence2: contactUrgence2 ?? this.contactUrgence2,
      contactUrgence3: contactUrgence3 ?? this.contactUrgence3,
    );
  }
}
