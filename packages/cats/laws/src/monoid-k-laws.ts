import { Kind } from '@fp4ts/core';
import { MonoidK } from '@fp4ts/cats-core';
import { IsEq } from '@fp4ts/cats-test-kit';

import { SemigroupKLaws } from './semigroup-k-laws';

export interface MonoidKLaws<F> extends SemigroupKLaws<F> {
  monoidKLeftIdentity: <A>(fa: Kind<F, [A]>) => IsEq<Kind<F, [A]>>;

  monoidKRightIdentity: <A>(fa: Kind<F, [A]>) => IsEq<Kind<F, [A]>>;
}

export const MonoidKLaws = <F>(F: MonoidK<F>): MonoidKLaws<F> => ({
  ...SemigroupKLaws(F),

  monoidKLeftIdentity: <A>(fa: Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    new IsEq(
      F.combineK_(F.emptyK(), () => fa),
      fa,
    ),

  monoidKRightIdentity: <A>(fa: Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    new IsEq(
      fa,
      F.combineK_(F.emptyK(), () => fa),
    ),
});
