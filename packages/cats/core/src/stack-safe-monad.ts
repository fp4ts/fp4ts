// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Base, EvalF, Kind } from '@fp4ts/core';
import { Defer } from './defer';
import { Monad } from './monad';
import { evalMonad } from './instances/eval';
import {
  Function0F,
  Function1F,
  function0Monad,
  function1Monad,
} from './instances/function';
import { Either } from './data';

export function isStackSafeMonad<F>(F: Base<F>): F is StackSafeMonad<F> {
  return (F as any).defer != null && (F as any).flatMap != null;
}

export interface StackSafeMonad<F> extends Monad<F>, Defer<F> {}

export type StackSafeMonadRequirements<F> = Pick<
  Monad<F>,
  'flatMap_' | 'pure'
> &
  Partial<Defer<F>> &
  Partial<Monad<F>>;
export const StackSafeMonad = Object.freeze({
  of: <F>(F: StackSafeMonadRequirements<F>): StackSafeMonad<F> => {
    const self: StackSafeMonad<F> = {
      ...Defer.of({
        defer: thunk => self.flatMap_(self.unit, () => thunk()),
        ...F,
      }),
      ...Monad.of({
        tailRecM_: <A, B>(a: A, f: (a: A) => Kind<F, [Either<A, B>]>) => {
          const cont = (ea: Either<A, B>): Kind<F, [B]> => ea.fold(go, F.pure);
          const go = (a: A): Kind<F, [B]> => self.flatMap_(f(a), cont);
          return go(a);
        },
        compose_:
          <A, B, C>(g: (b: B) => Kind<F, [C]>, f: (a: A) => Kind<F, [B]>) =>
          (a: A) =>
            self.defer(() => self.flatMap_(f(a), g)),
        ...F,
      }),
    };
    return self;
  },

  get Eval(): StackSafeMonad<EvalF> {
    return evalMonad();
  },

  get Function0(): StackSafeMonad<Function0F> {
    return function0Monad();
  },

  Function1: <R>(): StackSafeMonad<$<Function1F, [R]>> => function1Monad(),
});
