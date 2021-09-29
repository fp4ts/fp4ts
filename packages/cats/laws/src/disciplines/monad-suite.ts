import fc, { Arbitrary } from 'fast-check';
import { AnyK, Kind } from '@cats4ts/core';
import { Eq, Monad } from '@cats4ts/cats-core';
import { forAll, RuleSet } from '@cats4ts/cats-test-kit';

import { MonadLaws } from '../monad-laws';
import { ApplicativeSuite } from './applicative-suite';
import { FlatMapSuite } from './flat-map-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const MonadSuite = <F extends AnyK>(F: Monad<F>) => {
  const {
    monadLeftIdentity,
    monadRightIdentity,
    kleisliLeftIdentity,
    kleisliRightIdentity,
    mapFlatMapCoherence,
    tailRecMStackSafety,
  } = MonadLaws(F);
  const self = {
    ...ApplicativeSuite(F),
    ...FlatMapSuite(F),

    monad: <A, B, C, D>(
      arbFA: Arbitrary<Kind<F, [A]>>,
      arbFB: Arbitrary<Kind<F, [B]>>,
      arbFC: Arbitrary<Kind<F, [C]>>,
      arbFD: Arbitrary<Kind<F, [D]>>,
      arbFAtoB: Arbitrary<Kind<F, [(a: A) => B]>>,
      arbFBtoC: Arbitrary<Kind<F, [(b: B) => C]>>,
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      EqFA: Eq<Kind<F, [A]>>,
      EqFB: Eq<Kind<F, [B]>>,
      EqFC: Eq<Kind<F, [C]>>,
      EqFD: Eq<Kind<F, [D]>>,
    ): RuleSet =>
      new RuleSet(
        'monad',
        [
          [
            'monad left identity',
            forAll(
              arbA,
              fc.func<[A], Kind<F, [B]>>(arbFB),
              monadLeftIdentity,
            )(EqFB),
          ],
          ['monad right identity', forAll(arbFA, monadRightIdentity)(EqFA)],
          [
            'monad kleisli left identity',
            forAll(
              arbA,
              fc.func<[A], Kind<F, [B]>>(arbFB),
              kleisliLeftIdentity,
            )(EqFB),
          ],
          [
            'monad kleisli right identity',
            forAll(
              arbA,
              fc.func<[A], Kind<F, [B]>>(arbFB),
              kleisliRightIdentity,
            )(EqFB),
          ],
          [
            'monad map coherence',
            forAll(arbFA, fc.func<[A], B>(arbB), mapFlatMapCoherence)(EqFB),
          ],
          [
            'monad tailRecM stack safety',
            () => {
              const r = tailRecMStackSafety();
              expect(EqFA.equals(r.lhs, r.rhs)).toBe(true);
            },
          ],
        ],
        {
          parents: [
            self.flatMap(
              arbFA,
              arbFB,
              arbFC,
              arbFD,
              arbFAtoB,
              arbFBtoC,
              arbA,
              arbB,
              arbC,
              EqFA,
              EqFB,
              EqFC,
              EqFD,
            ),
            self.apply(
              arbFA,
              arbFB,
              arbFC,
              arbFAtoB,
              arbFBtoC,
              arbA,
              arbB,
              arbC,
              EqFA,
              EqFC,
            ),
          ],
        },
      ),

    stackUnsafeMonad: <A, B, C, D>(
      arbFA: Arbitrary<Kind<F, [A]>>,
      arbFB: Arbitrary<Kind<F, [B]>>,
      arbFC: Arbitrary<Kind<F, [C]>>,
      arbFD: Arbitrary<Kind<F, [D]>>,
      arbFAtoB: Arbitrary<Kind<F, [(a: A) => B]>>,
      arbFBtoC: Arbitrary<Kind<F, [(b: B) => C]>>,
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      EqFA: Eq<Kind<F, [A]>>,
      EqFB: Eq<Kind<F, [B]>>,
      EqFC: Eq<Kind<F, [C]>>,
      EqFD: Eq<Kind<F, [D]>>,
    ): RuleSet =>
      new RuleSet(
        'monad',
        [
          [
            'monad left identity',
            forAll(
              arbA,
              fc.func<[A], Kind<F, [B]>>(arbFB),
              monadLeftIdentity,
            )(EqFB),
          ],
          ['monad right identity', forAll(arbFA, monadRightIdentity)(EqFA)],
          [
            'monad kleisli left identity',
            forAll(
              arbA,
              fc.func<[A], Kind<F, [B]>>(arbFB),
              kleisliLeftIdentity,
            )(EqFB),
          ],
          [
            'monad kleisli right identity',
            forAll(
              arbA,
              fc.func<[A], Kind<F, [B]>>(arbFB),
              kleisliRightIdentity,
            )(EqFB),
          ],
          [
            'monad map coherence',
            forAll(arbFA, fc.func<[A], B>(arbB), mapFlatMapCoherence)(EqFB),
          ],
        ],
        {
          parents: [
            self.flatMap(
              arbFA,
              arbFB,
              arbFC,
              arbFD,
              arbFAtoB,
              arbFBtoC,
              arbA,
              arbB,
              arbC,
              EqFA,
              EqFB,
              EqFC,
              EqFD,
            ),
            self.apply(
              arbFA,
              arbFB,
              arbFC,
              arbFAtoB,
              arbFBtoC,
              arbA,
              arbB,
              arbC,
              EqFA,
              EqFC,
            ),
          ],
        },
      ),
  };
  return self;
};
