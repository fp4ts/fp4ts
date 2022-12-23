// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eval, instance, Kind } from '@fp4ts/core';
import { Monoid } from '@fp4ts/cats-kernel';
import { Foldable } from './foldable';
import { MonoidK } from './monoid-k';
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

  foldMapKWithIndex<G>(
    G: MonoidK<G>,
  ): <A, B>(
    f: (a: A, i: I) => Kind<G, [B]>,
  ) => (fa: Kind<F, [A]>) => Kind<G, [B]>;
  foldMapKWithIndex_<G>(
    G: MonoidK<G>,
  ): <A, B>(fa: Kind<F, [A]>, f: (a: A, i: I) => Kind<G, [B]>) => Kind<G, [B]>;

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

export type FoldableWithIndexRequirements<F, I> = (
  | Pick<FoldableWithIndex<F, I>, 'foldMapKWithIndex_'>
  | Pick<FoldableWithIndex<F, I>, 'foldRightWithIndex_'>
) &
  Partial<FoldableWithIndex<F, I>>;
export const FoldableWithIndex = Object.freeze({
  of: <F, I>(
    F: FoldableWithIndexRequirements<F, I>,
  ): FoldableWithIndex<F, I> => {
    const self: FoldableWithIndex<F, I> = instance<FoldableWithIndex<F, I>>({
      foldMapWithIndex: M => f => fa => self.foldMapWithIndex_(M)(fa, f),
      foldMapWithIndex_: M => (fa, f) =>
        self.foldRightWithIndex_(fa, Eval.now(M.empty), (a, b, i) =>
          M.combineEval_(f(a, i), b),
        ).value,

      foldLeftWithIndex: (z, f) => fa => self.foldLeftWithIndex_(fa, z, f),
      foldLeftWithIndex_: <A, B>(
        fa: Kind<F, [A]>,
        z: B,
        f: (b: B, a: A, i: I) => B,
      ): B =>
        self.foldMapKWithIndex_(Endo.MonoidK.dual())(
          fa,
          (a: A, i: I) => (b: B) => f(b, a, i),
        )(z),

      foldRightWithIndex: (ez, f) => fa => self.foldRightWithIndex_(fa, ez, f),
      foldRightWithIndex_: <A, B>(
        fa: Kind<F, [A]>,
        ez: Eval<B>,
        f: (a: A, eb: Eval<B>, i: I) => Eval<B>,
      ): Eval<B> =>
        self.foldMapKWithIndex_(Endo.MonoidK)(
          fa,
          (a: A, i: I) => (eb: Eval<B>) => f(a, eb, i),
        )(ez),

      foldMapKWithIndex: G => f => fa => self.foldMapKWithIndex_(G)(fa, f),
      foldMapKWithIndex_:
        <G>(G: MonoidK<G>) =>
        <A, B>(fa: Kind<F, [A]>, f: (a: A, i: I) => Kind<G, [B]>) =>
          self.foldRightWithIndex_(fa, Eval.now(G.emptyK<B>()), (a, b, i) =>
            G.combineKEval_(f(a, i), b),
          ).value,

      ...Foldable.of({
        foldMapK_:
          F.foldMapK_ ??
          (<G>(G: MonoidK<G>) =>
            <A, B>(fa: Kind<F, [A]>, f: (a: A) => Kind<G, [B]>): Kind<G, [B]> =>
              self.foldMapKWithIndex_(G)(fa, a => f(a))),
        foldRight_:
          F.foldRight_ ??
          (<A, B>(
            fa: Kind<F, [A]>,
            ez: Eval<B>,
            f: (a: A, eb: Eval<B>) => Eval<B>,
          ): Eval<B> => self.foldRightWithIndex_(fa, ez, (a, eb) => f(a, eb))),
      }),

      ...F,
    });
    return self;
  },
});
