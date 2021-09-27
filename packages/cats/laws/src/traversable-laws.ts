import { Applicative, Traversable } from '@cats4ts/cats-core';
import { Identity, Nested, Tuple2K } from '@cats4ts/cats-core/lib/data';
import { IsEq } from '@cats4ts/cats-test-kit';
import { AnyK, Kind } from '@cats4ts/core';
import { FoldableLaws } from './foldable-laws';
import { FunctorLaws } from './functor-laws';
import { UnorderedTraversableLaws } from './unordered-traversable-laws';

export const TraversableLaws = <T extends AnyK>(T: Traversable<T>) => ({
  ...FunctorLaws(T),
  ...FoldableLaws(T),
  ...UnorderedTraversableLaws(T),

  traverseIdentity: <A, B>(
    fa: Kind<T, [A]>,
    f: (a: A) => B,
  ): IsEq<Kind<T, [B]>> =>
    T.traverse_(Identity.Applicative)(fa, x => f(x))['<=>'](T.map_(fa, f)),

  traverseSequentialComposition:
    <M extends AnyK, N extends AnyK>(M: Applicative<M>, N: Applicative<N>) =>
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

      return lhs['<=>'](rhs);
    },

  traverseParallelComposition:
    <M extends AnyK, N extends AnyK>(M: Applicative<M>, N: Applicative<N>) =>
    <A, B>(
      ta: Kind<T, [A]>,
      f: (a: A) => Kind<M, [B]>,
      g: (a: A) => Kind<N, [B]>,
    ): IsEq<Tuple2K<M, N, Kind<T, [B]>>> => {
      const lhs = T.traverse_(Tuple2K.Applicative(M, N))(ta, a =>
        Tuple2K(f(a), g(a)),
      );
      const rhs = Tuple2K(T.traverse_(M)(ta, f), T.traverse_(N)(ta, g));

      return lhs['<=>'](rhs);
    },
});

export interface TraversableLaws<T extends AnyK>
  extends FunctorLaws<T>,
    FoldableLaws<T>,
    UnorderedTraversableLaws<T> {
  traverseIdentity: <A, B>(
    fa: Kind<T, [A]>,
    f: (a: A) => B,
  ) => IsEq<Kind<T, [B]>>;

  traverseSequentialComposition: <M extends AnyK, N extends AnyK>(
    M: Applicative<M>,
    N: Applicative<N>,
  ) => <A, B, C>(
    ta: Kind<T, [A]>,
    f: (a: A) => Kind<M, [B]>,
    g: (b: B) => Kind<N, [C]>,
  ) => IsEq<Nested<M, N, Kind<T, [C]>>>;

  traverseParallelComposition: <M extends AnyK, N extends AnyK>(
    M: Applicative<M>,
    N: Applicative<N>,
  ) => <A, B>(
    ta: Kind<T, [A]>,
    f: (a: A) => Kind<M, [B]>,
    g: (a: A) => Kind<N, [B]>,
  ) => IsEq<Tuple2K<M, N, Kind<T, [B]>>>;
}
