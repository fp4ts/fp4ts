import { AnyK, compose, id, Kind, pipe } from '@cats4ts/core';
import { Functor } from '@cats4ts/cats-core';
import { IsEq } from '@cats4ts/cats-test-kit';

export interface FunctorLaws<F extends AnyK> {
  covariantIdentity: <A>(fa: Kind<F, [A]>) => IsEq<Kind<F, [A]>>;

  covariantComposition: <A, B, C>(
    fa: Kind<F, [A]>,
    f: (a: A) => B,
    g: (b: B) => C,
  ) => IsEq<Kind<F, [C]>>;
}

export const FunctorLaws = <F extends AnyK>(F: Functor<F>): FunctorLaws<F> => ({
  covariantIdentity: <A>(fa: Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    F.map_(fa, id)['<=>'](fa),

  covariantComposition: <A, B, C>(
    fa: Kind<F, [A]>,
    f: (a: A) => B,
    g: (b: B) => C,
  ): IsEq<Kind<F, [C]>> =>
    pipe(fa, F.map(f), F.map(g))['<=>'](F.map_(fa, compose(g, f))),
});
