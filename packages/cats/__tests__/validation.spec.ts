// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { id } from '@fp4ts/core';
import { Monad, Traversable } from '@fp4ts/cats-core';
import {
  Either,
  Option,
  Validation,
  ValidationError,
} from '@fp4ts/cats-core/lib/data';
import { Eq, Semigroup, CommutativeMonoid } from '@fp4ts/cats-kernel';
import {
  ApplicativeErrorSuite,
  BifunctorSuite,
  SemigroupKSuite,
  TraversableSuite,
} from '@fp4ts/cats-laws';
import { checkAll, forAll, IsEq } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('Validation', () => {
  describe('types', () => {
    it('should be covariant in result argument', () => {
      const v: Validation<string, number> = Validation.Valid<number, never>(42);
    });

    it('should be covariant in error argument', () => {
      const v: Validation<string, number> = Validation.fail<string, never>(
        '42',
      );
    });
  });

  describe('andThen', () => {
    it('should return mapped result', () => {
      expect(Validation.pure(42).andThen(x => Validation.pure(x + 1))).toEqual(
        Validation.pure(43),
      );
    });

    it('should return mapped failed result', () => {
      expect(Validation.pure(42).andThen(x => Validation.fail(x + 1))).toEqual(
        Validation.fail(43),
      );
    });

    it('should fail fast', () => {
      expect(
        Validation.fail('my error').andThen(() => Validation.pure(42)),
      ).toEqual(Validation.fail('my error'));
    });

    it('should fail fast', () => {
      expect(
        Validation.fail('my error').andThen(() => Validation.fail('42')),
      ).toEqual(Validation.fail('my error'));
    });
  });

  test(
    'fromOption toOption identity',
    forAll(
      A.fp4tsOption(fc.integer()),
      fc.string(),
      (o, s) => new IsEq(Validation.fromOption(o, () => s).toOption, o),
    )(Option.Eq(Eq.fromUniversalEquals())),
  );

  test(
    'fromEither toEither identity',
    forAll(
      A.fp4tsEither(fc.string(), fc.integer()),
      ea => new IsEq(Validation.fromEither(ea).toEither(Semigroup.string), ea),
    )(Either.Eq(Eq.fromUniversalEquals(), Eq.fromUniversalEquals())),
  );

  test(
    'product is valid only if both valid',
    forAll(
      A.fp4tsValidation(A.fp4tsValidationError(fc.string()), fc.integer()),
      A.fp4tsValidation(A.fp4tsValidationError(fc.string()), fc.integer()),
      (x, y) => x.product(y).isValid === (x.isValid && y.isValid),
    ),
  );

  test(
    'isValid consistency',
    forAll(
      A.fp4tsValidation(A.fp4tsValidationError(fc.string()), fc.integer()),
      x => x.isValid !== x.isInvalid,
    ),
  );

  test(
    'getOrDefault <-> orElse pure . get',
    forAll(
      A.fp4tsValidation(A.fp4tsValidationError(fc.string()), fc.integer()),
      fc.integer(),
      (v, x) =>
        v.getOrDefault(() => x) === v.orElse(() => Validation.pure(x)).get,
    ),
  );

  test(
    'mapError . getError . toArray <-> getError . toArray . map',
    forAll(
      A.fp4tsValidation(A.fp4tsValidationError(fc.string()), fc.integer()),
      fc.func<[string], string>(fc.string()),
      (v, f) =>
        new IsEq(
          v.mapError(f).fold(
            e => e.toArray,
            () => [],
          ),
          v
            .fold<string[]>(
              e => e.toArray,
              () => [],
            )
            .map(x => f(x)),
        ),
    )(Eq.Array(Eq.fromUniversalEquals())),
  );

  test(
    'mapN . id consistent with array sequence',
    forAll(
      A.fp4tsValidation(A.fp4tsValidationError(fc.string()), fc.integer()),
      fc.array(
        A.fp4tsValidation(A.fp4tsValidationError(fc.string()), fc.integer()),
      ),
      (hd, tl) =>
        new IsEq(
          hd.mapN(...tl)((...xs) => xs),
          Traversable.Array.sequence(Validation.Applicative<string>())([
            hd,
            ...tl,
          ]),
        ),
    )(
      Validation.EqK(
        ValidationError.Eq.Concat(
          Semigroup.string,
          Eq.fromUniversalEquals(),
        )<string>(id),
      ).liftEq(Eq.Array(Eq.fromUniversalEquals())),
    ),
  );

  describe('Laws', () => {
    const semigroupKTests = SemigroupKSuite(Validation.SemigroupK<string>());
    checkAll(
      'SemigroupK<Validation<E, *>>',
      semigroupKTests.semigroupK(
        fc.integer(),
        Eq.fromUniversalEquals(),
        arbX => A.fp4tsValidation(A.fp4tsValidationError(fc.string()), arbX),
        Validation.EqK<string>(
          ValidationError.Eq.Concat(
            Semigroup.string,
            Eq.fromUniversalEquals(),
          )(id),
        ).liftEq,
      ),
    );

    const bifunctorTests = BifunctorSuite(Validation.Bifunctor);
    checkAll(
      'Bifunctor<Validation>',
      bifunctorTests.bifunctor(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        (arbX, arbY) => A.fp4tsValidation(A.fp4tsValidationError(arbX), arbY),
        <X, Y>(EqX: Eq<X>, EqY: Eq<Y>) =>
          Validation.EqK<X>(Eq.by(Eq.Array(EqX), e => e.toArray)).liftEq(EqY),
      ),
    );

    const applicativeErrorTests = ApplicativeErrorSuite(
      Validation.ApplicativeError<string>(),
    );
    checkAll(
      'ApplicativeError<Validation<E, *>, ValidationError<E>>',
      applicativeErrorTests.applicativeError(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        A.fp4tsValidationError(fc.string()),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        ValidationError.Eq.Concat(
          Semigroup.string,
          Eq.fromUniversalEquals(),
        )(id),
        arbX => A.fp4tsValidation(A.fp4tsValidationError(fc.string()), arbX),
        Validation.EqK<string>(
          ValidationError.Eq.Concat(
            Semigroup.string,
            Eq.fromUniversalEquals(),
          )(id),
        ).liftEq,
      ),
    );
    const applicativeErrorConcatTests = ApplicativeErrorSuite(
      Validation.ApplicativeErrorConcat<string>(Semigroup.string),
    );
    checkAll(
      'ApplicativeError<Validation<E, *>, E>',
      applicativeErrorConcatTests.applicativeError(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.string(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        arbX => A.fp4tsValidation(A.fp4tsValidationError(fc.string()), arbX),
        Validation.EqK<string>(
          ValidationError.Eq.Concat(
            Semigroup.string,
            Eq.fromUniversalEquals(),
          )(id),
        ).liftEq,
      ),
    );

    const traversableTests = TraversableSuite(Validation.Traversable<string>());
    checkAll(
      'Traversable<Validation<E, *>, ValidationError<E>>',
      traversableTests.traversable(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        CommutativeMonoid.addition,
        CommutativeMonoid.addition,
        Validation.Functor<string>(),
        Monad.Eval,
        Option.Monad,
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        arbX => A.fp4tsValidation(A.fp4tsValidationError(fc.string()), arbX),
        Validation.EqK<string>(
          ValidationError.Eq.Concat(
            Semigroup.string,
            Eq.fromUniversalEquals(),
          )(id),
        ).liftEq,
        A.fp4tsEval,
        Eq.Eval,
        A.fp4tsOption,
        Option.Eq,
      ),
    );
  });
});
