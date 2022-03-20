// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/no-this-alias */
import { Kind, pipe } from '@fp4ts/core';
import { Either, Left, Monad, OptionT, Right } from '@fp4ts/cats';

import { BcryptHash, GenUUID } from '../../../../common';

import {
  InvalidUsernameOrPassword,
  LoginError,
  RegistrationError,
  UsernameExistsError,
} from '../errors';
import { RegisterUser } from '../register-user';
import { LoginUser } from '../login-user';
import { UserRepository } from '../repositories';
import { User } from '../user';
import { HashedPassword, Password, UserId, Username } from '../values';

export class AuthenticationService<F> {
  public constructor(
    private readonly F: Monad<F> & BcryptHash<F> & GenUUID<F>,
    private readonly repo: UserRepository<F>,
  ) {}

  public registerUser(
    user: RegisterUser,
  ): Kind<F, [Either<RegistrationError, User>]> {
    const { F, repo } = this;

    return this.ensuringUsernameAvailable(user.username)(
      F.do(function* (_) {
        const id = yield* _(F.map_(F.genUUID, UserId));
        const password = yield* _(
          HashedPassword.fromPassword(F)(user.password),
        );
        const newUser: User = { id, username: user.username, password };

        return yield* _(repo.save(newUser));
      }),
    );
  }

  public loginUser({
    username,
    password,
  }: LoginUser): Kind<F, [Either<LoginError, User>]> {
    const { F, repo } = this;

    return pipe(
      repo.findByUsername(username),
      F.flatMap(opt =>
        opt.fold(
          () => F.pure(Left(InvalidUsernameOrPassword())),
          user =>
            F.ifM_(
              F.compare(
                HashedPassword.toPlainText(user.password),
                Password.toPlainText(password),
              ),
              F.pure(Right(user)),
              F.pure(Left(InvalidUsernameOrPassword())),
            ),
        ),
      ),
    );
  }

  private ensuringUsernameAvailable(
    username: Username,
  ): <A>(register: Kind<F, [A]>) => Kind<F, [Either<RegistrationError, A>]> {
    const { F } = this;

    return register =>
      F.ifM_(
        this.isTaken(username),
        F.pure(Left(UsernameExistsError(username))),
        F.map_(register, Right),
      );
  }

  private isTaken(username: Username): Kind<F, [boolean]> {
    return OptionT(this.repo.findByUsername(username)).nonEmpty(this.F);
  }
}
