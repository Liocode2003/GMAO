/// Constantes de texte de l'application (toutes en français)
class AppStrings {
  AppStrings._();

  // Application
  static const String appName = 'Gestion Livrets Sanitaires SPR';
  static const String appVersion = '1.0.0';
  static const String copyright = '© 2024 Service des Sapeurs-Pompiers - Burkina Faso';

  // Authentification
  static const String login = 'Connexion';
  static const String logout = 'Déconnexion';
  static const String username = 'Nom d\'utilisateur';
  static const String email = 'Email';
  static const String password = 'Mot de passe';
  static const String rememberMe = 'Rester connecté';
  static const String forgotPassword = 'Mot de passe oublié ?';
  static const String loginButton = 'Se connecter';
  static const String loginSuccess = 'Connexion réussie';
  static const String loginError = 'Identifiants incorrects';

  // Navigation
  static const String dashboard = 'Tableau de bord';
  static const String listeSapeursPompiers = 'Liste des sapeurs-pompiers';
  static const String createNewFile = 'Nouveau dossier';
  static const String settings = 'Paramètres';
  static const String userManagement = 'Gestion des utilisateurs';
  static const String backup = 'Sauvegardes';

  // Dashboard
  static const String totalSapeursPompiers = 'Total sapeurs-pompiers';
  static const String dossiersComplets = 'Dossiers complets';
  static const String dossiersIncomplets = 'Dossiers incomplets';
  static const String vaccinationsExpirees = 'Vaccinations expirées';
  static const String visitesEnRetard = 'Visites en retard';
  static const String statistics = 'Statistiques';

  // Sections du livret
  static const String etatCivil = 'État civil';
  static const String constantes = 'Constantes';
  static const String examenIncorporation = 'Examen d\'incorporation';
  static const String operations = 'Opérations (OPEX/OPINT)';
  static const String vaccinations = 'Vaccinations et immunisations';
  static const String visitesSanitaires = 'Visites sanitaires';
  static const String indisponibilites = 'Indisponibilités';
  static const String certificats = 'Copies des certificats';
  static const String decisionsReforme = 'Décisions de réforme';
  static const String controleFinService = 'Contrôle de fin de service';

  // État civil
  static const String nom = 'Nom';
  static const String prenoms = 'Prénoms';
  static const String dateNaissance = 'Date de naissance';
  static const String lieuNaissance = 'Lieu de naissance';
  static const String nomPere = 'Nom du père';
  static const String nomMere = 'Nom de la mère';
  static const String photo = 'Photo d\'identité';
  static const String contactsUrgence = 'Contacts d\'urgence';
  static const String nomContact = 'Nom complet';
  static const String telephoneContact = 'Téléphone';
  static const String lienParente = 'Lien de parenté';

  // Constantes
  static const String taille = 'Taille (cm)';
  static const String poids = 'Poids (kg)';
  static const String imc = 'IMC';
  static const String perimetreThoracique = 'Périmètre thoracique (cm)';
  static const String perimetreAbdominal = 'Périmètre abdominal (cm)';
  static const String empreintesDigitales = 'Empreintes digitales';
  static const String signature = 'Signature';

