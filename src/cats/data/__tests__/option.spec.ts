import { Right, Left } from '../either';
import { Option, Some, None } from '../option';

describe('Option', () => {
  describe('type', () => {
    it('should be covariant', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  describe('or', () => {
    it('should return None when both are None', () => {
      expect(None.or(None)).toEqual(None);
    });

    it('should return lhs when both are Some', () => {
      expect(Some(42)['<|>'](Some(43))).toEqual(Some(42));
    });

    it('should return lhs when rhs is None', () => {
      expect(Some(42)['<|>'](None)).toEqual(Some(42));
    });

    it('should return rhs when lhs is None', () => {
      expect(None['<|>'](Some(43))).toEqual(Some(43));
    });
  });

  describe('orElse', () => {
    it('should return lhs when is Some', () => {
      expect(Some(42).orElse(() => 43)).toBe(42);
    });

    it('should return rhs when is None', () => {
      expect(None.orElse(() => 43)).toBe(43);
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

  describe('monad', () => {
    it('should a pure value', () => {
      expect(Option.pure(42)).toEqual(Some(42));
    });

    test('lest identity', () => {
      const h = (x: number): Option<number> => Option(x * 2);
      expect(Option.pure(42).flatMap(h)).toEqual(h(42));
    });

    test('right identity', () => {
      expect(Option(42).flatMap(Option.pure)).toEqual(Option(42));
    });

    test('associativity', () => {
      const h = (n: number): Option<number> => Option(n * 2);
      const g = (n: number): Option<number> => Option(n);
      const m = Option(42);
      expect(m.flatMap(h).flatMap(g)).toEqual(m.flatMap(x => h(x).flatMap(g)));
    });
  });
});
