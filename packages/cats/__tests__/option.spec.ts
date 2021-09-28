import fc from 'fast-check';
import { PrimitiveType } from '@cats4ts/core';
import { Eq } from '@cats4ts/cats-core';
import { Right, Left, Option, Some, None } from '@cats4ts/cats-core/lib/data';
import { checkAll } from '@cats4ts/cats-test-kit';
import * as A from '@cats4ts/cats-test-kit/lib/arbitraries';

import { MonadSuite, AlternativeSuite } from '@cats4ts/cats-laws';

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

  const eqOptionPrimitive: Eq<Option<PrimitiveType>> = Option.Eq(Eq.primitive);

  const alternativeTests = AlternativeSuite(Option.Alternative);

  checkAll(
    'Alternative<OptionK>',
    alternativeTests.alternative(
      A.cats4tsOption(A.cats4tsPrimitive()),
      A.cats4tsOption(A.cats4tsPrimitive()),
      A.cats4tsOption(A.cats4tsPrimitive()),
      A.cats4tsOption(
        fc.func<[PrimitiveType], PrimitiveType>(A.cats4tsPrimitive()),
      ),
      A.cats4tsOption(
        fc.func<[PrimitiveType], PrimitiveType>(A.cats4tsPrimitive()),
      ),
      A.cats4tsPrimitive(),
      A.cats4tsPrimitive(),
      A.cats4tsPrimitive(),
      eqOptionPrimitive,
      eqOptionPrimitive,
      eqOptionPrimitive,
    ),
  );

  const tests = MonadSuite(Option.Monad);
  checkAll(
    'Monad<OptionK>',
    tests.monad(
      A.cats4tsOption(fc.integer()),
      A.cats4tsOption(fc.integer()),
      A.cats4tsOption(fc.integer()),
      A.cats4tsOption(fc.integer()),
      A.cats4tsOption(fc.func<[number], number>(fc.integer())),
      A.cats4tsOption(fc.func<[number], number>(fc.integer())),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      eqOptionPrimitive,
      eqOptionPrimitive,
      eqOptionPrimitive,
      eqOptionPrimitive,
    ),
  );
});
