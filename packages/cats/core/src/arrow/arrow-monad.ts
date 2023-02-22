// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Kind, pipe, tupled, TyK, TyVar } from '@fp4ts/core';
import { Applicative } from '../applicative';
import { Functor } from '../functor';
import { Monad } from '../monad';
import { StackSafeMonad } from '../stack-safe-monad';
import { Arrow } from './arrow';
import { ArrowApply } from './arrow-apply';

export type ArrowMonad<F, B> = Kind<F, [void, B]>;

export const ArrowMonad = Object.freeze({
  Functor<F>(F: Arrow<F>): Functor<$<F, [void]>> {
    return Functor.of({ map_: (fa, f) => F.andThen_(fa, F.lift(f)) });
  },

  Applicative<F>(F: Arrow<F>): Applicative<$<F, [void]>> {
    return Applicative.of<$<F, [void]>>({
      ...ArrowMonad.Functor(F),
      pure: a => F.lift(() => a),
      ap_: (ff, fa) =>
        F.andThen_(
          F.merge_(ff, fa),
          F.lift(([f, a]) => f(a)),
        ),
    });
  },

  Monad<F>(F: ArrowApply<F>): Monad<$<F, [void]>> {
    return StackSafeMonad.of<$<F, [void]>>({
      ...ArrowMonad.Applicative(F),

      flatMap_: (fa, f) =>
        pipe(
          fa,
          F.andThen(F.lift(a => tupled(f(a), undefined as void))),
          F.andThen(F.app()),
        ),
    });
  },
});

// -- HKT

export interface ArrowMonadF extends TyK<[unknown, unknown]> {
  [$type]: ArrowMonad<TyVar<this, 0>, TyVar<this, 1>>;
}
