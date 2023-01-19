// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eval, Kind } from '@fp4ts/core';
import { FoldableWithIndex, MonoidK } from '@fp4ts/cats-core';
import { Monoid } from '@fp4ts/cats-kernel';
import { IsEq } from '@fp4ts/cats-test-kit';
import { FoldableLaws } from './foldable-laws';
import { Endo } from '@fp4ts/cats-core/lib/data';

export const FoldableWithIndexLaws = <F, I>(F: FoldableWithIndex<F, I>) => ({
  ...FoldableLaws(F),

  indexedLeftFoldConsistentWithFoldMap:
    <B>(B: Monoid<B>) =>
    <A>(fa: Kind<F, [A]>, f: (a: A, i: I) => B): IsEq<B> =>
      new IsEq(
        F.foldMapWithIndex_(B)(fa, f),
        F.foldLeftWithIndex_(fa, B.empty, (b, a, i) => B.combine_(b, f(a, i))),
      ),

  indexedRightFoldConsistentWithFoldMap:
    <B>(B: Monoid<B>) =>
    <A>(fa: Kind<F, [A]>, f: (a: A, i: I) => B): IsEq<B> =>
      new IsEq(
        F.foldMapWithIndex_(B)(fa, f),
        F.foldRightWithIndex_(fa, Eval.now(B.empty), (a, eb, i) =>
          B.combineEval_(f(a, i), eb),
        ).value,
      ),

  indexedFoldMapConsistentWithRightFold: <A, B>(
    fa: Kind<F, [A]>,
    ez: Eval<B>,
    f: (a: A, eb: Eval<B>, i: I) => Eval<B>,
  ): IsEq<B> =>
    new IsEq(
      F.foldRightWithIndex_(fa, ez, f).value,
      F.foldMapWithIndex_(Endo.EvalMonoidK.algebra<B>())(
        fa,
        (a, i) => (eb: Eval<B>) => f(a, eb, i),
      )(ez).value,
    ),

  indexedFoldMapConsistentWithLeftFold: <A, B>(
    fa: Kind<F, [A]>,
    z: B,
    f: (b: B, a: A, i: I) => B,
  ): IsEq<B> =>
    new IsEq(
      F.foldLeftWithIndex_(fa, z, f),
      F.foldMapWithIndex_(Endo.MonoidK.algebra<B>().dual())(
        fa,
        (a, i) => (b: B) => f(b, a, i),
      )(z),
    ),
  indexedFoldMapKConsistentWithFoldMap:
    <G>(G: MonoidK<G>) =>
    <A, B>(
      fa: Kind<F, [A]>,
      f: (a: A, i: I) => Kind<G, [B]>,
    ): IsEq<Kind<G, [B]>> =>
      new IsEq(
        F.foldMapWithIndex_(G.algebra<B>())(fa, f),
        F.foldMapKWithIndex_(G)(fa, f),
      ),
});
