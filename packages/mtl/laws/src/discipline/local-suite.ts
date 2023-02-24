// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats';
import { Local } from '@fp4ts/mtl-core';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';
import { LocalLaws } from '../local-laws';
import { AskSuite } from './ask-suite';

export function LocalSuite<F, R>(F: Local<F, R>) {
  const laws = LocalLaws(F);

  const self = {
    ...AskSuite(F),

    local: <A, B>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbR: Arbitrary<R>,
      eqA: Eq<A>,
      eqB: Eq<B>,
      eqR: Eq<R>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(arbX: Eq<X>) => Eq<Kind<F, [X]>>,
    ) =>
      new RuleSet(
        'Local',
        [
          [
            'ask reflects local',
            forAll(fc.func<[R], R>(arbR), laws.askReflectsLocal)(mkEqF(eqR)),
          ],
          [
            'ask local pure is pure',
            forAll(
              arbA,
              fc.func<[R], R>(arbR),
              laws.localPureIsPure,
            )(mkEqF(eqA)),
          ],
          [
            'local distributes over ap',
            forAll(
              mkArbF(arbA),
              mkArbF(fc.func<[A], B>(arbB)),
              fc.func<[R], R>(arbR),
              laws.localDistributesOverAp,
            )(mkEqF(eqB)),
          ],
          [
            'scope is local . constant',
            forAll(mkArbF(arbA), arbR, laws.scopeIsLocalConst)(mkEqF(eqA)),
          ],
        ],
        { parent: self.ask(arbA, eqA, mkArbF, mkEqF) },
      ),
  };

  return self;
}
