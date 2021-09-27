import { $, AnyK, id, Kind } from '@cats4ts/core';
import { Applicative, Functor, UnorderedTraversable } from '@cats4ts/cats-core';
import {
  Identity,
  IdentityK,
  Nested,
  NestedK,
  Tuple2K,
} from '@cats4ts/cats-core/lib/data';
import { IsEq } from '@cats4ts/cats-test-kit';

import { UnorderedFoldableLaws } from './unordered-foldable-laws';

export const UnorderedTraversableLaws = <T extends AnyK>(
  T: UnorderedTraversable<T>,
): UnorderedTraversableLaws<T> => ({
  ...UnorderedFoldableLaws(T),

  unorderedTraversableIdentity:
    (F: Functor<T>) =>
    <A, B>(fa: Kind<T, [A]>, f: (a: A) => B): IsEq<Kind<T, [B]>> =>
      T.unorderedTraverse_<IdentityK>(Identity.Applicative)(fa, x => f(x))[
        '<=>'
      ](F.map_(fa, f)),

  unorderedTraversableSequentialComposition:
    <M extends AnyK, N extends AnyK>(M: Applicative<M>, N: Applicative<N>) =>
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

      return lhs['<=>'](rhs);
    },

  unorderedTraversableParallelComposition:
    <M extends AnyK, N extends AnyK>(M: Applicative<M>, N: Applicative<N>) =>
    <A, B>(
      fa: Kind<T, [A]>,
      f: (a: A) => Kind<M, [B]>,
      g: (a: A) => Kind<N, [B]>,
    ): IsEq<Tuple2K<M, N, Kind<T, [B]>>> => {
      const lhs = T.unorderedTraverse_(Tuple2K.Applicative(M, N))(fa, a =>
        Tuple2K(f(a), g(a)),
      );
      const rhs = Tuple2K(
        T.unorderedTraverse_(M)(fa, f),
        T.unorderedTraverse_(N)(fa, g),
      );

      return lhs['<=>'](rhs);
    },

  unorderedSequenceConsistent:
    <G extends AnyK>(G: Applicative<G>) =>
    <A>(tga: Kind<T, [Kind<G, [A]>]>): IsEq<Kind<G, [Kind<T, [A]>]>> =>
      T.unorderedTraverse_(G)(tga, id)['<=>'](T.unorderedSequence(G)(tga)),
});

export interface UnorderedTraversableLaws<T extends AnyK>
  extends UnorderedFoldableLaws<T> {
  unorderedTraversableIdentity: (
    F: Functor<T>,
  ) => <A, B>(fa: Kind<T, [A]>, f: (a: A) => B) => IsEq<Kind<T, [B]>>;

  unorderedTraversableSequentialComposition: <M extends AnyK, N extends AnyK>(
    M: Applicative<M>,
    N: Applicative<N>,
  ) => <A, B, C>(
    fa: Kind<T, [A]>,
    f: (a: A) => Kind<M, [B]>,
    g: (b: B) => Kind<N, [C]>,
  ) => IsEq<Nested<M, N, Kind<T, [C]>>>;

  unorderedTraversableParallelComposition: <M extends AnyK, N extends AnyK>(
    M: Applicative<M>,
    N: Applicative<N>,
  ) => <A, B>(
    fa: Kind<T, [A]>,
    f: (a: A) => Kind<M, [B]>,
    g: (a: A) => Kind<N, [B]>,
  ) => IsEq<Tuple2K<M, N, Kind<T, [B]>>>;

  unorderedSequenceConsistent: <G extends AnyK>(
    G: Applicative<G>,
  ) => <A>(tga: Kind<T, [Kind<G, [A]>]>) => IsEq<Kind<G, [Kind<T, [A]>]>>;
}
