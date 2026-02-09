import 'package:dartz/dartz.dart';
import 'package:sapeur_pompier_manager/core/errors/failures.dart';
import 'package:sapeur_pompier_manager/domain/entities/user.dart';
import 'package:sapeur_pompier_manager/domain/repositories/auth_repository.dart';

/// UseCase pour connecter un utilisateur
class LoginUser {
  final AuthRepository repository;

  LoginUser(this.repository);

  Future<Either<Failure, User>> call({
    required String username,
    required String password,
  }) async {
    if (username.isEmpty || password.isEmpty) {
      return const Left(ValidationFailure('Identifiant et mot de passe requis'));
    }

    return await repository.login(username, password);
  }
}
