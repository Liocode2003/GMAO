import 'package:dartz/dartz.dart';
import 'package:sapeur_pompier_manager/core/errors/failures.dart';
import 'package:sapeur_pompier_manager/domain/entities/sapeur_pompier.dart';
import 'package:sapeur_pompier_manager/domain/entities/etat_civil.dart';
import 'package:sapeur_pompier_manager/domain/entities/constantes.dart';
import 'package:sapeur_pompier_manager/domain/entities/examen_incorporation.dart';
import 'package:sapeur_pompier_manager/domain/entities/operation.dart';
import 'package:sapeur_pompier_manager/domain/entities/vaccination.dart';
import 'package:sapeur_pompier_manager/domain/entities/visite_sanitaire.dart';
import 'package:sapeur_pompier_manager/domain/entities/indisponibilite.dart';
import 'package:sapeur_pompier_manager/domain/entities/certificat.dart';
import 'package:sapeur_pompier_manager/domain/entities/decision_reforme.dart';
import 'package:sapeur_pompier_manager/domain/entities/controle_fin_service.dart';

/// Interface du repository pour les opérations sur les sapeurs-pompiers
abstract class SapeurPompierRepository {
  // Sapeur-Pompier
  Future<Either<Failure, List<SapeurPompier>>> getAllSapeursPompiers();
  Future<Either<Failure, SapeurPompier>> getSapeurPompierById(String id);
  Future<Either<Failure, SapeurPompier>> getSapeurPompierByMatricule(
      String matricule);
  Future<Either<Failure, SapeurPompier>> createSapeurPompier(
      SapeurPompier sapeurPompier);
  Future<Either<Failure, SapeurPompier>> updateSapeurPompier(
      SapeurPompier sapeurPompier);
  Future<Either<Failure, void>> deleteSapeurPompier(String id);
  Future<Either<Failure, List<SapeurPompier>>> searchSapeursPompiers(
      String query);

  // État Civil
  Future<Either<Failure, EtatCivil>> saveEtatCivil(EtatCivil etatCivil);
  Future<Either<Failure, EtatCivil?>> getEtatCivil(String sapeurPompierId);

  // Constantes
  Future<Either<Failure, Constantes>> saveConstantes(Constantes constantes);
  Future<Either<Failure, Constantes?>> getConstantes(String sapeurPompierId);
  Future<Either<Failure, List<HistoriquePoids>>> getHistoriquePoids(
      String sapeurPompierId);
  Future<Either<Failure, HistoriquePoids>> saveHistoriquePoids(
      HistoriquePoids historique);

  // Examen Incorporation
  Future<Either<Failure, ExamenIncorporation>> saveExamenIncorporation(
      ExamenIncorporation examen);
  Future<Either<Failure, ExamenIncorporation?>> getExamenIncorporation(
      String sapeurPompierId);

  // Opérations
  Future<Either<Failure, Operation>> saveOperation(Operation operation);
  Future<Either<Failure, List<Operation>>> getOperations(
      String sapeurPompierId);
  Future<Either<Failure, void>> deleteOperation(String id);

  // Vaccinations
  Future<Either<Failure, Vaccination>> saveVaccination(Vaccination vaccination);
  Future<Either<Failure, List<Vaccination>>> getVaccinations(
      String sapeurPompierId);
  Future<Either<Failure, void>> deleteVaccination(String id);
  Future<Either<Failure, List<Vaccination>>> getVaccinationsExpirees();
  Future<Either<Failure, List<Vaccination>>> getVaccinationsProchesExpiration();

  // Visites Sanitaires
  Future<Either<Failure, VisiteSanitaire>> saveVisiteSanitaire(
      VisiteSanitaire visite);
  Future<Either<Failure, List<VisiteSanitaire>>> getVisitesSanitaires(
      String sapeurPompierId);
  Future<Either<Failure, void>> deleteVisiteSanitaire(String id);

  // Indisponibilités
  Future<Either<Failure, Indisponibilite>> saveIndisponibilite(
      Indisponibilite indisponibilite);
  Future<Either<Failure, List<Indisponibilite>>> getIndisponibilites(
      String sapeurPompierId);
  Future<Either<Failure, void>> deleteIndisponibilite(String id);
  Future<Either<Failure, List<Indisponibilite>>> getIndisponibilitesEnCours();

  // Certificats
  Future<Either<Failure, Certificat>> saveCertificat(Certificat certificat);
  Future<Either<Failure, List<Certificat>>> getCertificats(
      String sapeurPompierId);
  Future<Either<Failure, void>> deleteCertificat(String id);

  // Décisions de Réforme
  Future<Either<Failure, DecisionReforme>> saveDecisionReforme(
      DecisionReforme decision);
  Future<Either<Failure, List<DecisionReforme>>> getDecisionsReforme(
      String sapeurPompierId);
  Future<Either<Failure, void>> deleteDecisionReforme(String id);

  // Contrôle Fin de Service
  Future<Either<Failure, ControleFinService>> saveControleFinService(
      ControleFinService controle);
  Future<Either<Failure, ControleFinService?>> getControleFinService(
      String sapeurPompierId);

  // Statistiques
  Future<Either<Failure, Map<String, dynamic>>> getStatistiques();
}
