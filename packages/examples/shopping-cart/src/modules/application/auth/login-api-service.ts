// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/no-this-alias */
import { Kind } from '@fp4ts/core';
import { EitherT, Monad, Option, OptionT } from '@fp4ts/cats';
import { BasicAuthenticator } from '@fp4ts/http-server';

import { AuthenticationService, User } from '../../domain/auth';
import { AuthApiServiceOps } from './auth-api-service-ops';

export class LoginApiService<F> extends AuthApiServiceOps<F> {
  public constructor(
    protected readonly F: Monad<F>,
    private readonly service: AuthenticationService<F>,
  ) {
    super();
  }

  public readonly basicAuthenticator: BasicAuthenticator<F, User> = ({
    username,
    password,
  }): Kind<F, [Option<User>]> => {
    const { service, F } = this;
    const self = this;

    return OptionT.Monad(this.F).do(function* (_) {
      const usr = yield* _(self.usernameFromPlain(username).toOptionT(F));
      const pwd = yield* _(self.passwordFromPlain(password).toOptionT(F));

      return yield* _(
        EitherT(service.loginUser({ username: usr, password: pwd })).toOptionT(
          F,
        ),
      );
    }).value;
  };
}
