import { AnyK, Kind } from '@cats4ts/core';
import { MonoidK } from '@cats4ts/cats-core';
import { IsEq } from '@cats4ts/cats-test-kit';

import { SemigroupKLaws } from './semigroup-k-laws';

export interface MonoidKLaws<F extends AnyK> extends SemigroupKLaws<F> {
  monoidKLeftIdentity: <A>(fa: Kind<F, [A]>) => IsEq<Kind<F, [A]>>;

  monoidKRightIdentity: <A>(fa: Kind<F, [A]>) => IsEq<Kind<F, [A]>>;
}

export const MonoidKLaws = <F extends AnyK>(F: MonoidK<F>): MonoidKLaws<F> => ({
  ...SemigroupKLaws(F),

  monoidKLeftIdentity: <A>(fa: Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    F.combineK_(F.emptyK(), () => fa)['<=>'](fa),

  monoidKRightIdentity: <A>(fa: Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    fa['<=>'](F.combineK_(F.emptyK(), () => fa)),
});
