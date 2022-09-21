// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eq } from '@fp4ts/cats-kernel';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';
import fc, { Arbitrary } from 'fast-check';
import { EqLaws } from '../eq-laws';

export function EqSuite<A>(E: Eq<A>) {
  const laws = EqLaws(E);

  return {
    eq: (arbA: Arbitrary<A>): RuleSet =>
      new RuleSet('Eq', [
        ['eq reflexivity', forAll(arbA, laws.reflexivityEq)(E)],
        [
          'eq symmetric',
          forAll(arbA, arbA, laws.symmetricEq)(Eq.fromUniversalEquals()),
        ],
        [
          'eq anti symmetric',
          forAll(
            arbA,
            arbA,
            fc.func<[A], A>(arbA),
            laws.antiSymmetricEq,
          )(Eq.fromUniversalEquals()),
        ],
        [
          'eq transitivity',
          forAll(
            arbA,
            arbA,
            arbA,
            laws.transitivityEq,
          )(Eq.fromUniversalEquals()),
        ],
      ]),
  };
}
