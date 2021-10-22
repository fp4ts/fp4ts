import { Arbitrary } from 'fast-check';
import { Kind } from '@cats4ts/core';
import { Eq } from '@cats4ts/cats';
import { MonadErrorSuite } from '@cats4ts/cats-laws';
import { MonadCancel } from '@cats4ts/effect-kernel';
import { forAll, RuleSet, Rule, IsEq, exec } from '@cats4ts/cats-test-kit';

import { MonadCancelLaws } from '../monad-cancel-laws';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const MonadCancelSuite = <F, E>(F: MonadCancel<F, E>) => {
  const laws = MonadCancelLaws(F);

  const makeShared = <A>(
    arbFA: Arbitrary<Kind<F, [A]>>,
    EqA: Eq<A>,
    mkEqF: <X>(E: Eq<X>) => Eq<Kind<F, [X]>>,
  ): Rule[] => [
    [
      'monadCancel uncancelable-poll is identity',
      forAll(arbFA, laws.uncancelablePollIsIdentity)(mkEqF(EqA)),
    ],
    [
      'monadCancel uncancelable ignored poll eliminates nesting',
      forAll(arbFA, laws.uncancelableIgnoredPollEliminatesNesting)(mkEqF(EqA)),
    ],
    [
      'monadCancel uncancelable poll inverse nest is uncancelable',
      forAll(arbFA, laws.uncancelablePollInverseNestIsUncancelable)(mkEqF(EqA)),
    ],
    [
      'monadCancel uncancelable eliminates onCancel',
      forAll(
        arbFA,
        arbFA.map(F.void),
        laws.uncancelableEliminatesOnCancel,
      )(mkEqF(Eq.void)),
    ],
    [
      'monadCancel onCancel associates over uncancelable boundary',
      forAll(
        arbFA,
        arbFA.map(F.void),
        laws.onCancelAssociatesOverUncancelableBoundary,
      )(mkEqF(Eq.void)),
    ],
    [
      'monadCancel onCancel implies uncancelable',
      forAll(
        arbFA,
        arbFA.map(F.void),
        arbFA.map(F.void),
        laws.onCancelImpliesUncancelable,
      )(mkEqF(EqA)),
    ],
  ];

  const self = {
    ...MonadErrorSuite(F),

    monadCancel: <A, B, C, D>(
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
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(E: Eq<X>) => Eq<Kind<F, [X]>>,
    ): RuleSet =>
      new RuleSet(
        'monad cancel',
        [
          ...makeShared(mkArbF(arbA), EqA, mkEqF),
          [
            'monadCancel associates left over flatMap',
            forAll(
              mkArbF(arbA),
              laws.canceledAssociatesLeftOverFlatMap,
            )(mkEqF(EqA)),
          ],
        ],
        {
          parent: self.monadError(
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

    monadCancelUncancelable: <A, B, C, D>(
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
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(E: Eq<X>) => Eq<Kind<F, [X]>>,
    ): RuleSet =>
      new RuleSet(
        'monad cancel',
        [
          ...makeShared(mkArbF(arbA), EqA, mkEqF),
          [
            'monadCancel uncancelable is identity',
            forAll(mkArbF(arbA), laws.uncancelableIdentity)(mkEqF(EqA)),
          ],
          [
            'monadCancel canceled unit identity',
            exec(laws.canceledUnitIdentity)(mkEqF(Eq.primitive)),
          ],
        ],
        {
          parent: self.monadError(
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
