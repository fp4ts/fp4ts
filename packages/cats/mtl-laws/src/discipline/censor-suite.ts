// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Censor } from '@fp4ts/cats-mtl';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';
import { CensorLaws } from '../censor-laws';
import { ListenSuite } from './listen-suite';

export function CensorSuite<F, W>(F: Censor<F, W>) {
  const laws = CensorLaws(F);

  const self = {
    ...ListenSuite(F),

    censor: <A>(
      arbA: Arbitrary<A>,
      arbW: Arbitrary<W>,
      eqA: Eq<A>,
      eqW: Eq<W>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(arbX: Eq<X>) => Eq<Kind<F, [X]>>,
    ) =>
      new RuleSet(
        'Censor',
        [
          [
            'tell right product homomorphism',
            forAll(
              arbW,
              arbW,
              laws.tellRightProductHomomorphism,
            )(mkEqF(Eq.fromUniversalEquals<void>())),
          ],
          [
            'tell left product homomorphism',
            forAll(
              arbW,
              arbW,
              laws.tellLeftProductHomomorphism,
            )(mkEqF(Eq.fromUniversalEquals<void>())),
          ],
          [
            'censor with pure is empty tell',
            forAll(
              arbA,
              fc.func<[W], W>(arbW),
              laws.censorWithPureIsEmptyTell,
            )(mkEqF(eqA)),
          ],
          [
            'clear is idempotent',
            forAll(mkArbF(arbA), laws.clearIsIdempotent)(mkEqF(eqA)),
          ],
          [
            'tell and clear is pure unit',
            forAll(
              arbW,
              laws.tellAndClearIsPureUnit,
            )(mkEqF(Eq.fromUniversalEquals())),
          ],
        ],
        { parent: self.listen(arbA, arbW, eqA, eqW, mkArbF, mkEqF) },
      ),
  };

  return self;
}
