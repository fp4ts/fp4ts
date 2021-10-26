import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq, Either } from '@fp4ts/cats';
import { Spawn, Outcome } from '@fp4ts/effect-kernel';
import { exec, forAll, IsEq, RuleSet } from '@fp4ts/cats-test-kit';

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
            )(mkEqF(Either.Eq(EqA, Eq.never))),
          ],
          [
            'spawn race derives from race pair right',
            forAll(
              mkArbF(arbA),
              laws.raceDerivesFromRacePairRight,
            )(mkEqF(Either.Eq(Eq.never, EqA))),
          ],
          [
            'spawn race canceled identity left',
            forAll(
              mkArbF(arbA),
              laws.raceCanceledIdentityLeft,
            )(mkEqF(Either.Eq(EqA, Eq.never))),
          ],
          [
            'spawn race canceled identity right',
            forAll(
              mkArbF(arbA),
              laws.raceCanceledIdentityRight,
            )(mkEqF(Either.Eq(Eq.never, EqA))),
          ],
          [
            'spawn race never non canceled identity left',
            forAll(
              mkArbF(arbA),
              laws.raceNeverNonCanceledIdentityLeft,
            )(mkEqF(Either.Eq(EqA, Eq.never))),
          ],
          [
            'spawn race never non canceled identity right',
            forAll(
              mkArbF(arbA),
              laws.raceNeverNonCanceledIdentityRight,
            )(mkEqF(Either.Eq(Eq.never, EqA))),
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
            forAll(arbE, laws.fiberErrorIsOutcomeErrored)(mkEqF(EqOutcome)),
          ],
          [
            'fiber cancelation is outcome canceled',
            exec(laws.fiberCancelationIsOutcomeCanceled)(mkEqF(EqOutcome)),
          ],
          [
            'fiber never is never',
            exec(laws.fiberNeverIsNever)(mkEqF(Eq.never)),
          ],
          [
            'fiber fork of never is unit',
            exec(laws.fiberNeverIsNever)(mkEqF(Eq.never)),
          ],
          [
            'fiber join is finalize',
            forAll(
              mkArbF(arbA),
              fc.func<[Outcome<F, E, A>], Kind<F, [void]>>(
                mkArbF(arbA).map(F.void),
              ),
              laws.fiberJoinIsFinalize,
            )(mkEqF(Eq.void)),
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
            exec(laws.uncancelableCancelCancels)(mkEqF(Eq.void)),
          ],
          [
            'uncancelable fork is cancelable',
            exec(laws.uncancelableForkIsCancelable)(mkEqF(Eq.void)),
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
