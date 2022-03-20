// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/no-this-alias */
import { EitherT, Monad } from '@fp4ts/cats';
import { MessageFailure } from '@fp4ts/http';

import { AuthenticationService, RegistrationError } from '../../domain/auth';
import { AuthApiServiceOps } from './auth-api-service-ops';

import { RegisterUserDto, UserDto } from './dto';

export class RegistrationApiService<F> extends AuthApiServiceOps<F> {
  public constructor(
    protected readonly F: Monad<F>,
    private readonly service: AuthenticationService<F>,
  ) {
    super();
  }

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
}
