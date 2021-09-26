import fc, { Arbitrary } from 'fast-check';
import { AnyK, Kind } from '@cats4ts/core';
import { Eq } from '@cats4ts/cats-core';
import { forAll, RuleSet } from '@cats4ts/cats-test-kit';

import { MonadLaws } from '../monad-laws';
import { ApplicativeSuite } from './applicative-suite';
import { FlatMapSuite } from './flat-map-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const MonadSuite = <F extends AnyK>(laws: MonadLaws<F>) => {
  const self = {
    ...ApplicativeSuite(laws),
    ...FlatMapSuite(laws),

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
    ): RuleSet => {
      const {
        monadLeftIdentity,
        monadRightIdentity,
        kleisliLeftIdentity,
        kleisliRightIdentity,
        mapFlatMapCoherence,
        tailRecMStackSafety,
      } = laws;

      return new RuleSet(
        'monad',
        [
          [
            'monad left identity',
            forAll(
              arbA,
              fc.func<[A], Kind<F, [B]>>(arbFB),
              EqFB,
              monadLeftIdentity,
            ),
          ],
          ['monad right identity', forAll(arbFA, EqFA, monadRightIdentity)],
          [
            'monad kleisli left identity',
            forAll(
              arbA,
              fc.func<[A], Kind<F, [B]>>(arbFB),
              EqFB,
              kleisliLeftIdentity,
            ),
          ],
          [
            'monad kleisli right identity',
            forAll(
              arbA,
              fc.func<[A], Kind<F, [B]>>(arbFB),
              EqFB,
              kleisliRightIdentity,
            ),
          ],
          [
            'monad map coherence',
            forAll(
              arbFA,
              fc.func<[A], Kind<F, [B]>>(arbFB),
              EqFB,
              mapFlatMapCoherence,
            ),
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
              arbB,
              arbC,
              EqFA,
              EqFC,
            ),
          ],
        },
      );
    },

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
    ): RuleSet => {
      const {
        monadLeftIdentity,
        monadRightIdentity,
        kleisliLeftIdentity,
        kleisliRightIdentity,
        mapFlatMapCoherence,
      } = laws;

      return new RuleSet(
        'monad',
        [
          [
            'monad left identity',
            forAll(
              arbA,
              fc.func<[A], Kind<F, [B]>>(arbFB),
              EqFB,
              monadLeftIdentity,
            ),
          ],
          ['monad right identity', forAll(arbFA, EqFA, monadRightIdentity)],
          [
            'monad kleisli left identity',
            forAll(
              arbA,
              fc.func<[A], Kind<F, [B]>>(arbFB),
              EqFB,
              kleisliLeftIdentity,
            ),
          ],
          [
            'monad kleisli right identity',
            forAll(
              arbA,
              fc.func<[A], Kind<F, [B]>>(arbFB),
              EqFB,
              kleisliRightIdentity,
            ),
          ],
          [
            'monad map coherence',
            forAll(
              arbFA,
              fc.func<[A], Kind<F, [B]>>(arbFB),
              EqFB,
              mapFlatMapCoherence,
            ),
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
              arbB,
              arbC,
              EqFA,
              EqFC,
            ),
          ],
        },
      );
    },
  };
  return self;
};
