// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { IsEq } from '@fp4ts/cats-test-kit';
import { Applicative, TraversableWithIndex } from '@fp4ts/cats-core';
import { Identity, Product } from '@fp4ts/cats-core/lib/data';
import { TraversableLaws } from './traversable-laws';

export const TraversableWithIndexLaws = <T, I>(
  T: TraversableWithIndex<T, I>,
) => ({
  ...TraversableLaws(T),

  indexedTraversableIdentity: <A, B>(
    fa: Kind<T, [A]>,
    f: (a: A, i: I) => B,
  ): IsEq<Kind<T, [B]>> =>
    new IsEq(
      T.traverseWithIndex_(Identity.Applicative)(fa, (x, i) => f(x, i)),
      T.mapWithIndex_(fa, f),
    ),

  indexedTraversableSequentialComposition:
    <M, N>(M: Applicative<M>, N: Applicative<N>) =>
    <A, B, C>(
      ta: Kind<T, [A]>,
      f: (a: A, i: I) => Kind<M, [B]>,
      g: (b: B, i: I) => Kind<N, [C]>,
    ): IsEq<Kind<[M, N], [Kind<T, [C]>]>> => {
      const lhs = M.map_(T.traverseWithIndex_(M)(ta, f), fb =>
        T.traverseWithIndex_(N)(fb, g),
      );
      const rhs = T.traverseWithIndex_<[M, N]>(Applicative.compose(M, N))(
        ta,
        (a, i) => M.map_(f(a, i), b => g(b, i)),
      );

      return new IsEq(lhs, rhs);
    },

  indexedTraversableParallelComposition:
    <M, N>(M: Applicative<M>, N: Applicative<N>) =>
    <A, B>(
      ta: Kind<T, [A]>,
      f: (a: A, i: I) => Kind<M, [B]>,
      g: (a: A, i: I) => Kind<N, [B]>,
    ): IsEq<Product<M, N, Kind<T, [B]>>> => {
      const lhs = T.traverseWithIndex_(Product.Applicative(M, N))(
        ta,
        (a, i) => [f(a, i), g(a, i)],
      );
      const rhs: Product<M, N, Kind<T, [B]>> = [
        T.traverseWithIndex_(M)(ta, f),
        T.traverseWithIndex_(N)(ta, g),
      ];

      return new IsEq(lhs, rhs);
    },
});
