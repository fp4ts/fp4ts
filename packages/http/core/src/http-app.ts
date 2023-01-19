// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Applicative, Kleisli } from '@fp4ts/cats';
import { Kind } from '@fp4ts/core';
import { Http } from './http';
import { Request, Response, Status } from './messages';

export type HttpApp<F> = Http<F, F>;
export const HttpApp: HttpAppObj = function <F>(
  run: (request: Request<F>) => Kind<F, [Response<F>]>,
): HttpApp<F> {
  return Http(run);
};
HttpApp.empty = <F>(F: Applicative<F>) =>
  Kleisli(() => F.pure(Status.NotFound<F>()));
interface HttpAppObj {
  <F>(run: (request: Request<F>) => Kind<F, [Response<F>]>): HttpApp<F>;
  empty<F>(F: Applicative<F>): HttpApp<F>;
}
