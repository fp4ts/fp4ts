// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Applicative, Traversable } from '@fp4ts/cats-core';
import { Identity, Nested, Tuple2K } from '@fp4ts/cats-core/lib/data';
import { IsEq } from '@fp4ts/cats-test-kit';
import { FoldableLaws } from './foldable-laws';
import { FunctorLaws } from './functor-laws';
import { UnorderedTraversableLaws } from './unordered-traversable-laws';

export const TraversableLaws = <T>(T: Traversable<T>): TraversableLaws<T> => ({
  ...FunctorLaws(T),
  ...FoldableLaws(T),
  ...UnorderedTraversableLaws(T),

  traversableIdentity: <A, B>(
    fa: Kind<T, [A]>,
    f: (a: A) => B,
  ): IsEq<Kind<T, [B]>> =>
    new IsEq(
      T.traverse_(Identity.Applicative)(fa, x => f(x)),
      T.map_(fa, f),
    ),

  traversableSequentialComposition:
    <M, N>(M: Applicative<M>, N: Applicative<N>) =>
    <A, B, C>(
      ta: Kind<T, [A]>,
      f: (a: A) => Kind<M, [B]>,
      g: (b: B) => Kind<N, [C]>,
    ): IsEq<Nested<M, N, Kind<T, [C]>>> => {
      const lhs = Nested(
        M.map_(T.traverse_(M)(ta, f), fb => T.traverse_(N)(fb, g)),
      );
      const rhs = T.traverse_(Nested.Applicative(M, N))(ta, a =>
        Nested(M.map_(f(a), g)),
      );

      return new IsEq(lhs, rhs);
    },

  traversableParallelComposition:
    <M, N>(M: Applicative<M>, N: Applicative<N>) =>
    <A, B>(
      ta: Kind<T, [A]>,
      f: (a: A) => Kind<M, [B]>,
      g: (a: A) => Kind<N, [B]>,
    ): IsEq<Tuple2K<M, N, Kind<T, [B]>>> => {
      const lhs = T.traverse_(Tuple2K.Applicative(M, N))(ta, a => [f(a), g(a)]);
      const rhs: Tuple2K<M, N, Kind<T, [B]>> = [
        T.traverse_(M)(ta, f),
        T.traverse_(N)(ta, g),
      ];

      return new IsEq(lhs, rhs);
    },
});

export interface TraversableLaws<T>
  extends FunctorLaws<T>,
    FoldableLaws<T>,
    UnorderedTraversableLaws<T> {
  traversableIdentity: <A, B>(
    fa: Kind<T, [A]>,
    f: (a: A) => B,
  ) => IsEq<Kind<T, [B]>>;

  traversableSequentialComposition: <M, N>(
    M: Applicative<M>,
    N: Applicative<N>,
  ) => <A, B, C>(
    ta: Kind<T, [A]>,
    f: (a: A) => Kind<M, [B]>,
    g: (b: B) => Kind<N, [C]>,
  ) => IsEq<Nested<M, N, Kind<T, [C]>>>;

  traversableParallelComposition: <M, N>(
    M: Applicative<M>,
    N: Applicative<N>,
  ) => <A, B>(
    ta: Kind<T, [A]>,
    f: (a: A) => Kind<M, [B]>,
    g: (a: A) => Kind<N, [B]>,
  ) => IsEq<Tuple2K<M, N, Kind<T, [B]>>>;
}
