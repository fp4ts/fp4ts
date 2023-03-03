// Copyright (c) 2021-2023 Peter Matta
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
        'Iso',
        [
          ['reverseGet get', forAll(arbS, laws.reverseGetGet)(EqS)],
          ['get reverseGet', forAll(arbA, laws.getReverseGet)(EqA)],
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
