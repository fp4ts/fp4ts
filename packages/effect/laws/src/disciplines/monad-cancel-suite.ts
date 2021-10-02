import { Arbitrary } from 'fast-check';
import { AnyK, Kind } from '@cats4ts/core';
import { Eq } from '@cats4ts/cats';
import { MonadErrorSuite } from '@cats4ts/cats-laws';
import { forAll, RuleSet, Rule } from '@cats4ts/cats-test-kit';
import { MonadCancel } from '@cats4ts/effect-kernel';
import { MonadCancelLaws } from '../monad-cancel-laws';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const MonadCancelSuite = <F extends AnyK, E>(F: MonadCancel<F, E>) => {
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
      arbFA: Arbitrary<Kind<F, [A]>>,
      arbFB: Arbitrary<Kind<F, [B]>>,
      arbFC: Arbitrary<Kind<F, [C]>>,
      arbFD: Arbitrary<Kind<F, [D]>>,
      arbFAtoB: Arbitrary<Kind<F, [(a: A) => B]>>,
      arbFBtoC: Arbitrary<Kind<F, [(b: B) => C]>>,
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbE: Arbitrary<E>,
      EqFB: Eq<Kind<F, [B]>>,
      EqFC: Eq<Kind<F, [C]>>,
      EqFD: Eq<Kind<F, [D]>>,
      EqA: Eq<A>,
      EqE: Eq<E>,
      mkEqF: <X>(E: Eq<X>) => Eq<Kind<F, [X]>>,
    ): RuleSet =>
      new RuleSet(
        'monad cancel',
        [
          ...makeShared(arbFA, EqA, mkEqF),
          [
            'monadCancel associates left over flatMap',
            forAll(arbFA, laws.canceledAssociatesLeftOverFlatMap)(mkEqF(EqA)),
          ],
        ],
        {
          parent: self.monadError(
            arbFA,
            arbFB,
            arbFC,
            arbFD,
            arbFAtoB,
            arbFBtoC,
            arbA,
            arbB,
            arbC,
            arbE,
            EqFB,
            EqFC,
            EqFD,
            EqA,
            EqE,
            mkEqF,
          ),
        },
      ),

    monadCancelUncancelable: <A, B, C, D>(
      arbFA: Arbitrary<Kind<F, [A]>>,
      arbFB: Arbitrary<Kind<F, [B]>>,
      arbFC: Arbitrary<Kind<F, [C]>>,
      arbFD: Arbitrary<Kind<F, [D]>>,
      arbFAtoB: Arbitrary<Kind<F, [(a: A) => B]>>,
      arbFBtoC: Arbitrary<Kind<F, [(b: B) => C]>>,
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbE: Arbitrary<E>,
      EqFB: Eq<Kind<F, [B]>>,
      EqFC: Eq<Kind<F, [C]>>,
      EqFD: Eq<Kind<F, [D]>>,
      EqA: Eq<A>,
      EqE: Eq<E>,
      mkEqF: <X>(E: Eq<X>) => Eq<Kind<F, [X]>>,
    ): RuleSet =>
      new RuleSet(
        'monad cancel',
        [
          ...makeShared(arbFA, EqA, mkEqF),
          [
            'monadCancel uncancelable is identity',
            forAll(arbFA, laws.uncancelableIdentity)(mkEqF(EqA)),
          ],
          [
            'monadCancel canceled unit identity',
            () => {
              const { lhs, rhs } = laws.canceledUnitIdentity();
              expect(mkEqF(Eq.primitive).equals(lhs, rhs)).toBe(true);
            },
          ],
        ],
        {
          parent: self.monadError(
            arbFA,
            arbFB,
            arbFC,
            arbFD,
            arbFAtoB,
            arbFBtoC,
            arbA,
            arbB,
            arbC,
            arbE,
            EqFB,
            EqFC,
            EqFD,
            EqA,
            EqE,
            mkEqF,
          ),
        },
      ),
  };

  return self;
};
