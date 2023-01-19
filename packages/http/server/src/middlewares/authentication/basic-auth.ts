// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import {
  Applicative,
  Either,
  Kleisli,
  Left,
  None,
  Option,
  Right,
} from '@fp4ts/cats';
import { Sync } from '@fp4ts/effect';
import {
  AuthScheme,
  AuthedRequest,
  Authorization,
  BasicCredentials,
  Challenge,
  Request,
} from '@fp4ts/http-core';
import { AuthMiddleware } from '../../middleware';
import { challenged } from './challenged';

export type BasicAuthenticator<F, A> = (
  bc: BasicCredentials,
) => Kind<F, [Option<A>]>;

export function BasicAuth<F>(F: Sync<F>) {
  return <A>(
    realm: string,
    validate: BasicAuthenticator<F, A>,
  ): AuthMiddleware<F, A> => challenged(F)(challenge(F)(realm, validate));
}

export const challenge =
  <F>(F: Applicative<F>) =>
  <A>(
    realm: string,
    validate: BasicAuthenticator<F, A>,
  ): Kleisli<F, Request<F>, Either<Challenge, AuthedRequest<F, A>>> =>
    Kleisli(req =>
      F.map_(validatePassword(F)(validate, req), opt =>
        opt.fold(
          () => Left(new Challenge(AuthScheme.Basic, realm)),
          authInfo => Right(new AuthedRequest(authInfo, req)),
        ),
      ),
    );

export const validatePassword =
  <F>(F: Applicative<F>) =>
  <A>(
    validate: BasicAuthenticator<F, A>,
    req: Request<F>,
  ): Kind<F, [Option<A>]> =>
    req.headers
      .get(Authorization.Select)
      .flatMap(h => BasicCredentials.fromCredentials(h.credentials))
      .fold(
        () => F.pure(None),
        ([username, password]) =>
          validate(new BasicCredentials(username, password)),
      );
