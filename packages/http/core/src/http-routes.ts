// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $ } from '@fp4ts/core';
import { Monad, OptionTK } from '@fp4ts/cats';
import { Http } from './http';
import { Response, Status } from './messages';

export type HttpRoutes<F> = Http<$<OptionTK, [F]>, F>;
export const HttpRoutes = {
  orNotFound:
    <F>(F: Monad<F>) =>
    (routes: HttpRoutes<F>): Http<F, F> =>
      routes.mapK(opt => opt.getOrElse(F)(() => Status.NotFound())),
};
