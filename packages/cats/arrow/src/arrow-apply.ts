// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Applicative, Functor, MonadDefer } from '@fp4ts/cats-core';
import { $, cached, Kind, pipe, tupled } from '@fp4ts/core';
import { Arrow, ArrowRequirements } from './arrow';
import { functionArrowApply } from './instances/function';

/**
 * @category Type Class
 * @category Arrow
 */
export interface ArrowApply<P> extends Arrow<P> {
  app<A, B>(): Kind<P, [[Kind<P, [A, B]>, A], B]>;
}

export type ArrowApplyRequirements<P> = Pick<ArrowApply<P>, 'app'> &
  ArrowRequirements<P> &
  Partial<ArrowApply<P>>;
export const ArrowApply = Object.freeze({
  of: <P>(P: ArrowApplyRequirements<P>): ArrowApply<P> => ({
    ...Arrow.of(P),
    ...P,
  }),

  get Function1() {
    return functionArrowApply();
  },
});

export const ArrowMonad = Object.freeze({
  Functor: cached(
    <P>(P: ArrowApply<P>): Functor<$<P, [void]>> =>
      Functor.of({ map_: (fa, f) => P.andThen_(fa, P.lift(f)) }),
  ),

  Applicative: cached(
    <P>(P: ArrowApply<P>): Applicative<$<P, [void]>> =>
      Applicative.of<$<P, [void]>>({
        ...ArrowMonad.Functor(P),
        pure: a => P.lift(_ => a),
        ap_: (ff, fa) =>
          P.andThen_(
            P.merge_(ff, fa),
            P.lift(([f, a]) => f(a)),
          ),
        map2_: (fa, fb, f) =>
          P.andThen_(
            P.merge_(fa, fb),
            P.lift(([a, b]) => f(a, b)),
          ),
        product_: P.merge_,
      }),
  ),

  Monad: cached(
    <P>(P: ArrowApply<P>): MonadDefer<$<P, [void]>> =>
      MonadDefer.of<$<P, [void]>>({
        ...ArrowMonad.Applicative(P),

        flatMap_: <A, B>(
          fa: Kind<P, [void, A]>,
          f: (a: A) => Kind<P, [void, B]>,
        ) =>
          pipe(
            fa,
            P.andThen(P.lift(a => tupled(f(a), undefined))),
            P.andThen(P.app<void, B>()),
          ),
      }),
  ),
});
