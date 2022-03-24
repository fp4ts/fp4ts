// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { HKT1 } from '@fp4ts/core';
import { Monad } from './monad';

export type StackSafeMonadRequirements<F> = Pick<
  Monad<F>,
  'flatMap_' | 'pure'
> &
  Partial<Monad<F>>;

function of<F>(F: StackSafeMonadRequirements<F>): Monad<F>;
function of<F>(F: StackSafeMonadRequirements<HKT1<F>>): Monad<HKT1<F>> {
  const self: Monad<HKT1<F>> = Monad.of({
    tailRecM_: (a, f) =>
      self.flatMap_(f(a), ea => ea.fold(a => self.tailRecM_(a, f), F.pure)),
    ...F,
  });
  return self;
}

export const StackSafeMonad = Object.freeze({ of });
