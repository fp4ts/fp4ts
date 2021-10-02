import fc, { Arbitrary } from 'fast-check';
import { AnyK, Kind } from '@cats4ts/core';
import { Eq } from '@cats4ts/cats';
import { forAll, RuleSet } from '@cats4ts/cats-test-kit';
import * as A from '@cats4ts/cats-test-kit/lib/arbitraries';
import { Sync } from '@cats4ts/effect-kernel';

import { SyncLaws } from '../sync-laws';
import { MonadCancelSuite } from './monad-cancel-suite';
import { ClockSuite } from './clock-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const SyncSuite = <F extends AnyK>(F: Sync<F>) => {
  const laws = SyncLaws(F);

  const self = {
    ...ClockSuite(F),
    ...MonadCancelSuite(F),

    sync: <A, B, C, D>(
      arbFA: Arbitrary<Kind<F, [A]>>,
      arbFB: Arbitrary<Kind<F, [B]>>,
      arbFC: Arbitrary<Kind<F, [C]>>,
      arbFD: Arbitrary<Kind<F, [D]>>,
      arbFAtoB: Arbitrary<Kind<F, [(a: A) => B]>>,
      arbFBtoC: Arbitrary<Kind<F, [(b: B) => C]>>,
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      EqFB: Eq<Kind<F, [B]>>,
      EqFC: Eq<Kind<F, [C]>>,
      EqFD: Eq<Kind<F, [D]>>,
      EqA: Eq<A>,
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
            self.monadCancel(
              arbFA,
              arbFB,
              arbFC,
              arbFD,
              arbFAtoB,
              arbFBtoC,
              arbA,
              arbB,
              arbC,
              A.cats4tsError(),
              EqFB,
              EqFC,
              EqFD,
              EqA,
              Eq.Error.strict,
              mkEqF,
            ),
          ],
        },
      ),

    syncUncancelable: <A, B, C, D>(
      arbFA: Arbitrary<Kind<F, [A]>>,
      arbFB: Arbitrary<Kind<F, [B]>>,
      arbFC: Arbitrary<Kind<F, [C]>>,
      arbFD: Arbitrary<Kind<F, [D]>>,
      arbFAtoB: Arbitrary<Kind<F, [(a: A) => B]>>,
      arbFBtoC: Arbitrary<Kind<F, [(b: B) => C]>>,
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      EqFB: Eq<Kind<F, [B]>>,
      EqFC: Eq<Kind<F, [C]>>,
      EqFD: Eq<Kind<F, [D]>>,
      EqA: Eq<A>,
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
              arbFA,
              arbFB,
              arbFC,
              arbFD,
              arbFAtoB,
              arbFBtoC,
              arbA,
              arbB,
              arbC,
              A.cats4tsError(),
              EqFB,
              EqFC,
              EqFD,
              EqA,
              Eq.Error.strict,
              mkEqF,
            ),
          ],
        },
      ),
  };
  return self;
};
