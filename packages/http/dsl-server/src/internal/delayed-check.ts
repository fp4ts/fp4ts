// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $ } from '@fp4ts/core';
import { Applicative, Monad, ReaderT } from '@fp4ts/cats';
import { Request } from '@fp4ts/http-core';
import { RouteResultT, RouteResultTK } from './route-result';

export type DelayedCheck<F, A> = ReaderT<$<RouteResultTK, [F]>, Request<F>, A>;

export const DelayedCheck = Object.freeze({
  pure:
    <F>(F: Applicative<F>) =>
    <A>(a: A): DelayedCheck<F, A> =>
      ReaderT.pure(F)(a) as any as DelayedCheck<F, A>,
  withRequest:
    <F>(F: Monad<F>) =>
    <A>(f: (req: Request<F>) => RouteResultT<F, A>): DelayedCheck<F, A> =>
      ReaderT(f),
});
