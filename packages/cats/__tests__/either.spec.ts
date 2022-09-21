// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { id, throwError } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Either, Right, Left, Some, None } from '@fp4ts/cats-core/lib/data';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import {
  SemigroupKSuite,
  MonadErrorSuite,
  BifunctorSuite,
} from '@fp4ts/cats-laws';
import { Eval } from '@fp4ts/cats-core';

describe('Either', () => {
  describe('type', () => {
    it('should be covariant in first parameters', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const ea: Either<number, number> = Right(42);
    });

    it('should be covariant in second parameter', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const ea: Either<number, number> = Left(42);
    });

    it('should disallow widening of unrelated type', () => {
      const ea: Either<number, never> = Left(42);
      // @ts-expect-error
      ea.flatMap(() => Left('error'));
    });

    it('should infer identity fold type', () => {
      const ea: Either<string, number> = Right(42);
      const ea2: Either<string, number> = ea.fold(Left, Right);
    });

    it('should widen the never type to number', () => {
      const ea: Either<string, never> = Left('nope');
      const ea2: Either<string, number> = ea['<|>'](() => Right(22));
    });
  });

  describe('constructors', () => {
    it('should create a right value', () => {
      expect(
        Right(42).fold(() => throwError(new Error('expected right')), id),
      ).toBe(42);
    });

    it('should create a left value', () => {
      expect(
        Left(42).fold(id, () => throwError(new Error('expected left'))),
      ).toBe(42);
    });

    it('should be equivalent to right', () => {
      expect(Either(42)).toEqual(Right(42));
    });

    test('right not to be empty', () => {
      expect(Right(42).nonEmpty).toBe(true);
    });

    test('left to be empty', () => {
      expect(Left(42).isEmpty).toBe(true);
    });
  });

  describe('map', () => {
    it('should transform right value', () => {
      expect(Right(42).map(x => x * 2)).toEqual(Right(84));
    });

    it('should preserve the left value', () => {
      expect(Left(42).map(x => x * 2)).toEqual(Left(42));
    });
  });

  describe('flatMap', () => {
    it('should transform right value', () => {
      expect(Right(42).flatMap(x => Right(x * 2))).toEqual(Right(84));
    });

    it('should preserve the left value', () => {
      expect(Left(42).flatMap(x => Right(x * 2))).toEqual(Left(42));
    });

    it('should override the new error', () => {
      expect(Right(42).flatMap(() => Left(-1))).toEqual(Left(-1));
    });
  });

  describe('flatten', () => {
    it('should flatten the right values', () => {
      expect(Right(Right(42)).flatten).toEqual(Right(42));
    });

    it('should flatten to left', () => {
      expect(Right(Left(42)).flatten).toEqual(Left(42));
    });
  });

  describe('tailRecM', () => {
    it('should return initial result when returned right', () => {
      expect(Either.tailRecM(42)(x => Right(Right(x)))).toEqual(Right(42));
    });

    it('should return left when computation returned left', () => {
      expect(Either.tailRecM(42)(x => Left('Error'))).toEqual(Left('Error'));
    });

    it('should compute recursive sum', () => {
      expect(
        Either.tailRecM<[number, number]>([0, 0])(([i, x]) =>
          i < 10 ? Right(Left([i + 1, x + i])) : Right(Right(x)),
        ),
      ).toEqual(Right(45));
    });

    it('should be stack safe', () => {
      const size = 100_000;

      expect(
        Either.tailRecM(0)(i =>
          i < size ? Right(Left(i + 1)) : Right(Right(i)),
        ),
      ).toEqual(Right(size));
    });
  });

  describe('toOption', () => {
    it('should convert right value to Some', () => {
      expect(Right(42).toOption).toEqual(Some(42));
    });

    it('should convert left value to None', () => {
      expect(Left(42).toOption).toEqual(None);
    });
  });

  it('should short-circuit on Left', () => {
    expect(
      Either.Apply<string>().map2Eval_(
        Left('left'),
        Eval.delay(() => throwError(new Error())),
      )(() => 42).value,
    ).toEqual(Left('left'));
  });

  describe('Laws', () => {
    const semigroupKTests = SemigroupKSuite(Either.SemigroupK<string>());
    checkAll(
      'SemigroupK<$<EitherK, [string]>>',
      semigroupKTests.semigroupK(
        A.fp4tsPrimitive(),
        Eq.fromUniversalEquals(),
        x => A.fp4tsEither(fc.string(), x),
        E => Either.Eq(Eq.fromUniversalEquals(), E),
      ),
    );

    const bifunctorTests = BifunctorSuite(Either.Bifunctor);
    checkAll(
      'Bifunctor<Either>',
      bifunctorTests.bifunctor(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        A.fp4tsEither,
        Either.Eq,
      ),
    );

    const tests = MonadErrorSuite(Either.MonadError<string>());
    checkAll(
      'Monad<Either<string, *>>',
      tests.monadError(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.string(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        x => A.fp4tsEither(fc.string(), x),
        E => Either.Eq(Eq.fromUniversalEquals(), E),
      ),
    );
  });
});
