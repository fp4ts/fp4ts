// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Listen } from '@fp4ts/cats-mtl';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';
import { ListenLaws } from '../listen-laws';
import { TellSuite } from './tell-suite';

export function ListenSuite<F, W>(F: Listen<F, W>) {
  const laws = ListenLaws(F);

  const self = {
    ...TellSuite(F),

    listen: <A>(
      arbA: Arbitrary<A>,
      arbW: Arbitrary<W>,
      eqA: Eq<A>,
      eqW: Eq<W>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(arbX: Eq<X>) => Eq<Kind<F, [X]>>,
    ) =>
      new RuleSet(
        'Listen',
        [
          [
            'listen respects tell',
            forAll(
              arbW,
              laws.listenRespectsTell,
            )(mkEqF(Eq.tuple(Eq.fromUniversalEquals<void>(), eqW))),
          ],
          [
            'listen adds no effects',
            forAll(mkArbF(arbA), laws.listenAddsNoEffects)(mkEqF(eqA)),
          ],
        ],
        { parent: self.tell(arbA, arbW, eqA, mkArbF, mkEqF) },
      ),
  };

  return self;
}
