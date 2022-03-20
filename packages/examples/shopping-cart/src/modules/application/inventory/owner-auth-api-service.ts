// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/no-this-alias */
import { Kind } from '@fp4ts/core';
import { EitherT, Monad, Option, OptionT } from '@fp4ts/cats';
import { BasicAuthenticator } from '@fp4ts/http-server';

import {
  AuthenticationService,
  Password,
  UserId,
  Username,
} from '../../domain/auth';
import {
  BrandOwner,
  BrandOwnerId,
  BrandOwnerRepository,
} from '../../domain/inventory/brand-owner';

export class OwnerAuthApiService<F> {
  public constructor(
    private readonly F: Monad<F>,
    private readonly service: AuthenticationService<F>,
    private readonly repo: BrandOwnerRepository<F>,
  ) {}

  public readonly basicAuthenticator: BasicAuthenticator<F, BrandOwner> = ({
    username,
    password,
  }): Kind<F, [Option<BrandOwner>]> => {
    const { service, repo, F } = this;

    return OptionT.Monad(this.F).do(function* (_) {
      const usr = yield* _(OptionT(F.pure(Username(username))));
      const pwd = yield* _(OptionT(F.pure(Password(password))));

      const user = yield* _(
        EitherT(service.loginUser({ username: usr, password: pwd })).toOptionT(
          F,
        ),
      );

      const ownerId = BrandOwnerId(UserId.toUUID(user.id));
      return yield* _(OptionT(repo.findById(ownerId)));
    }).value;
  };
}
