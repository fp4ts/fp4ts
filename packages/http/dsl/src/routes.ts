// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Monad } from '@fp4ts/cats';
import { HttpRoutes } from '@fp4ts/http-core';
import { RoutesBuilder, routesBuilder } from './internal';

export const Routes = Object.freeze({
  of:
    <F>(F: Monad<F>) =>
    (buildRoutes: ($: RoutesBuilder<F>) => HttpRoutes<F>): HttpRoutes<F> =>
      buildRoutes(routesBuilder(F)),
});
