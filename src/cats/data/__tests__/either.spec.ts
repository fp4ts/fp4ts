import { id } from '../../../fp/core';
import { Either } from '../either';

describe('Either', () => {
  const throwError = (e: Error) => {
    throw e;
  };

  describe('constructors', () => {
    it('should create a right value', () => {
      expect(
        Either.right(42).fold(
          () => throwError(new Error('expected right')),
          id,
        ),
      ).toBe(42);
    });

    it('should create a left value', () => {
      expect(
        Either.left(42).fold(id, () => throwError(new Error('expected left'))),
      ).toBe(42);
    });

    it('should be equivalent to right', () => {
      expect(Either(42)).toEqual(Either.right(42));
    });
  });

  describe('map', () => {
    it('should transform right value', () => {
      expect(Either.right(42).map(x => x * 2)).toEqual(Either.right(84));
    });

    it('should preserve the left value', () => {
      expect(Either.left(42).map(x => x * 2)).toEqual(Either.left(42));
    });
  });

  describe('flatMap', () => {
    it('should transform right value', () => {
      expect(Either.right(42).flatMap(x => Either.right(x * 2))).toEqual(
        Either.right(84),
      );
    });

    it('should preserve the left value', () => {
      expect(Either.left(42).flatMap(x => Either.right(x * 2))).toEqual(
        Either.left(42),
      );
    });

    it('should override the new error', () => {
      expect(Either.right(42).flatMap(() => Either.left(-1))).toEqual(
        Either.left(-1),
      );
    });
  });
});
