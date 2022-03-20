// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/no-this-alias */
import { EitherT, Monad } from '@fp4ts/cats';
import { MessageFailure } from '@fp4ts/http';

import {
  AuthenticationService,
  InvalidUsernameError,
  ShortPasswordError,
  User,
  UsernameExistsError,
} from '../../domain/auth';
import { AuthApiServiceOps } from './auth-api-service-ops';

import { ChangePasswordDto, ChangeUsernameDto, UserDto } from './dto';

type ChangeUsernameError = UsernameExistsError | InvalidUsernameError;
export class ChangeCredentialsApiService<F> extends AuthApiServiceOps<F> {
  public constructor(
    protected readonly F: Monad<F>,
    private readonly service: AuthenticationService<F>,
  ) {
    super();
  }

  public changeUsername(
    user: User,
    { username }: ChangeUsernameDto,
  ): EitherT<F, MessageFailure, UserDto> {
    const { service } = this;
    const self = this;
    const ETM = EitherT.Monad<F, ChangeUsernameError>(this.F);

    return ETM.do(function* (_) {
      const usn = yield* _(self.usernameFromPlain(username));
      const user_ = yield* _(EitherT(service.changeUsername(user, usn)));
      return UserDto.fromUser(user_);
    }).leftMap(this.F)(this.registrationErrorToMessageFailure);
  }

  public changePassword(
    user: User,
    { password }: ChangePasswordDto,
  ): EitherT<F, MessageFailure, UserDto> {
    const { service, F } = this;
    const self = this;
    const ETM = EitherT.Monad<F, ShortPasswordError>(this.F);

    return ETM.do(function* (_) {
      const pwd = yield* _(self.passwordFromPlain(password));
      const user_ = yield* _(
        EitherT.liftF(F)(service.changePassword(user, pwd)),
      );

      return UserDto.fromUser(user_);
    }).leftMap(this.F)(this.registrationErrorToMessageFailure);
  }
}
