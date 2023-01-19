// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Ask } from '@fp4ts/cats-mtl';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';
import { AskLaws } from '../ask-laws';

export function AskSuite<F, R>(F: Ask<F, R>) {
  const laws = AskLaws(F);

  return {
    ask: <A>(
      arbA: Arbitrary<A>,
      eqA: Eq<A>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(arbX: Eq<X>) => Eq<Kind<F, [X]>>,
    ) =>
      new RuleSet('Ask', [
        [
          'ask adds no effects',
          forAll(mkArbF(arbA), laws.askAddsNoEffects)(mkEqF(eqA)),
        ],
        [
          'reader is ask and map',
          forAll(fc.func<[R], A>(arbA), laws.readerIsAskAndMap)(mkEqF(eqA)),
        ],
      ]),
  };
}
