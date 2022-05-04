// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Arbitrary } from 'fast-check';
import { Eq, Option } from '@fp4ts/cats';
import { Optional } from '@fp4ts/optics-core';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { OptionalLaws } from '../optional-laws';
import { TraversalSuite } from './traversal-suite';

export const OptionalSuite = <S, A>(optional: Optional<S, A>) => {
  const laws = OptionalLaws(optional);

  const self = {
    ...TraversalSuite(optional),

    optional: (
      arbS: Arbitrary<S>,
      arbA: Arbitrary<A>,
      EqS: Eq<S>,
      EqA: Eq<A>,
    ) =>
      new RuleSet(
        'Traversal',
        [
          [
            'optional getOption replace',
            forAll(arbS, laws.getOptionReplace)(EqS),
          ],
          [
            'optional replace getOption',
            forAll(arbS, arbA, laws.replaceGetOption)(Option.Eq(EqA)),
          ],
          // [
          //   'optional consistent getOption modify id',
          //   forAll(
          //     arbS,
          //     arbA,
          //     laws.consistentGetOptionModifyId,
          //   )(Option.Eq(EqA)),
          // ],
        ],
        { parent: self.traversal(arbS, arbA, EqS, EqA) },
      ),
  };

  return self;
};
