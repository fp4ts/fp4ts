// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Eval, EvalF, Kind } from '@fp4ts/core';
import { Applicative, ApplicativeRequirements } from './applicative';
import { Defer, DeferRequirements } from './defer';
import { MonadDefer } from './monad-defer';

import { Function0F, Function1F } from './instances/function';

/**
 * @category Type Class
 */
export interface ApplicativeDefer<F> extends Applicative<F>, Defer<F> {
  delay<A>(thunk: () => A): Kind<F, [A]>;
}

export type ApplicativeDeferRequirements<F> = ApplicativeRequirements<F> &
  DeferRequirements<F> &
  Partial<ApplicativeDefer<F>>;
export const ApplicativeDefer = Object.freeze({
  of: <F>(F: ApplicativeDeferRequirements<F>): ApplicativeDefer<F> => {
    const self: ApplicativeDefer<F> = {
      delay: thunk => F.defer(() => F.pure(thunk())),
      ...Applicative.of(F),
      ...Defer.of(F),
    };
    return self;
  },

  get Eval(): ApplicativeDefer<EvalF> {
    return MonadDefer.Eval;
  },

  get Function0(): ApplicativeDefer<Function0F> {
    return MonadDefer.Function0;
  },

  Function1: <R>(): MonadDefer<$<Function1F, [R]>> => MonadDefer.Function1(),
});
