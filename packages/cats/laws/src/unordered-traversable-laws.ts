// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, id, Kind } from '@fp4ts/core';
import { Applicative, Functor, UnorderedTraversable } from '@fp4ts/cats-core';
import {
  Identity,
  IdentityK,
  Nested,
  NestedK,
  Tuple2K,
} from '@fp4ts/cats-core/lib/data';
import { IsEq } from '@fp4ts/cats-test-kit';

import { UnorderedFoldableLaws } from './unordered-foldable-laws';

export const UnorderedTraversableLaws = <T>(
  T: UnorderedTraversable<T>,
): UnorderedTraversableLaws<T> => ({
  ...UnorderedFoldableLaws(T),

  unorderedTraversableIdentity:
    (F: Functor<T>) =>
    <A, B>(fa: Kind<T, [A]>, f: (a: A) => B): IsEq<Kind<T, [B]>> =>
      new IsEq(
        T.unorderedTraverse_<IdentityK>(Identity.Applicative)(fa, x => f(x)),
        F.map_(fa, f),
      ),

  unorderedTraversableSequentialComposition:
    <M, N>(M: Applicative<M>, N: Applicative<N>) =>
    <A, B, C>(
      fa: Kind<T, [A]>,
      f: (a: A) => Kind<M, [B]>,
      g: (b: B) => Kind<N, [C]>,
    ): IsEq<Nested<M, N, Kind<T, [C]>>> => {
      const lhs = Nested<M, N, Kind<T, [C]>>(
        M.map_(T.unorderedTraverse_(M)(fa, f), fb =>
          T.unorderedTraverse_(N)(fb, g),
        ),
      );
      const rhs = T.unorderedTraverse_<$<NestedK, [M, N]>>(
        Nested.Applicative(M, N),
      )(fa, a => Nested(M.map_(f(a), g)));

      return new IsEq(lhs, rhs);
    },

  unorderedTraversableParallelComposition:
    <M, N>(M: Applicative<M>, N: Applicative<N>) =>
    <A, B>(
      fa: Kind<T, [A]>,
      f: (a: A) => Kind<M, [B]>,
      g: (a: A) => Kind<N, [B]>,
    ): IsEq<Tuple2K<M, N, Kind<T, [B]>>> => {
      const lhs = T.unorderedTraverse_(Tuple2K.Applicative(M, N))(fa, a => [
        f(a),
        g(a),
      ]);
      const rhs: Tuple2K<M, N, Kind<T, [B]>> = [
        T.unorderedTraverse_(M)(fa, f),
        T.unorderedTraverse_(N)(fa, g),
      ];

      return new IsEq(lhs, rhs);
    },

  unorderedSequenceConsistent:
    <G>(G: Applicative<G>) =>
    <A>(tga: Kind<T, [Kind<G, [A]>]>): IsEq<Kind<G, [Kind<T, [A]>]>> =>
      new IsEq(T.unorderedTraverse_(G)(tga, id), T.unorderedSequence(G)(tga)),
});

export interface UnorderedTraversableLaws<T> extends UnorderedFoldableLaws<T> {
  unorderedTraversableIdentity: (
    F: Functor<T>,
  ) => <A, B>(fa: Kind<T, [A]>, f: (a: A) => B) => IsEq<Kind<T, [B]>>;

  unorderedTraversableSequentialComposition: <M, N>(
    M: Applicative<M>,
    N: Applicative<N>,
  ) => <A, B, C>(
    fa: Kind<T, [A]>,
    f: (a: A) => Kind<M, [B]>,
    g: (b: B) => Kind<N, [C]>,
  ) => IsEq<Nested<M, N, Kind<T, [C]>>>;

  unorderedTraversableParallelComposition: <M, N>(
    M: Applicative<M>,
    N: Applicative<N>,
  ) => <A, B>(
    fa: Kind<T, [A]>,
    f: (a: A) => Kind<M, [B]>,
    g: (a: A) => Kind<N, [B]>,
  ) => IsEq<Tuple2K<M, N, Kind<T, [B]>>>;

  unorderedSequenceConsistent: <G>(
    G: Applicative<G>,
  ) => <A>(tga: Kind<T, [Kind<G, [A]>]>) => IsEq<Kind<G, [Kind<T, [A]>]>>;
}
