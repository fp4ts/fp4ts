// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Base, Eval, EvalF, Kind } from '@fp4ts/core';
import { ApplicativeDefer } from './applicative-defer';
import { Either } from './data';
import { Monad } from './monad';

import { evalMonadDefer } from './instances/eval';
import {
  Function0F,
  Function1F,
  function0MonadDefer,
  function1MonadDefer,
} from './instances/function';

/**
 * @category Type Class
 */
export interface MonadDefer<F> extends Monad<F>, ApplicativeDefer<F> {}

export type MonadDeferRequirements<F> = Pick<
  MonadDefer<F>,
  'flatMap_' | 'pure'
> &
  Partial<MonadDefer<F>>;
export const MonadDefer = Object.freeze({
  of: <F>(F: MonadDeferRequirements<F>): MonadDefer<F> => {
    const M = Monad.of({
      tailRecM_: <A, B>(a: A, f: (a: A) => Kind<F, [Either<A, B>]>) => {
        const cont = (ea: Either<A, B>): Kind<F, [B]> => ea.fold(go, self.pure);
        const go = (a: A): Kind<F, [B]> => self.flatMap_(f(a), cont);
        return go(a);
      },
      compose_:
        <A, B, C>(g: (b: B) => Kind<F, [C]>, f: (a: A) => Kind<F, [B]>) =>
        (a: A) =>
          self.defer(() => self.flatMap_(f(a), g)),
      ...F,
    });

    const self: MonadDefer<F> = {
      ...M,
      ...ApplicativeDefer.of({
        defer: F.defer ?? (thunk => self.flatMap_(self.unit, _ => thunk())),
        ap_: M.ap_,
        map2_: M.map2_,
        map2Eval_:
          F.map2Eval_ ??
          ((fa, efb, f) =>
            Eval.now(
              self.flatMap_(fa, a => self.map_(efb.value, b => f(a, b))),
            )),
        ...F,
      }),
      ...F,
    };
    return self;
  },

  get Eval(): MonadDefer<EvalF> {
    return evalMonadDefer();
  },

  get Function0(): MonadDefer<Function0F> {
    return function0MonadDefer();
  },

  Function1: <R>(): MonadDefer<$<Function1F, [R]>> => function1MonadDefer(),
});
