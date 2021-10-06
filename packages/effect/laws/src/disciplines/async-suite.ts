import fc, { Arbitrary } from 'fast-check';
import { AnyK, Kind } from '@cats4ts/core';
import { Eq } from '@cats4ts/cats';
import { Outcome, Async, ExecutionContext } from '@cats4ts/effect-kernel';
import { forAll, IsEq, RuleSet } from '@cats4ts/cats-test-kit';
import * as A from '@cats4ts/effect-test-kit/lib/arbitraries';
import * as E from '@cats4ts/effect-test-kit/lib/eq';
import * as AA from '@cats4ts/cats-test-kit/lib/arbitraries';

import { AsyncLaws } from '../async-laws';
import { TemporalSuite } from './temporal-suite';
import { SyncSuite } from './sync-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const AsyncSuite = <F extends AnyK>(F: Async<F>) => {
  const laws = AsyncLaws(F);

  const self = {
    ...TemporalSuite(F),
    ...SyncSuite(F),

    async: <A, B, C, D>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbD: Arbitrary<D>,
      ec: ExecutionContext,
      EqA: Eq<A>,
      EqB: Eq<B>,
      EqC: Eq<C>,
      EqD: Eq<D>,
      EqOutcome: Eq<Outcome<F, Error, A>>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(
        E: Eq<X>,
      ) => Eq<Kind<F, [X]>> | ((r: IsEq<Kind<F, [X]>>) => Promise<boolean>),
    ): RuleSet =>
      new RuleSet(
        'async',
        [
          [
            'async right is uncancelable sequenced pure',
            forAll(
              arbA,
              mkArbF(fc.constant(undefined)),
              laws.asyncRightIsUncancelableSequencedPure,
            )(mkEqF(EqA)),
          ],
          [
            'async left is uncancelable sequenced throwError',
            forAll(
              AA.cats4tsError(),
              mkArbF(fc.constant(undefined)),
              laws.asyncLeftIsUncancelableSequencedThrowError,
            )(mkEqF(Eq.never)),
          ],
          [
            'async repeated callback is ignored',
            forAll(arbA, laws.asyncRepeatedCallbackIgnored)(mkEqF(EqA)),
          ],
          [
            'async cancel is un-sequenced on completion',
            forAll(
              arbA,
              mkArbF(fc.constant(undefined)),
              laws.asyncCancelIsUnsequencedOnCompletion,
            )(mkEqF(EqA)),
          ],
          [
            'async cancel is un-sequenced on throw',
            forAll(
              AA.cats4tsError(),
              mkArbF(fc.constant(undefined)),
              laws.asyncCancelIsUnsequencedOnThrow,
            )(mkEqF(Eq.never)),
          ],
          [
            'async execution context commutativity',
            forAll(
              mkArbF(arbA),
              laws.executionContextCommutativity,
            )(mkEqF(EqA)),
          ],
          [
            'async executeOn local pure',
            forAll(
              A.cats4tsExecutionContext(ec),
              laws.executeOnLocalPure,
            )(mkEqF(E.eqExecutionContext)),
          ],
          [
            'async executeOn pure identity',
            forAll(
              arbA,
              A.cats4tsExecutionContext(ec),
              laws.executeOnPureIdentity,
            )(mkEqF(EqA)),
          ],
          [
            'async executeOn throwError',
            forAll(
              AA.cats4tsError(),
              A.cats4tsExecutionContext(ec),
              laws.executeOnThrowError,
            )(mkEqF(Eq.never)),
          ],
          [
            'async executeOn canceled identity',
            forAll(
              A.cats4tsExecutionContext(ec),
              laws.executeOnCanceledIdentity,
            )(mkEqF(Eq.void)),
          ],
          [
            'async executeOn never identity',
            forAll(
              A.cats4tsExecutionContext(ec),
              laws.executeOnNeverIdentity,
            )(mkEqF(Eq.never)),
          ],
        ],
        {
          parents: [
            self.temporal(
              arbA,
              arbB,
              arbC,
              arbD,
              AA.cats4tsError(),
              EqA,
              EqB,
              EqC,
              EqD,
              Eq.Error.strict,
              EqOutcome,
              mkArbF,
              mkEqF,
            ),
            self.sync(
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
          ],
        },
      ),
  };
  return self;
};
