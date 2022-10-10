// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $ } from '@fp4ts/core';
import { Applicative, Kleisli } from '@fp4ts/cats';
import { Request } from '@fp4ts/http-core';
import { RouteResultT, RouteResultTF } from './route-result';

export type DelayedCheck<F, A> = Kleisli<$<RouteResultTF, [F]>, Request<F>, A>;

export const DelayedCheck = Object.freeze({
  pure:
    <F>(F: Applicative<F>) =>
    <A>(a: A): DelayedCheck<F, A> =>
      (() => F.pure(a)) as any as DelayedCheck<F, A>,

  liftRouteResult:
    <F, A>(ra: RouteResultT<F, A>): DelayedCheck<F, A> =>
    () =>
      ra,
});
