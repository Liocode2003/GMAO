import 'package:dartz/dartz.dart';
import 'package:sapeur_pompier_manager/core/errors/failures.dart';
import 'package:sapeur_pompier_manager/domain/entities/sapeur_pompier.dart';
import 'package:sapeur_pompier_manager/domain/repositories/sapeur_pompier_repository.dart';

/// UseCase pour obtenir tous les sapeurs-pompiers
class GetAllSapeursPompiers {
  final SapeurPompierRepository repository;

  GetAllSapeursPompiers(this.repository);

  Future<Either<Failure, List<SapeurPompier>>> call() async {
    return await repository.getAllSapeursPompiers();
  }
}
