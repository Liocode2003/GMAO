import 'package:dartz/dartz.dart';
import 'package:sapeur_pompier_manager/core/errors/failures.dart';
import 'package:sapeur_pompier_manager/domain/entities/sapeur_pompier.dart';
import 'package:sapeur_pompier_manager/domain/repositories/sapeur_pompier_repository.dart';

/// UseCase pour créer un nouveau sapeur-pompier
class CreateSapeurPompier {
  final SapeurPompierRepository repository;

  CreateSapeurPompier(this.repository);

  Future<Either<Failure, SapeurPompier>> call(SapeurPompier sapeurPompier) async {
    return await repository.createSapeurPompier(sapeurPompier);
  }
}
