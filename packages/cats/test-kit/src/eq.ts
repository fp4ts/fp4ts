import { Arbitrary } from 'fast-check';
import { Eq } from '@cats4ts/cats-core';
import { forAll } from '@cats4ts/cats-test-kit';

export const fn1Eq = <A, B>(arbA: Arbitrary<A>, EqB: Eq<B>): Eq<(a: A) => B> =>
  Eq.of({
    equals: (fx, fy) => {
      forAll(arbA, a => EqB.equals(fx(a), fy(a)))();
      return true;
    },
  });
