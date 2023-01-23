// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Arbitrary } from 'fast-check';
import { Ord } from '@fp4ts/cats-kernel';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';
import { OrdLaws } from '../ord-laws';
import { EqSuite } from './eq-suite';

export function OrdSuite<A>(O: Ord<A>) {
  const laws = OrdLaws(O);
  const self = {
    ...EqSuite(O),

    ord: (arbA: Arbitrary<A>): RuleSet =>
      new RuleSet(
        'Ord',
        [
          ['ord reflexivity LT', forAll(arbA, laws.reflexivityLT)],
          ['ord reflexivity GT', forAll(arbA, laws.reflexivityGT)],
          ['ord comparability', forAll(arbA, arbA, laws.comparabilityOrd)],
          ['ord transitivity', forAll(arbA, arbA, arbA, laws.transitivityOrd)],
          ['ord antisymmetry', forAll(arbA, arbA, laws.antisymmetryOrd)],
          ['ord max', forAll(arbA, arbA, laws.maxOrd)(O)],
          ['ord min', forAll(arbA, arbA, laws.minOrd)(O)],
        ],
        { parent: self.eq(arbA) },
      ),
  };
  return self;
}
