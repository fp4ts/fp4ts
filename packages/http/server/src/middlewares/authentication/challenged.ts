// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either, Kleisli, OptionT, Some } from '@fp4ts/cats';
import { Sync } from '@fp4ts/effect';
import {
  AuthedRequest,
  AuthedRoutes,
  Challenge,
  HttpRoutes,
  Request,
  Response,
  Status,
  WWWAuthenticate,
} from '@fp4ts/http-core';

export const challenged =
  <F>(F: Sync<F>) =>
  <A>(
    challenge: Kleisli<F, Request<F>, Either<Challenge, AuthedRequest<F, A>>>,
  ) =>
  (routes: AuthedRoutes<F, A>): HttpRoutes<F> =>
    Kleisli(req =>
      OptionT<F, Response<F>>(
        F.flatMap_(challenge.run(req), ea =>
          ea.fold(
            challenge =>
              F.pure(
                Some(
                  Status.Unauthorized().putHeaders(WWWAuthenticate(challenge)),
                ),
              ),
            authedRequest => routes.run(authedRequest).value,
          ),
        ),
      ),
    );
