// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { EitherT, Monad } from '@fp4ts/cats';
import { MessageFailure, ParsingFailure } from '@fp4ts/http';
import { match } from '@fp4ts/optics';
import {
  InvalidUsernameError,
  Password,
  RegistrationError,
  ShortPasswordError,
  Username,
} from '../../domain/auth';

export abstract class AuthApiServiceOps<F> {
  protected abstract readonly F: Monad<F>;

  protected usernameFromPlain(
    plain: string,
  ): EitherT<F, InvalidUsernameError, Username> {
    return EitherT(
      this.F.pure(Username(plain).toRight(() => InvalidUsernameError())),
    );
  }

  protected passwordFromPlain(
    plain: string,
  ): EitherT<F, ShortPasswordError, Password> {
    return EitherT(
      this.F.pure(Password(plain).toRight(() => ShortPasswordError())),
    );
  }

  protected registrationErrorToMessageFailure = (
    e: RegistrationError,
  ): MessageFailure =>
    match(e)
      .case(
        RegistrationError._InvalidUsernameError,
        ({ message }) => new ParsingFailure(message),
      )
      .case(
        RegistrationError._ShortPasswordError,
        ({ message }) => new ParsingFailure(message),
      )
      .case(
        RegistrationError._UsernameExistsError,
        ({ message }) => new ParsingFailure(message),
      )
      .get();
}
