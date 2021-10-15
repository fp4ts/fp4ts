import { compose, id, Kind, pipe } from '@cats4ts/core';
import { Functor } from '@cats4ts/cats-core';
import { IsEq } from '@cats4ts/cats-test-kit';
import { InvariantLaws } from './invariant-laws';

export const FunctorLaws = <F>(F: Functor<F>): FunctorLaws<F> => ({
  ...InvariantLaws(F),

  covariantIdentity: <A>(fa: Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    new IsEq(F.map_(fa, id), fa),

  covariantComposition: <A, B, C>(
    fa: Kind<F, [A]>,
    f: (a: A) => B,
    g: (b: B) => C,
  ): IsEq<Kind<F, [C]>> => {
    const lhs = pipe(fa, F.map(f), F.map(g));
    const rhs = F.map_(fa, compose(g, f));
    return new IsEq(lhs, rhs);
  },
});

export interface FunctorLaws<F> extends InvariantLaws<F> {
  covariantIdentity: <A>(fa: Kind<F, [A]>) => IsEq<Kind<F, [A]>>;

  covariantComposition: <A, B, C>(
    fa: Kind<F, [A]>,
    f: (a: A) => B,
    g: (b: B) => C,
  ) => IsEq<Kind<F, [C]>>;
}
