// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats';
import { Outcome, Async, ExecutionContext } from '@fp4ts/effect-kernel';
import { forAll, RuleSet } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/effect-test-kit/lib/arbitraries';
import * as E from '@fp4ts/effect-test-kit/lib/eq';
import * as AA from '@fp4ts/cats-test-kit/lib/arbitraries';

import { AsyncLaws } from '../async-laws';
import { TemporalSuite } from './temporal-suite';
import { SyncSuite } from './sync-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const AsyncSuite = <F>(F: Async<F>) => {
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
      mkEqF: <X>(E: Eq<X>) => Eq<Kind<F, [X]>>,
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
              AA.fp4tsError(),
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
              AA.fp4tsError(),
              mkArbF(fc.constant(undefined)),
              laws.asyncCancelIsUnsequencedOnThrow,
            )(mkEqF(Eq.never)),
          ],
          [
            'async execution context commutativity',
            forAll(
              mkArbF(arbA),
              laws.executionContextCommutativity,
            )(mkEqF(E.eqExecutionContext)),
          ],
          [
            'async executeOn local pure',
            forAll(
              A.fp4tsExecutionContext(ec),
              laws.executeOnLocalPure,
            )(mkEqF(E.eqExecutionContext)),
          ],
          [
            'async executeOn pure identity',
            forAll(
              arbA,
              A.fp4tsExecutionContext(ec),
              laws.executeOnPureIdentity,
            )(mkEqF(EqA)),
          ],
          [
            'async executeOn throwError',
            forAll(
              AA.fp4tsError(),
              A.fp4tsExecutionContext(ec),
              laws.executeOnThrowError,
            )(mkEqF(Eq.never)),
          ],
          [
            'async executeOn canceled identity',
            forAll(
              A.fp4tsExecutionContext(ec),
              laws.executeOnCanceledIdentity,
            )(mkEqF(Eq.void)),
          ],
          [
            'async executeOn never identity',
            forAll(
              A.fp4tsExecutionContext(ec),
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
              AA.fp4tsError(),
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
