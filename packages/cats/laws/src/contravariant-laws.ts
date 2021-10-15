import { compose, id, Kind, pipe } from '@cats4ts/core';
import { Contravariant } from '@cats4ts/cats-core';
import { IsEq } from '@cats4ts/cats-test-kit';

import { InvariantLaws } from './invariant-laws';

export const ContravariantLaws = <F>(
  F: Contravariant<F>,
): ContravariantLaws<F> => ({
  ...InvariantLaws(F),

  contravariantIdentity: <A>(fa: Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    new IsEq(F.contramap_(fa, id), fa),

  contravariantComposition: <A, B, C>(
    fa: Kind<F, [A]>,
    f: (b: B) => A,
    g: (c: C) => B,
  ): IsEq<Kind<F, [C]>> =>
    new IsEq(
      pipe(fa, F.contramap(f), F.contramap(g)),
      F.contramap_(fa, compose(f, g)),
    ),
});

export interface ContravariantLaws<F> extends InvariantLaws<F> {
  contravariantIdentity: <A>(fa: Kind<F, [A]>) => IsEq<Kind<F, [A]>>;

  contravariantComposition: <A, B, C>(
    fa: Kind<F, [A]>,
    f: (b: B) => A,
    g: (c: C) => B,
  ) => IsEq<Kind<F, [C]>>;
}
