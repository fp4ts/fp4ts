// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Tell } from '@fp4ts/cats-mtl';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';
import { TellLaws } from '../tell-laws';

export function TellSuite<F, W>(F: Tell<F, W>) {
  const laws = TellLaws(F);

  return {
    tell: <A>(
      arbA: Arbitrary<A>,
      arbW: Arbitrary<W>,
      eqA: Eq<A>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(arbX: Eq<X>) => Eq<Kind<F, [X]>>,
    ) =>
      new RuleSet('Tell', [
        [
          'writer is tell and map',
          forAll(arbA, arbW, laws.writerIsTellAndMap)(mkEqF(eqA)),
        ],
      ]),
  };
}
