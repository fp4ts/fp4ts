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

    comonad: <A, B, C>(
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
        'comonad',
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
              fc.func<[Kind<F, [A]>], B>(arbB),
              laws.comonadRightIdentity,
            )(EqB),
          ],
        ],
        {
          parent: self.coflatMap(
            arbA,
            arbB,
            arbC,
            EqA,
            EqB,
            EqC,
            mkArbF,
            mkEqF,
          ),
        },
      ),
  };

  return self;
};
