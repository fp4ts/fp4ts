// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq, Either } from '@fp4ts/cats';
import { Spawn, Outcome } from '@fp4ts/effect-kernel';
import { exec, forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { SpawnLaws } from '../spawn-laws';
import { MonadCancelSuite } from './monad-cancel-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const SpawnSuite = <F, E>(F: Spawn<F, E>) => {
  const laws = SpawnLaws(F);

  const self = {
    ...MonadCancelSuite(F),

    spawn: <A, B, C, D>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbD: Arbitrary<D>,
      arbE: Arbitrary<E>,
      EqA: Eq<A>,
      EqB: Eq<B>,
      EqC: Eq<C>,
      EqD: Eq<D>,
      EqE: Eq<E>,
      EqOutcome: Eq<Outcome<F, E, A>>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(E: Eq<X>) => Eq<Kind<F, [X]>>,
    ): RuleSet =>
      new RuleSet(
        'spawn',
        [
          [
            'spawn race derives from race pair left',
            forAll(
              mkArbF(arbA),
              laws.raceDerivesFromRacePairLeft,
            )(mkEqF(Either.Eq(EqA, Eq.fromUniversalEquals()))),
          ],
          [
            'spawn race derives from race pair right',
            forAll(
              mkArbF(arbA),
              laws.raceDerivesFromRacePairRight,
            )(mkEqF(Either.Eq(Eq.fromUniversalEquals(), EqA))),
          ],
          [
            'spawn race canceled identity left',
            forAll(
              mkArbF(arbA),
              laws.raceCanceledIdentityLeft,
            )(mkEqF(Either.Eq(EqA, Eq.fromUniversalEquals()))),
          ],
          [
            'spawn race canceled identity right',
            forAll(
              mkArbF(arbA),
              laws.raceCanceledIdentityRight,
            )(mkEqF(Either.Eq(Eq.fromUniversalEquals(), EqA))),
          ],
          [
            'spawn race never non canceled identity left',
            forAll(
              mkArbF(arbA),
              laws.raceNeverNonCanceledIdentityLeft,
            )(mkEqF(Either.Eq(Eq.fromUniversalEquals(), EqA))),
          ],
          [
            'spawn race never non canceled identity right',
            forAll(
              mkArbF(arbA),
              laws.raceNeverNonCanceledIdentityRight,
            )(mkEqF(Either.Eq(EqA, Eq.fromUniversalEquals()))),
          ],
          [
            'fiber pure is outcome completed pure',
            forAll(
              arbA,
              laws.fiberPureIsOutcomeCompletedPure,
            )(mkEqF(EqOutcome)),
          ],
          [
            'fiber error is outcome errored',
            forAll(
              arbE,
              laws.fiberErrorIsOutcomeErrored,
            )(mkEqF(EqOutcome as any as Eq<Outcome<F, E, never>>)),
          ],
          [
            'fiber cancelation is outcome canceled',
            exec(laws.fiberCancelationIsOutcomeCanceled)(
              mkEqF(Outcome.Eq(EqE, mkEqF(Eq.fromUniversalEquals()))),
            ),
          ],
          [
            'fiber never is never',
            exec(laws.fiberNeverIsNever)(
              mkEqF(Outcome.Eq(EqE, mkEqF(Eq.fromUniversalEquals()))),
            ),
          ],
          [
            'fiber fork of never is unit',
            exec(laws.fiberNeverIsNever)(
              mkEqF(Outcome.Eq(EqE, mkEqF(Eq.fromUniversalEquals()))),
            ),
          ],
          [
            'fiber join is finalize',
            forAll(
              mkArbF(arbA),
              fc.func<[Outcome<F, E, A>], Kind<F, [void]>>(
                mkArbF(arbA).map(F.void),
              ),
              laws.fiberJoinIsFinalize,
            )(mkEqF(EqA)),
          ],
          [
            'never dominates over flatMap',
            forAll(mkArbF(arbA), laws.neverDominatesOverFlatMap)(mkEqF(EqA)),
          ],
          [
            'uncancelable race not inherited',
            exec(laws.uncancelableRaceNotInherited)(mkEqF(Eq.void)),
          ],
          [
            'uncancelable cancel cancels',
            exec(laws.uncancelableCancelCancels)(
              mkEqF(Outcome.Eq(EqE, mkEqF(Eq.fromUniversalEquals()))),
            ),
          ],
          [
            'uncancelable fork is cancelable',
            exec(laws.uncancelableForkIsCancelable)(
              mkEqF(Outcome.Eq(EqE, mkEqF(Eq.fromUniversalEquals()))),
            ),
          ],
        ],
        {
          parent: self.monadCancel(
            arbA,
            arbB,
            arbC,
            arbD,
            arbE,
            EqA,
            EqB,
            EqC,
            EqD,
            EqE,
            mkArbF,
            mkEqF,
          ),
        },
      ),
  };
  return self;
};
