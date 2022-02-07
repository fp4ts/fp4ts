// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Monad } from '@fp4ts/cats-core';
import { exec, forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { MonadLaws } from '../monad-laws';
import { ApplicativeSuite } from './applicative-suite';
import { FlatMapSuite } from './flat-map-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const MonadSuite = <F>(F: Monad<F>) => {
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
        'monad',
        [
          [
            'monad left identity',
            forAll(
              arbA,
              fc.func<[A], Kind<F, [B]>>(mkArbF(arbB)),
              monadLeftIdentity,
            )(mkEqF(EqB)),
          ],
          [
            'monad right identity',
            forAll(mkArbF(arbA), monadRightIdentity)(mkEqF(EqA)),
          ],
          [
            'monad kleisli left identity',
            forAll(
              arbA,
              fc.func<[A], Kind<F, [B]>>(mkArbF(arbB)),
              kleisliLeftIdentity,
            )(mkEqF(EqB)),
          ],
          [
            'monad kleisli right identity',
            forAll(
              arbA,
              fc.func<[A], Kind<F, [B]>>(mkArbF(arbB)),
              kleisliRightIdentity,
            )(mkEqF(EqB)),
          ],
          [
            'monad map coherence',
            forAll(
              mkArbF(arbA),
              fc.func<[A], B>(arbB),
              mapFlatMapCoherence,
            )(mkEqF(EqB)),
          ],
          [
            'monad tailRecM stack safety',
            exec(tailRecMStackSafety)(mkEqF(Eq.primitive)),
          ],
        ],
        {
          parents: [
            self.flatMap(
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
            self.applicative(arbA, arbB, arbC, EqA, EqB, EqC, mkArbF, mkEqF),
          ],
        },
      ),

    stackUnsafeMonad: <A, B, C, D>(
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
        'monad',
        [
          [
            'monad left identity',
            forAll(
              arbA,
              fc.func<[A], Kind<F, [B]>>(mkArbF(arbB)),
              monadLeftIdentity,
            )(mkEqF(EqB)),
          ],
          [
            'monad right identity',
            forAll(mkArbF(arbA), monadRightIdentity)(mkEqF(EqA)),
          ],
          [
            'monad kleisli left identity',
            forAll(
              arbA,
              fc.func<[A], Kind<F, [B]>>(mkArbF(arbB)),
              kleisliLeftIdentity,
            )(mkEqF(EqB)),
          ],
          [
            'monad kleisli right identity',
            forAll(
              arbA,
              fc.func<[A], Kind<F, [B]>>(mkArbF(arbB)),
              kleisliRightIdentity,
            )(mkEqF(EqB)),
          ],
          [
            'monad map coherence',
            forAll(
              mkArbF(arbA),
              fc.func<[A], B>(arbB),
              mapFlatMapCoherence,
            )(mkEqF(EqB)),
          ],
        ],
        {
          parents: [
            self.flatMap(
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
            self.applicative(arbA, arbB, arbC, EqA, EqB, EqC, mkArbF, mkEqF),
          ],
        },
      ),
  };
  return self;
};
