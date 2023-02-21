// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Traversable } from '@fp4ts/cats-core';
import { Mapping } from '@fp4ts/cats-profunctor';
import { ExhaustiveCheck, forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { MappingLaws } from '../mapping-laws';
import { TraversingSuite } from './traversing-laws';
import { ClosedSuite } from './closed-suite';

export const MappingSuite = <P>(P: Mapping<P>) => {
  const laws = MappingLaws(P);

  const self = {
    ...TraversingSuite(P),
    ...ClosedSuite(P),

    mapping: <F, A, B, C, D, B1, B2>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbD: Arbitrary<D>,
      arbB1: Arbitrary<B1>,
      arbB2: Arbitrary<B2>,
      EcA: ExhaustiveCheck<A>,
      EqB: Eq<B>,
      EqC: Eq<C>,
      EcC: ExhaustiveCheck<C>,
      EqD: Eq<D>,
      EcD: ExhaustiveCheck<D>,
      EqB2: Eq<B2>,
      F: Traversable<F>,
      mkArbP: <X, Y>(
        arbX: Arbitrary<X>,
        arbY: Arbitrary<Y>,
      ) => Arbitrary<Kind<P, [X, Y]>>,
      mkEqP: <X, Y>(EqX: ExhaustiveCheck<X>, EqY: Eq<Y>) => Eq<Kind<P, [X, Y]>>,
      mkEcF: <X>(arbX: ExhaustiveCheck<X>) => ExhaustiveCheck<Kind<F, [X]>>,
      mkEqF: <X>(arbX: Eq<X>) => Eq<Kind<F, [X]>>,
    ) =>
      new RuleSet(
        'Mapping',
        [
          [
            'mapping map rmap is rmap fmap(map)',
            forAll(
              fc.constant(F),
              mkArbP(arbA, arbB),
              fc.func(arbC),
              laws.mapRmapIsRmapFmapMap,
            )(mkEqP(mkEcF(EcA), mkEqF(EqC))),
          ],
          [
            'mapping map sequential composition',
            forAll(
              fc.constant(F),
              fc.constant(F),
              mkArbP(arbA, arbB),
              laws.mapSequentialComposition,
            )(mkEqP(mkEcF(mkEcF(EcA)), mkEqF(mkEqF(EqB)))),
          ],
          [
            'mapping map identity',
            forAll(mkArbP(arbA, arbB), laws.mapIdentity)(mkEqP(EcA, EqB)),
          ],
        ],
        {
          parents: [
            self.traversing(
              arbA,
              arbB,
              arbC,
              arbD,
              arbB1,
              arbB2,
              EcA,
              EqB,
              EqC,
              EcC,
              EqD,
              EcD,
              EqB2,
              F,
              mkArbP,
              mkEqP,
              mkEcF,
              mkEqF,
            ),
            self.closed(
              arbA,
              arbB,
              arbC,
              arbB1,
              arbB2,
              EcA,
              EqB,
              EcC,
              EcD,
              EqB2,
              mkArbP,
              mkEqP,
            ),
          ],
        },
      ),
  };

  return self;
};
