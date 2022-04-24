// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Eq } from '@fp4ts/cats';
import { Setter } from '@fp4ts/optics-core/lib/profunctor';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { SetterLaws } from '../setter-laws';

export const SetterSuite = <S, A>(setter: Setter<S, A>) => {
  const laws = SetterLaws(setter);

  return {
    setter: (arbS: Arbitrary<S>, arbA: Arbitrary<A>, EqS: Eq<S>, EqA: Eq<A>) =>
      new RuleSet('Setter', [
        [
          'setter replace idempotent',
          forAll(arbS, arbA, laws.replaceIdempotent)(EqS),
        ],
        ['setter modify identity', forAll(arbS, laws.modifyIdentity)(EqS)],
        [
          'setter compose modify',
          forAll(
            arbS,
            fc.func<[A], A>(arbA),
            fc.func<[A], A>(arbA),
            laws.composeModify,
          )(EqS),
        ],
        [
          'setter consistent replace modify',
          forAll(arbS, arbA, laws.consistentReplaceModify)(EqS),
        ],
      ]),
  };
};
