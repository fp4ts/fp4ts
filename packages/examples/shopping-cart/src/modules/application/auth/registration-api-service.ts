// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/no-this-alias */
import { EitherT, Monad } from '@fp4ts/cats';
import { MessageFailure, ParsingFailure } from '@fp4ts/http';
import { match } from '@fp4ts/optics';

import {
  AuthenticationService,
  InvalidUsernameError,
  Password,
  RegistrationError,
  ShortPasswordError,
  Username,
} from '../../domain/auth';

import { RegisterUserDto, UserDto } from './dto';

export class RegistrationApiService<F> {
  public constructor(
    private readonly F: Monad<F>,
    private readonly service: AuthenticationService<F>,
  ) {}

  public registerUser({
    username,
    password,
  }: RegisterUserDto): EitherT<F, MessageFailure, UserDto> {
    const { service } = this;
    const self = this;
    const ETM = EitherT.Monad<F, RegistrationError>(this.F);

    return ETM.do(function* (_) {
      const usn = yield* _(self.usernameFromPlain(username));
      const pwd = yield* _(self.passwordFromPlain(password));

      const credentials = { username: usn, password: pwd };
      const user = yield* _(EitherT(service.registerUser(credentials)));

      return UserDto.fromUser(user);
    }).leftMap(this.F)(this.registrationErrorToMessageFailure);
  }

  private usernameFromPlain(
    plain: string,
  ): EitherT<F, RegistrationError, Username> {
    return EitherT(
      this.F.pure(Username(plain).toRight(() => InvalidUsernameError())),
    );
  }

  private passwordFromPlain(
    plain: string,
  ): EitherT<F, RegistrationError, Password> {
    return EitherT(
      this.F.pure(Password(plain).toRight(() => ShortPasswordError())),
    );
  }

  private registrationErrorToMessageFailure = (
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
