// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eq, CommutativeMonoid } from '@fp4ts/cats-kernel';
import { Eval } from '@fp4ts/cats-core';
import { Right, Left, Option, Some, None } from '@fp4ts/cats-core/lib/data';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

import {
  MonadSuite,
  AlternativeSuite,
  TraversableSuite,
  CoflatMapSuite,
  FunctorFilterSuite,
} from '@fp4ts/cats-laws';
import { throwError } from '@fp4ts/core';

describe('Option', () => {
  describe('type', () => {
    it('should be covariant', () => {
      const o: Option<number> = None;
    });
  });

  describe('constructors', () => {
    it('should create Some from the non-nullish value', () => {
      expect(Option(42)).toEqual(Some(42));
    });

    it('should create None null', () => {
      expect(Option(null)).toEqual(None);
    });

    it('should create None undefined', () => {
      expect(Option(undefined)).toEqual(None);
    });

    it('should create Some from Right', () => {
      expect(Option.fromEither(Right(42))).toEqual(Some(42));
    });

    it('should create None from Left', () => {
      expect(Option.fromEither(Left(42))).toEqual(None);
    });

    test('Some not to be empty', () => {
      expect(Some(42).nonEmpty).toBe(true);
    });

    test('None to be empty', () => {
      expect(None.isEmpty).toBe(true);
    });
  });

  describe('map', () => {
    it('should map the wrapped value', () => {
      expect(Some(42).map(x => x * 2)).toEqual(Some(84));
    });

    it('should ignore the None', () => {
      expect(None.map(x => x * 2)).toEqual(None);
    });
  });

  describe('orElse', () => {
    it('should return None when both are None', () => {
      expect(None.orElse(() => None)).toEqual(None);
    });

    it('should return lhs when both are Some', () => {
      expect(Some(42)['<|>'](() => Some(43))).toEqual(Some(42));
    });

    it('should return lhs when rhs is None', () => {
      expect(Some(42)['<|>'](() => None)).toEqual(Some(42));
    });

    it('should return rhs when lhs is None', () => {
      expect(None['<|>'](() => Some(43))).toEqual(Some(43));
    });
  });

  describe('getOrElse', () => {
    it('should return lhs when is Some', () => {
      expect(Some(42).getOrElse(() => 43)).toBe(42);
    });

    it('should return rhs when is None', () => {
      expect(None.getOrElse(() => 43)).toBe(43);
    });
  });

  describe('getOrNull', () => {
    it('should return value when is Some', () => {
      expect(Some(42).getOrNull()).toBe(42);
    });

    it('should return null when is None', () => {
      expect(None.getOrNull()).toBe(null);
    });
  });

  describe('getOrUndefined', () => {
    it('should return value when is Some', () => {
      expect(Some(42).getOrUndefined()).toBe(42);
    });

    it('should return null when is None', () => {
      expect(None.getOrUndefined()).toBe(undefined);
    });
  });

  describe('flatMap', () => {
    it('should map the wrapped value', () => {
      expect(Some(42).flatMap(x => Some(x * 2))).toEqual(Some(84));
    });

    it('should transform into None', () => {
      expect(Some(42).flatMap(() => None)).toEqual(None);
    });

    it('should ignore the None', () => {
      expect(None.flatMap(x => Some(x * 2))).toEqual(None);
    });
  });

  describe('flatten', () => {
    it('should flatten the nested value', () => {
      expect(Some(Some(42)).flatten).toEqual(Some(42));
    });

    it('should flatten to None', () => {
      expect(Some(None).flatten).toEqual(None);
    });
  });

  describe('tailRecM', () => {
    it('should return initial result when returned Some', () => {
      expect(Option.tailRecM(42)(x => Some(Right(x)))).toEqual(Some(42));
    });

    it('should return left when computation returned None', () => {
      expect(Option.tailRecM(42)(x => None)).toEqual(None);
    });

    it('should compute recursive sum', () => {
      expect(
        Option.tailRecM<[number, number]>([0, 0])(([i, x]) =>
          i < 10 ? Some(Left([i + 1, x + i])) : Some(Right(x)),
        ),
      ).toEqual(Some(45));
    });

    it('should be stack safe', () => {
      const size = 100_000;

      expect(
        Option.tailRecM(0)(i =>
          i < size ? Some(Left(i + 1)) : Some(Right(i)),
        ),
      ).toEqual(Some(size));
    });
  });

  it('should short-circuit on None', () => {
    expect(
      Option.Apply.map2Eval_(
        None,
        Eval.delay(() => throwError(new Error())),
      )(() => 42).value,
    ).toEqual(None);
  });

  describe('Laws', () => {
    const functorFilterTests = FunctorFilterSuite(Option.FunctorFilter);
    checkAll(
      'FunctorFilter<Option>',
      functorFilterTests.functorFilter(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        A.fp4tsOption,
        Option.Eq,
      ),
    );

    const alternativeTests = AlternativeSuite(Option.Alternative);
    checkAll(
      'Alternative<Option>',
      alternativeTests.alternative(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        A.fp4tsOption,
        Option.Eq,
      ),
    );

    const coflatMapTests = CoflatMapSuite(Option.CoflatMap);
    checkAll(
      'CoflatMap<Option>',
      coflatMapTests.coflatMap(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        A.fp4tsOption,
        Option.Eq,
      ),
    );

    const monadTests = MonadSuite(Option.Monad);
    checkAll(
      'Monad<Option>',
      monadTests.monad(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        A.fp4tsOption,
        Option.Eq,
      ),
    );

    const traversableTests = TraversableSuite(Option.Traversable);
    checkAll(
      'Traversable<Option>',
      traversableTests.traversable(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        CommutativeMonoid.addition,
        CommutativeMonoid.addition,
        Option.Functor,
        Eval.Applicative,
        Eval.Applicative,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        A.fp4tsOption,
        Option.Eq,
        A.fp4tsEval,
        Eval.Eq,
        A.fp4tsEval,
        Eval.Eq,
      ),
    );
  });
});
