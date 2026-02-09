import 'package:dartz/dartz.dart';
import 'package:sapeur_pompier_manager/core/errors/failures.dart';
import 'package:sapeur_pompier_manager/domain/repositories/sapeur_pompier_repository.dart';

/// UseCase pour supprimer un sapeur-pompier
class DeleteSapeurPompier {
  final SapeurPompierRepository repository;

  DeleteSapeurPompier(this.repository);

  Future<Either<Failure, void>> call(String id) async {
    return await repository.deleteSapeurPompier(id);
  }
}
