// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Invariant } from '@fp4ts/cats-core';
import { InvariantLaws } from '../invariant-laws';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const InvariantSuite = <F>(F: Invariant<F>) => {
  const laws = InvariantLaws(F);

  return {
    invariant: <A, B, C>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      EqA: Eq<A>,
      EqC: Eq<C>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(E: Eq<X>) => Eq<Kind<F, [X]>>,
    ): RuleSet =>
      new RuleSet('invariant', [
        [
          'invariant identity',
          forAll(mkArbF(arbA), laws.invariantIdentity)(mkEqF(EqA)),
        ],
        [
          'invariant composition',
          forAll(
            mkArbF(arbA),
            fc.func<[A], B>(arbB),
            fc.func<[B], C>(arbC),
            fc.func<[B], A>(arbA),
            fc.func<[C], B>(arbB),
            laws.invariantComposition,
          )(mkEqF(EqC)),
        ],
      ]),
  };
};
