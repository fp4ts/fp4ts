import { Eq } from '@fp4ts/cats-core';
import { ExhaustiveCheck } from './exhaustive-check';

export const fn1Eq = <A, B>(
  ec: ExhaustiveCheck<A>,
  EqB: Eq<B>,
): Eq<(a: A) => B> =>
  Eq.of({
    equals: (fx, fy) => ec.allValues.all(a => EqB.equals(fx(a), fy(a))),
  });
