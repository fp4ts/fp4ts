// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Eq, List, Option } from '@fp4ts/cats';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';
import { Traversal } from '@fp4ts/optics-core';

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
            'traversal head option',
            forAll(arbS, laws.headOption)(Option.Eq(EqA)),
          ],
          [
            'traversal modify getAll',
            forAll(
              arbS,
              fc.func<[A], A>(arbA),
              laws.modifyGetAll,
            )(List.Eq(EqA)),
          ],
          [
            'traversal consistent modify modify id',
            forAll(arbS, arbA, laws.consistentModifyModifyId)(EqS),
          ],
        ],
        { parent: self.setter(arbS, arbA, EqS, EqA) },
      ),
  };

  return self;
};
