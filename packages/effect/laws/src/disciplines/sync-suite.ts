import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@cats4ts/core';
import { Eq } from '@cats4ts/cats';
import { Sync } from '@cats4ts/effect-kernel';
import { forAll, IsEq, RuleSet } from '@cats4ts/cats-test-kit';
import * as A from '@cats4ts/cats-test-kit/lib/arbitraries';

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
        'sync',
        [
          [
            'sync delayed value is pure',
            forAll(arbA, laws.delayedValueIsPure)(mkEqF(EqA)),
          ],
          [
            'sync delayed throw is throwError',
            forAll(
              A.cats4tsError(),
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
            self.monadCancel(
              arbA,
              arbB,
              arbC,
              arbD,
              A.cats4tsError(),
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
        'sync',
        [
          [
            'sync delayed value is pure',
            forAll(arbA, laws.delayedValueIsPure)(mkEqF(EqA)),
          ],
          [
            'sync delayed throw is throwError',
            forAll(
              A.cats4tsError(),
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
            self.monadCancelUncancelable(
              arbA,
              arbB,
              arbC,
              arbD,
              A.cats4tsError(),
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
