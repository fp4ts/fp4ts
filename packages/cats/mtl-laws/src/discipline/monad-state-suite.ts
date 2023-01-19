// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { MonadState } from '@fp4ts/cats-mtl';
import { MonadSuite } from '@fp4ts/cats-laws';
import { exec, forAll, RuleSet } from '@fp4ts/cats-test-kit';
import { MonadStateLaws } from '../monad-state-laws';

export function MonadStateSuite<F, S>(F: MonadState<F, S>) {
  const laws = MonadStateLaws(F);

  return {
    ...MonadSuite(F),
    monadState: (
      arbS: Arbitrary<S>,
      eqS: Eq<S>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(arbX: Eq<X>) => Eq<Kind<F, [X]>>,
    ) =>
      new RuleSet('MonadState', [
        [
          'get then set does nothing',
          exec(laws.getThenSetDoesNothing)(mkEqF(Eq.fromUniversalEquals())),
        ],
        [
          'set then get returns setted',
          forAll(arbS, laws.setThenGetReturnsSetted)(mkEqF(eqS)),
        ],
        ['get then get gets once', exec(laws.getThenGetGetsOnce)(mkEqF(eqS))],
        [
          'modify is get then set',
          forAll(
            fc.func<[S], S>(arbS),
            laws.modifyIsGetThenSet,
          )(mkEqF(Eq.fromUniversalEquals())),
        ],
      ]),
  };
}
