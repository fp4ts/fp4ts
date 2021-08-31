import { id } from '../../../fp/core';
import { Either, Right, Left } from '../either';
import { Some, None } from '../option';

describe('Either', () => {
  const throwError = (e: Error) => {
    throw e;
  };

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

  describe('toOption', () => {
    it('should convert right value to Some', () => {
      expect(Right(42).toOption).toEqual(Some(42));
    });

    it('should convert left value to None', () => {
      expect(Left(42).toOption).toEqual(None);
    });
  });
});
