// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Comonad } from '@fp4ts/cats-core';
import { Eq } from '@fp4ts/cats-kernel';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';
import { ComonadLaws } from '../comonad-laws';
import { CoflatMapSuite } from './coflat-map-suite';

export const ComonadSuite = <F>(F: Comonad<F>) => {
  const laws = ComonadLaws(F);

  const self = {
    ...CoflatMapSuite(F),

    comonad: <A, B, C, D>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbD: Arbitrary<D>,
      EqA: Eq<A>,
      EqB: Eq<B>,
      EqC: Eq<C>,
      EqD: Eq<D>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(E: Eq<X>) => Eq<Kind<F, [X]>>,
      // in case internal representation can differ for the same values
      arbFAtoB?: Arbitrary<(fa: Kind<F, [A]>) => B>,
      arbFBtoC?: Arbitrary<(fb: Kind<F, [B]>) => C>,
      arbFCtoD?: Arbitrary<(fb: Kind<F, [C]>) => D>,
    ): RuleSet =>
      new RuleSet(
        'Comonad',
        [
          [
            'comonad extract coflatten identity',
            forAll(mkArbF(arbA), laws.extractCoflattenIdentity)(mkEqF(EqA)),
          ],
          [
            'comonad map coflatten identity',
            forAll(mkArbF(arbA), laws.mapCoflattenIdentity)(mkEqF(EqA)),
          ],
          [
            'comonad left identity',
            forAll(mkArbF(arbA), laws.comonadLeftIdentity)(mkEqF(EqA)),
          ],
          [
            'comonad right identity',
            forAll(
              mkArbF(arbA),
              arbFAtoB ?? fc.func<[Kind<F, [A]>], B>(arbB),
              laws.comonadRightIdentity,
            )(EqB),
          ],
          [
            'cokleisli left identity',
            forAll(
              mkArbF(arbA),
              arbFAtoB ?? fc.func<[Kind<F, [A]>], B>(arbB),
              laws.cokleisliLeftIdentity,
            )(EqB),
          ],
          [
            'cokleisli right identity',
            forAll(
              mkArbF(arbA),
              arbFAtoB ?? fc.func<[Kind<F, [A]>], B>(arbB),
              laws.cokleisliRightIdentity,
            )(EqB),
          ],
        ],
        {
          parent: self.coflatMap(
            arbA,
            arbB,
            arbC,
            arbD,
            EqA,
            EqB,
            EqC,
            EqD,
            mkArbF,
            mkEqF,
            arbFAtoB,
            arbFBtoC,
            arbFCtoD,
          ),
        },
      ),
  };

  return self;
};
