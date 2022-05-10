// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Arbitrary } from 'fast-check';
import { Eq, Option } from '@fp4ts/cats';
import { Prism } from '@fp4ts/optics-core';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { PrismLaws } from '../prism-laws';
// import { OptionalSuite } from './optional-suite';

export const PrismSuite = <S, A>(prism: Prism<S, A>) => {
  const laws = PrismLaws(prism);

  const self = {
    // ...OptionalSuite(prism),

    prism: (arbS: Arbitrary<S>, arbA: Arbitrary<A>, EqS: Eq<S>, EqA: Eq<A>) =>
      new RuleSet(
        'Prism',
        [
          // [
          //   'prism partial round trip one way',
          //   forAll(arbS, laws.partialRoundTripOneWay)(EqS),
          // ],
          // [
          //   'prism round trip other way',
          //   forAll(arbA, laws.roundTripOtherWay)(Option.Eq(EqA)),
          // ],
        ],
        // { parent: self.optional(arbS, arbA, EqS, EqA) },
      ),
  };

  return self;
};
