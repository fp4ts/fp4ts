// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats';
import { Sync } from '@fp4ts/effect-kernel';
import { MonadDeferSuite } from '@fp4ts/cats-laws';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

import { SyncLaws } from '../sync-laws';
import { MonadCancelSuite } from './monad-cancel-suite';
import { ClockSuite } from './clock-suite';
import { UniqueSuite } from './unique-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const SyncSuite = <F>(F: Sync<F>) => {
  const laws = SyncLaws(F);

  const self = {
    ...UniqueSuite(F),
    ...ClockSuite(F),
    ...MonadDeferSuite(F),
    ...MonadCancelSuite(F),

    sync: <A, B, C, D>(
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
    ): RuleSet =>
      new RuleSet(
        'Sync',
        [
          [
            'sync delayed value is pure',
            forAll(arbA, laws.delayedValueIsPure)(mkEqF(EqA)),
          ],
          [
            'sync delayed throw is throwError',
            forAll(
              A.fp4tsError(),
              laws.delayedThrowIsThrowError,
            )(mkEqF(Eq.never)),
          ],
          [
            'sync unsequenced delay is noop',
            forAll(
              arbA,
              fc.func<[A], A>(arbA),
              laws.unsequencedDelayIsNoop,
            )(mkEqF(EqA)),
          ],
          [
            'sync repeated delay not memoized',
            forAll(
              arbA,
              fc.func<[A], A>(arbA),
              laws.repeatedDelayNotMemoized,
            )(mkEqF(EqA)),
          ],
        ],
        {
          parents: [
            self.unique(mkEqF),
            self.clock(mkEqF),
            self.monadDefer(
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
            ),
            self.monadCancel(
              arbA,
              arbB,
              arbC,
              arbD,
              A.fp4tsError(),
              EqA,
              EqB,
              EqC,
              EqD,
              Eq.Error.strict,
              mkArbF,
              mkEqF,
            ),
          ],
        },
      ),

    syncUncancelable: <A, B, C, D>(
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
    ): RuleSet =>
      new RuleSet(
        'Sync',
        [
          [
            'sync delayed value is pure',
            forAll(arbA, laws.delayedValueIsPure)(mkEqF(EqA)),
          ],
          [
            'sync delayed throw is throwError',
            forAll(
              A.fp4tsError(),
              laws.delayedThrowIsThrowError,
            )(mkEqF(Eq.never)),
          ],
          [
            'sync unsequenced delay is noop',
            forAll(
              arbA,
              fc.func<[A], A>(arbA),
              laws.unsequencedDelayIsNoop,
            )(mkEqF(EqA)),
          ],
          [
            'sync repeated delay not memoized',
            forAll(
              arbA,
              fc.func<[A], A>(arbA),
              laws.repeatedDelayNotMemoized,
            )(mkEqF(EqA)),
          ],
        ],
        {
          parents: [
            self.clock(mkEqF),
            self.monadDefer(
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
            ),
            self.monadCancelUncancelable(
              arbA,
              arbB,
              arbC,
              arbD,
              A.fp4tsError(),
              EqA,
              EqB,
              EqC,
              EqD,
              Eq.Error.strict,
              mkArbF,
              mkEqF,
            ),
          ],
        },
      ),
  };
  return self;
};