  // Examen incorporation
  static const String antecedents = 'Antécédents';
  static const String hereditaires = 'Héréditaires';
  static const String personnels = 'Personnels';
  static const String collateraux = 'Collatéraux';
  static const String etatGeneral = 'État général';
  static const String examenscliniques = 'Examens cliniques';
  static const String appareilRespiratoire = 'Appareil respiratoire';
  static const String radiographie = 'Radiographie';
  static const String appareilGenitoUrinaire = 'Appareil génito-urinaire';
  static const String appareilDigestif = 'Appareil digestif';
  static const String appareilCirculatoire = 'Appareil circulatoire';
  static const String systemeNerveux = 'Système nerveux';
  static const String denture = 'Denture - État';
  static const String coefficientMastication = 'Coefficient de mastication';
  static const String peauAnnexes = 'Peau et annexes';
  static const String fc = 'FC - Fréquence cardiaque';
  static const String ta = 'TA - Tension artérielle';
  static const String sucre = 'Sucre';
  static const String albumine = 'Albumine';
  static const String vision = 'Vision';
  static const String audition = 'Audition';
  static const String acuiteVisuelle = 'Acuité visuelle';
  static const String acuiteAuditive = 'Acuité auditive';
  static const String oeilDroit = 'Œil Droit (OD)';
  static const String oeilGauche = 'Œil Gauche (OG)';
  static const String sansCorrection = 'Sans correction';
  static const String avecCorrection = 'Avec correction';
  static const String voixHaute = 'Voix haute';
  static const String voixChuchotee = 'Voix chuchotée';
  static const String sensChromatique = 'Sens chromatique';
  static const String profilSigycop = 'Profil SIGYCOP';
  static const String conclusions = 'Conclusions';
  static const String dateCloture = 'Date de clôture';
  static const String decision = 'Décision';
  static const String apte = 'Apte';
  static const String inapteDefinitif = 'Inapte définitif';
  static const String inapteTemporaire = 'Inapte temporaire';
  static const String aSurveiller = 'À surveiller';
  static const String mentionsSpeciales = 'Mentions spéciales';
  static const String entrainementSpecial = 'Entraînement spécial';
  static const String utilisationPreferentielle = 'Utilisation préférentielle';
  static const String nomMedecin = 'Nom et grade du médecin';

  // Opérations
  static const String sejour = 'Séjour';
  static const String lieuSejour = 'Lieu de séjour';
  static const String dateDepart = 'Date de départ';
  static const String dateRetour = 'Date de retour';
  static const String auDepart = 'Au départ';
  static const String auRetour = 'Au retour';
  static const String etatSante = 'État de santé';
  static const String observations = 'Observations';
  static const String lieuSignature = 'Lieu de signature';
  static const String dateSignature = 'Date de signature';
  static const String glycemie = 'Glycémie';

  // Vaccinations
  static const String typeVaccin = 'Type de vaccin';
  static const String dateVaccination = 'Date de vaccination';
  static const String nombreDoses = 'Nombre de doses';
  static const String referenceLot = 'Référence/Lot';
  static const String dateRappel = 'Date de rappel';
  static const String antiamaril = 'Antiamaril (fièvre jaune)';
  static const String antitetanique = 'Antitétanique';
  static const String antimeningite = 'Antiméningite';
  static const String antiCovid = 'Anti-COVID-19';
  static const String antihepatiteB = 'Antihépatite B';
  static const String autres = 'Autres';

  // Visites sanitaires
  static const String entiteCorps = 'Entité/Corps';
  static const String dateVisite = 'Date de visite';
  static const String resultats = 'Résultats';

  // Indisponibilités
  static const String corpsEntite = 'Corps/Entité';
  static const String dateDebut = 'Date de début';
  static const String dateFin = 'Date de fin';
  static const String diagnostic = 'Diagnostic';
  static const String dureeHopital = 'Durée à l\'hôpital (jours)';
  static const String dureeInfirmerie = 'Durée à l\'infirmerie (jours)';
  static const String dureeChambre = 'Durée à la chambre (jours)';
  static const String visaSignature = 'Visa/Signature';

  // Certificats
  static const String titreCertificat = 'Titre du certificat';
  static const String dateCertificat = 'Date du certificat';
  static const String typeCertificat = 'Type de certificat';
  static const String blessure = 'Blessure';
  static const String maladie = 'Maladie';
  static const String autre = 'Autre';
  static const String notes = 'Notes';
  static const String fichier = 'Fichier';

  // Décisions de réforme
  static const String dateDecision = 'Date de décision';
  static const String typeDecision = 'Type de décision';
  static const String reforme = 'Réforme';
  static const String rengagement = 'Rengagement';
  static const String signatureAutorite = 'Signature de l\'autorité';

  // Contrôle fin de service
  static const String dateRadiation = 'Date de radiation des contrôles';
  static const String lieuExamen = 'Lieu d\'examen';
  static const String bonneante = 'Bonne santé';
  static const String atteintDe = 'Atteint de';
  static const String hospitaliseA = 'Hospitalisé à';
  static const String indicePignet = 'Indice Pignet';
  static const String examenCliniqueFinal = 'Examen clinique final';
  static const String visionFinale = 'Vision finale';
  static const String auditionFinale = 'Audition finale';

