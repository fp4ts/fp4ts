// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Eq, List, Option } from '@fp4ts/cats';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';
import { Traversal } from '@fp4ts/optics-core';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

import { TraversalLaws } from '../traversal-laws';
import { SetterSuite } from './setter-suite';

export const TraversalSuite = <S, A>(traversal: Traversal<S, A>) => {
  const laws = TraversalLaws(traversal);

  const self = {
    ...SetterSuite(traversal),

    traversal: (
      arbS: Arbitrary<S>,
      arbA: Arbitrary<A>,
      EqS: Eq<S>,
      EqA: Eq<A>,
    ) =>
      new RuleSet(
        'Traversal',
        [
          [
            'traverse Option identity',
            forAll(arbS, laws.traversePureId(Option.Monad))(Option.Eq(EqS)),
          ],
          [
            'traverse List identity',
            forAll(arbS, laws.traversePureId(List.Monad))(List.Eq(EqS)),
          ],
          [
            'traversal composition',
            forAll(
              fc.func(A.fp4tsOption(arbA)),
              fc.func(A.fp4tsList(arbA, { maxLength: 2 })),
              arbS,
              laws.traversalComposition(Option.Monad, List.Monad),
            )(Option.Eq(List.Eq(EqS))),
          ],
        ],
        { parent: self.setter(arbS, arbA, EqS, EqA) },
      ),
  };

  return self;
};
