import { AnyK, Kind } from '@cats4ts/core';
import { SemigroupK } from '@cats4ts/cats-core';
import { IsEq } from '@cats4ts/cats-test-kit';

export interface SemigroupKLaws<F extends AnyK> {
  semigroupKAssociative: <A>(
    a: Kind<F, [A]>,
    b: Kind<F, [A]>,
    c: Kind<F, [A]>,
  ) => IsEq<Kind<F, [A]>>;
}

export const SemigroupKLaws = <F extends AnyK>(
  F: SemigroupK<F>,
): SemigroupKLaws<F> => ({
  semigroupKAssociative: <A>(
    a: Kind<F, [A]>,
    b: Kind<F, [A]>,
    c: Kind<F, [A]>,
  ): IsEq<Kind<F, [A]>> =>
    F.combineK_(F.combineK_(a, b), c)['<=>'](F.combineK_(a, F.combineK_(b, c))),
});