  // Actions
  static const String save = 'Enregistrer';
  static const String cancel = 'Annuler';
  static const String delete = 'Supprimer';
  static const String edit = 'Modifier';
  static const String add = 'Ajouter';
  static const String search = 'Rechercher';
  static const String filter = 'Filtrer';
  static const String export = 'Exporter';
  static const String print = 'Imprimer';
  static const String upload = 'Télécharger';
  static const String download = 'Télécharger';
  static const String view = 'Voir';
  static const String back = 'Retour';
  static const String next = 'Suivant';
  static const String previous = 'Précédent';
  static const String finish = 'Terminer';

  // Messages
  static const String confirmDelete = 'Êtes-vous sûr de vouloir supprimer cet élément ?';
  static const String deleteSuccess = 'Élément supprimé avec succès';
  static const String saveSuccess = 'Enregistrement réussi';
  static const String saveError = 'Erreur lors de l\'enregistrement';
  static const String loadError = 'Erreur lors du chargement';
  static const String noData = 'Aucune donnée disponible';
  static const String requiredField = 'Ce champ est obligatoire';
  static const String invalidEmail = 'Email invalide';
  static const String invalidDate = 'Date invalide';
  static const String invalidNumber = 'Nombre invalide';

  // Export PDF
  static const String exportPdf = 'Exporter en PDF';
  static const String exportLivretComplet = 'Exporter le livret complet';
  static const String exportSection = 'Exporter cette section';
  static const String generatingPdf = 'Génération du PDF en cours...';
  static const String pdfGeneratedSuccess = 'PDF généré avec succès';
  static const String pdfGeneratedError = 'Erreur lors de la génération du PDF';

  // Backup
  static const String backupNow = 'Sauvegarder maintenant';
  static const String restoreBackup = 'Restaurer une sauvegarde';
  static const String backupSuccess = 'Sauvegarde réussie';
  static const String backupError = 'Erreur lors de la sauvegarde';
  static const String restoreSuccess = 'Restauration réussie';
  static const String restoreError = 'Erreur lors de la restauration';

  // Rôles
  static const String roleAdmin = 'Administrateur';
  static const String roleMedecin = 'Médecin';
  static const String roleConsultation = 'Consultation';

  // Alertes
  static const String alertVaccinationExpiree = 'Vaccination expirée';
  static const String alertVaccinationProche = 'Vaccination proche de l\'expiration';
  static const String alertVisiteEnRetard = 'Visite médicale en retard';
  static const String alertFinInaptitude = 'Fin de période d\'inaptitude';

  // Statistiques
  static const String repartitionAptitude = 'Répartition aptitude';
  static const String evolutionEffectifs = 'Évolution des effectifs';
  static const String top5Maladies = 'Top 5 maladies/blessures';
  static const String graphiquePoids = 'Graphique d\'évolution du poids';
  static const String annee = 'Année';

  // Settings
  static const String cheminBackups = 'Chemin des sauvegardes';
  static const String frequenceAutoBackup = 'Fréquence auto-backup';
  static const String delaiAutoLogout = 'Délai auto-logout (minutes)';
  static const String langue = 'Langue';
  static const String logoPersonnalise = 'Logo personnalisé';
  static const String nomInstitution = 'Nom de l\'institution';
  static const String adresseComplete = 'Adresse complète';

  // Validation messages
  static const String nomRequired = 'Le nom est obligatoire';
  static const String prenomsRequired = 'Les prénoms sont obligatoires';
  static const String dateNaissanceRequired = 'La date de naissance est obligatoire';
  static const String matriculeRequired = 'Le matricule est obligatoire';
  static const String emailRequired = 'L\'email est obligatoire';
  static const String passwordRequired = 'Le mot de passe est obligatoire';
  static const String passwordTooShort = 'Le mot de passe doit contenir au moins 6 caractères';
  static const String phoneInvalid = 'Numéro de téléphone invalide';
}
