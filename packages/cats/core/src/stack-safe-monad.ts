// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Base, Eval, EvalF, lazy } from '@fp4ts/core';
import { Defer } from './defer';
import { Monad } from './monad';
import {
  Function0F,
  Function1F,
  function0Monad,
  function1Monad,
} from './instances/function';

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
        tailRecM_: (a, f) =>
          self.flatMap_(f(a), ea => ea.fold(a => self.tailRecM_(a, f), F.pure)),
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

const evalMonad: () => StackSafeMonad<EvalF> = lazy(() =>
  StackSafeMonad.of({
    pure: Eval.pure,
    map_: (fa, f) => fa.map(f),
    flatMap_: (fa, f) => fa.flatMap(f),
    flatten: fa => fa.flatten(),
  }),
);
