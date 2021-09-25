import fc, { Arbitrary } from 'fast-check';
import { AnyK, Kind } from '@cats4ts/core';
import { Eq } from '@cats4ts/cats-core';
import { forAll, RuleSet } from '@cats4ts/cats-test-kit';

import { ApplicativeLaws } from '../applicative-laws';
import { ApplySuite } from './apply-suite';

export class ApplicativeSuite<
  F extends AnyK,
  L extends ApplicativeLaws<F>,
> extends ApplySuite<F, L> {
  public readonly applicative = <A, B, C>(
    arbFA: Arbitrary<Kind<F, [A]>>,
    arbFB: Arbitrary<Kind<F, [B]>>,
    arbFC: Arbitrary<Kind<F, [C]>>,
    arbFAtoB: Arbitrary<Kind<F, [(a: A) => B]>>,
    arbFBtoC: Arbitrary<Kind<F, [(b: B) => C]>>,
    arbA: Arbitrary<A>,
    arbB: Arbitrary<B>,
    arbC: Arbitrary<C>,
    EqFA: Eq<Kind<F, [A]>>,
    EqFB: Eq<Kind<F, [B]>>,
    EqFC: Eq<Kind<F, [C]>>,
  ): RuleSet => {
    const {
      applicativeIdentity,
      applicativeHomomorphism,
      applicativeInterchange,
      applicativeMap,
      apProductConsistent,
      applicativeUnit,
    } = this.laws;

    return new RuleSet(
      'applicative',
      [
        ['applicative identity', forAll(arbFA, EqFA, applicativeIdentity)],
        [
          'applicative homomorphism',
          forAll(arbA, fc.func<[A], B>(arbB), EqFB, applicativeHomomorphism),
        ],
        [
          'applicative interchange',
          forAll(arbA, arbFAtoB, EqFB, applicativeInterchange),
        ],
        [
          'applicative map',
          forAll(arbFA, fc.func<[A], B>(arbB), EqFB, applicativeMap),
        ],
        [
          'applicative ap/product consistent',
          forAll(arbFA, arbFAtoB, EqFB, apProductConsistent),
        ],
        ['applicative unit', forAll(arbA, EqFA, applicativeUnit)],
      ],
      {
        parent: this.apply(
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
      },
    );
  };
}
