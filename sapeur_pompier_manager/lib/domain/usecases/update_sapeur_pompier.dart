import 'package:dartz/dartz.dart';
import 'package:sapeur_pompier_manager/core/errors/failures.dart';
import 'package:sapeur_pompier_manager/domain/entities/sapeur_pompier.dart';
import 'package:sapeur_pompier_manager/domain/repositories/sapeur_pompier_repository.dart';

/// UseCase pour mettre à jour un sapeur-pompier
class UpdateSapeurPompier {
  final SapeurPompierRepository repository;

  UpdateSapeurPompier(this.repository);

  Future<Either<Failure, SapeurPompier>> call(SapeurPompier sapeurPompier) async {
    return await repository.updateSapeurPompier(sapeurPompier);
  }
}
