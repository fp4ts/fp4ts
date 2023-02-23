// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Base, EvalF, Kind } from '@fp4ts/core';
import { Either } from './data';
import { Defer } from './defer';
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
export interface MonadDefer<F> extends Monad<F>, Defer<F> {
  delay<A>(thunk: () => A): Kind<F, [A]>;
}

export type MonadDeferRequirements<F> = Pick<
  MonadDefer<F>,
  'flatMap_' | 'pure'
> &
  Partial<MonadDefer<F>>;
export const MonadDefer = Object.freeze({
  of: <F>(F: MonadDeferRequirements<F>): MonadDefer<F> => {
    const self: MonadDefer<F> = {
      delay: thunk => self.defer(() => self.pure(thunk())),

      ...Defer.of({
        defer: F.defer ?? (thunk => self.flatMap_(self.unit, _ => thunk())),
        ...F,
      }),

      ...Monad.of({
        tailRecM_: <A, B>(a: A, f: (a: A) => Kind<F, [Either<A, B>]>) => {
          const cont = (ea: Either<A, B>): Kind<F, [B]> =>
            ea.fold(go, self.pure);
          const go = (a: A): Kind<F, [B]> => self.flatMap_(f(a), cont);
          return go(a);
        },
        compose_:
          <A, B, C>(g: (b: B) => Kind<F, [C]>, f: (a: A) => Kind<F, [B]>) =>
          (a: A) =>
            self.defer(() => self.flatMap_(f(a), g)),
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

export function isMonadDefer<F>(F: Base<F>): F is MonadDefer<F> {
  return (F as any).defer != null && (F as any).flatMap != null;
}
