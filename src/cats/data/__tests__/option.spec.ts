import { Right, Left } from '../either';
import { Option, Some, None } from '../option';

describe('option', () => {
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
  });

  describe('map', () => {
    it('should map the wrapped value', () => {
      expect(Some(42).map(x => x * 2)).toEqual(Some(84));
    });

    it('should ignore the None', () => {
      expect(None.map(x => x * 2)).toEqual(None);
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
});
