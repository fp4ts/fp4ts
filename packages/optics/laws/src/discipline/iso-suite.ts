// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Arbitrary } from 'fast-check';
import { Eq } from '@fp4ts/cats';
import { Iso } from '@fp4ts/optics-core';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { IsoLaws } from '../iso-laws';
import { LensSuite } from './lens-suite';
import { PrismSuite } from './prism-suite';

export const IsoSuite = <S, A>(iso: Iso<S, A>) => {
  const laws = IsoLaws(iso);

  const self = {
    ...LensSuite(iso),
    ...PrismSuite(iso),

    iso: (arbS: Arbitrary<S>, arbA: Arbitrary<A>, EqS: Eq<S>, EqA: Eq<A>) =>
      new RuleSet(
        'ISO',
        [
          // ['iso round trip one way', forAll(arbS, laws.roundTripOneWay)(EqS)],
          // [
          //   'iso round trip other way',
          //   forAll(arbA, laws.roundTripOtherWay)(EqA),
          // ],
          // [
          //   'iso consistent modify modify id',
          //   forAll(arbS, arbA, laws.consistentModifyModifyId)(EqS),
          // ],
        ],
        {
          parents: [
            self.lens(arbS, arbA, EqS, EqA),
            self.prism(arbS, arbA, EqS, EqA),
          ],
        },
      ),
  };

  return self;
};
