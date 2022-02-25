// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Monad } from './monad';

export type StackSafeMonadRequirements<F> = Pick<
  Monad<F>,
  'flatMap_' | 'pure'
> &
  Partial<Monad<F>>;
export const StackSafeMonad = Object.freeze({
  of: <F>(F: StackSafeMonadRequirements<F>): Monad<F> => {
    const self: Monad<F> = Monad.of({
      tailRecM_: (a, f) =>
        self.flatMap_(f(a), ea => ea.fold(a => self.tailRecM_(a, f), F.pure)),
      ...F,
    });
    return self;
  },
});
