// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { instance, Kind } from '@fp4ts/core';
import { Monoid } from '@fp4ts/cats-kernel';
import { Eval } from './eval';
import { Foldable } from './foldable';
import { Endo } from './data';

/**
 * @category Type Class
 */
export interface FoldableWithIndex<F, I> extends Foldable<F> {
  foldMapWithIndex<M>(
    M: Monoid<M>,
  ): <A>(f: (a: A, i: I) => M) => (fa: Kind<F, [A]>) => M;
  foldMapWithIndex_<M>(
    M: Monoid<M>,
  ): <A>(fa: Kind<F, [A]>, f: (a: A, i: I) => M) => M;

  foldLeftWithIndex<A, B>(
    z: B,
    f: (b: B, a: A, i: I) => B,
  ): (fa: Kind<F, [A]>) => B;
  foldLeftWithIndex_<A, B>(
    fa: Kind<F, [A]>,
    z: B,
    f: (b: B, a: A, i: I) => B,
  ): B;

  foldRightWithIndex<A, B>(
    ez: Eval<B>,
    f: (a: A, eb: Eval<B>, i: I) => Eval<B>,
  ): (fa: Kind<F, [A]>) => Eval<B>;
  foldRightWithIndex_<A, B>(
    fa: Kind<F, [A]>,
    ez: Eval<B>,
    f: (a: A, eb: Eval<B>, i: I) => Eval<B>,
  ): Eval<B>;
}

export type FoldableWithIndexRequirements<F, I> = Pick<
  FoldableWithIndex<F, I>,
  'foldMapWithIndex_'
> &
  Partial<FoldableWithIndex<F, I>>;
export const FoldableWithIndex = Object.freeze({
  of: <F, I>(
    F: FoldableWithIndexRequirements<F, I>,
  ): FoldableWithIndex<F, I> => {
    const self: FoldableWithIndex<F, I> = instance<FoldableWithIndex<F, I>>({
      foldMapWithIndex: M => f => fa => self.foldMapWithIndex_(M)(fa, f),

      foldLeftWithIndex: (z, f) => fa => self.foldLeftWithIndex_(fa, z, f),
      foldLeftWithIndex_: <A, B>(
        fa: Kind<F, [A]>,
        z: B,
        f: (b: B, a: A, i: I) => B,
      ): B =>
        self.foldMapWithIndex_(Endo.MonoidK.algebra<B>().dual())(
          fa,
          (a: A, i: I) => (b: B) => f(b, a, i),
        )(z),

      foldRightWithIndex: (ez, f) => fa => self.foldRightWithIndex_(fa, ez, f),
      foldRightWithIndex_: <A, B>(
        fa: Kind<F, [A]>,
        ez: Eval<B>,
        f: (a: A, eb: Eval<B>, i: I) => Eval<B>,
      ): Eval<B> =>
        self.foldMapWithIndex_(Endo.MonoidK.algebra<Eval<B>>())(
          fa,
          (a: A, i: I) => (eb: Eval<B>) => f(a, eb, i),
        )(ez),

      ...Foldable.of({
        foldMap_:
          F.foldMap_ ??
          (<M>(M: Monoid<M>) =>
            <A>(fa: Kind<F, [A]>, f: (a: A) => M): M =>
              self.foldMapWithIndex_(M)(fa, a => f(a))),
      }),

      ...F,
    });
    return self;
  },
});
