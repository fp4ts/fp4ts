// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Eval, EvalF, Kind } from '@fp4ts/core';
import { MonadDefer, MonadDeferRequirements } from './monad-defer';

import { evalMonadFix } from './instances/eval';
import { Function1F, function1MonadFix } from './instances/function';

/**
 * @category Type Class
 */
export interface MonadFix<F> extends MonadDefer<F> {
  fix<A>(f: (a: Eval<A>) => Kind<F, [A]>): Kind<F, [A]>;
}

export type MonadFixRequirements<F> = Pick<MonadFix<F>, 'fix'> &
  MonadDeferRequirements<F> &
  Partial<MonadFix<F>>;
export const MonadFix = Object.freeze({
  of: <F>(F: MonadFixRequirements<F>): MonadFix<F> => ({
    ...MonadDefer.of(F),
    ...F,
  }),

  get Eval(): MonadFix<EvalF> {
    return evalMonadFix();
  },

  Function1: <R>(): MonadFix<$<Function1F, [R]>> => function1MonadFix(),
});
