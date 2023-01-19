// Copyright (c) 2021-2023 Peter Matta
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

  foldMapLeftWithIndex<M>(
    M: Monoid<M>,
  ): <A>(f: (a: A, i: I) => M) => (fa: Kind<F, [A]>) => M;
  foldMapLeftWithIndex_<M>(
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

      foldMapLeftWithIndex: M => f => fa => self.foldMapWithIndex_(M)(fa, f),
      foldMapLeftWithIndex_: M => (fa, f) =>
        self.foldLeftWithIndex_(fa, M.empty, (b, a, i) =>
          M.combine_(b, f(a, i)),
        ),

      foldLeftWithIndex: (z, f) => fa => self.foldLeftWithIndex_(fa, z, f),
      foldLeftWithIndex_: <A, B>(
        fa: Kind<F, [A]>,
        z: B,
        f: (b: B, a: A, i: I) => B,
      ): B =>
        self
          .foldRightWithIndex_(
            fa,
            Eval.now((x: B) => Eval.now(x)),
            (a, ek, i) => Eval.now((b: B) => ek.flatMap(k => k(f(b, a, i)))),
          )
          .value(z).value,

      foldRightWithIndex: (ez, f) => fa => self.foldRightWithIndex_(fa, ez, f),
      foldRightWithIndex_: <A, B>(
        fa: Kind<F, [A]>,
        ez: Eval<B>,
        f: (a: A, eb: Eval<B>, i: I) => Eval<B>,
      ): Eval<B> =>
        self.foldMapWithIndex_(Endo.EvalMonoidK.algebra<B>())(
          fa,
          (a, i) => (eb: Eval<B>) => f(a, eb, i),
        )(ez),

      foldMapKWithIndex: G => f => fa => self.foldMapKWithIndex_(G)(fa, f),
      foldMapKWithIndex_:
        <G>(G: MonoidK<G>) =>
        <A, B>(fa: Kind<F, [A]>, f: (a: A, i: I) => Kind<G, [B]>) =>
          self.foldMapWithIndex_(G.algebra<B>())(fa, f),

      ...Foldable.of({
        foldMap_:
          F.foldMap_ ??
          (<M>(M: Monoid<M>) =>
            <A>(fa: Kind<F, [A]>, f: (a: A) => M): M =>
              self.foldMapWithIndex_(M)(fa, a => f(a))),
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
