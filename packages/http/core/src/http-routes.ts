// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $ } from '@fp4ts/core';
import { Monad, OptionT, OptionTF } from '@fp4ts/cats';
import { Http } from './http';
import { Status, Request, Response } from './messages';

export type HttpRoutes<F> = Http<$<OptionTF, [F]>, F>;
export const HttpRoutes: HttpRoutesObj = function (run) {
  return Http(run);
};

HttpRoutes.orNotFound =
  <F>(F: Monad<F>) =>
  (routes: HttpRoutes<F>): Http<F, F> =>
    routes.mapK(opt => opt.getOrElse(F)(() => Status.NotFound()));

interface HttpRoutesObj {
  <F>(run: (req: Request<F>) => OptionT<F, Response<F>>): HttpRoutes<F>;
  orNotFound<F>(F: Monad<F>): (routes: HttpRoutes<F>) => Http<F, F>;
}
