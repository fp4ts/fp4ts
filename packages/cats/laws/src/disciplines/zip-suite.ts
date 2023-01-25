// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Zip } from '@fp4ts/cats-core';
import { Eq } from '@fp4ts/cats-kernel';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';
import { ZipLaws } from '../zip-laws';
import { FunctorSuite } from './functor-suite';

export const ZipSuite = <F>(F: Zip<F>) => {
  const laws = ZipLaws(F);

  const self = {
    ...FunctorSuite(F),
    zip: <A, B, C, D>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbD: Arbitrary<D>,
      EqA: Eq<A>,
      EqB: Eq<B>,
      EqC: Eq<C>,
      EqD: Eq<D>,
      mkArbF: <X>(X: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(X: Eq<X>) => Eq<Kind<F, [X]>>,
    ): RuleSet =>
      new RuleSet(
        'Zip',
        [
          [
            'zip left identity',
            forAll(mkArbF(arbA), laws.zipLeftIdentity)(mkEqF(EqA)),
          ],
          [
            'zip right identity',
            forAll(mkArbF(arbA), laws.zipRightIdentity)(mkEqF(EqA)),
          ],
          [
            'zip commutativity',
            forAll(
              mkArbF(arbA),
              mkArbF(arbB),
              laws.zipCommutativity,
            )(mkEqF(Eq.tuple(EqA, EqB))),
          ],
          [
            'zip associativity',
            forAll(
              mkArbF(arbA),
              mkArbF(arbB),
              mkArbF(arbC),
              laws.zipAssociativity,
            )(mkEqF(Eq.tuple(Eq.tuple(EqA, EqB), EqC))),
          ],
          [
            'zip distributes',
            forAll(
              mkArbF(arbA),
              mkArbF(arbB),
              fc.func(arbC),
              fc.func(arbD),
              laws.zipDistributes,
            )(mkEqF(Eq.tuple(EqC, EqD))),
          ],
          [
            'zipWith consistent with zip . map',
            forAll(
              mkArbF(arbA),
              mkArbF(arbB),
              fc.func(arbC),
              laws.zipWithConsistentWithZipMap,
            )(mkEqF(EqC)),
          ],
          [
            'zipWith_(fa, fa, (a, _) => f(a)) is map_(fa, f)',
            forAll(
              mkArbF(arbA),
              fc.func(arbB),
              laws.zipWithFirstIsMap,
            )(mkEqF(EqB)),
          ],
          [
            'zipWith_(fa, fa, (_, a) => f(a)) is map_(fa, f)',
            forAll(
              mkArbF(arbA),
              fc.func(arbB),
              laws.zipWithSecondIsMap,
            )(mkEqF(EqB)),
          ],
        ],
        { parent: self.functor(arbA, arbB, arbC, EqA, EqC, mkArbF, mkEqF) },
      ),
  };
  return self;
};
