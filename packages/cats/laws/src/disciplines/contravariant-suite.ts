// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Contravariant } from '@fp4ts/cats-core';
import { ExhaustiveCheck, forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { ContravariantLaws } from '../contravariant-laws';
import { InvariantSuite } from './invariant-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const ContravariantSuite = <F>(F: Contravariant<F>) => {
  const laws = ContravariantLaws(F);

  const self = {
    ...InvariantSuite(F),

    contravariant: <A, B, C>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      EcA: ExhaustiveCheck<A>,
      EcC: ExhaustiveCheck<C>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(E: ExhaustiveCheck<X>) => Eq<Kind<F, [X]>>,
    ): RuleSet =>
      new RuleSet(
        'contravariant',
        [
          [
            'contravariant identity',
            forAll(mkArbF(arbA), laws.contravariantIdentity)(mkEqF(EcA)),
          ],
          [
            'contravariant composition',
            forAll(
              mkArbF(arbA),
              fc.func<[B], A>(arbA),
              fc.func<[C], B>(arbB),
              laws.contravariantComposition,
            )(mkEqF(EcC)),
          ],
        ],
        // { parent: self.invariant(arbA, arbB, arbC, EqA, EqC, mkArbF, mkEqF) },
      ),
  };
  return self;
};
