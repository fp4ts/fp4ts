// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Distributive } from '@fp4ts/cats-core';
import { Identity, IdentityF } from '@fp4ts/cats-core/lib/data';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';
import { FunctorSuite } from './functor-suite';
import { DistributiveLaws } from '../distributive-laws';

export function DistributiveSuite<F>(F: Distributive<F>) {
  const laws = DistributiveLaws(F);

  const self = {
    ...FunctorSuite(F),

    distributive: <A, B, C>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      EqA: Eq<A>,
      EqB: Eq<B>,
      EqC: Eq<C>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(E: Eq<X>) => Eq<Kind<F, [X]>>,
    ): RuleSet =>
      new RuleSet(
        'Distributive',
        [
          [
            'distributive identity',
            forAll(
              mkArbF(arbA),
              fc.func<[A], B>(arbB),
              laws.distributiveIdentity,
            )(mkEqF(EqB)),
          ],
          [
            'consequence identity',
            forAll(mkArbF(arbA), laws.consequenceIdentity)(mkEqF(EqA)),
          ],
          [
            'consequence twice is id',
            forAll(
              mkArbF(arbA),
              laws.consequenceTwiceIsId<IdentityF>(Identity.Distributive),
            )(mkEqF(EqA)),
          ],
        ],
        { parent: self.functor(arbA, arbB, arbC, EqA, EqC, mkArbF, mkEqF) },
      ),
  };

  return self;
}
