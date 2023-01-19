// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { SemigroupK } from '@fp4ts/cats-core';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { SemigroupKLaws } from '../semigroup-k-laws';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const SemigroupKSuite = <F>(F: SemigroupK<F>) => {
  const laws = SemigroupKLaws(F);
  return {
    semigroupK: <A>(
      arbA: Arbitrary<A>,
      EqA: Eq<A>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(E: Eq<X>) => Eq<Kind<F, [X]>>,
    ): RuleSet =>
      new RuleSet('semigroupK', [
        [
          'semigroupK associativity',
          forAll(
            mkArbF(arbA),
            mkArbF(arbA),
            mkArbF(arbA),
            laws.semigroupKAssociative,
          )(mkEqF(EqA)),
        ],
      ]),
  };
};
