import { Identity } from '../identity';

describe('Identity', () => {
  describe('monad', () => {
    it('should a pure value', () => {
      expect(Identity.pure(42).get).toEqual(42);
    });

    test('lest identity', () => {
      const h = (x: number): Identity<number> => Identity(x * 2);
      expect(Identity.pure(42).flatMap(h)).toEqual(h(42));
    });

    test('right identity', () => {
      expect(Identity(42).flatMap(Identity.pure)).toEqual(Identity(42));
    });

    test('associativity', () => {
      const h = (n: number): Identity<number> => Identity(n * 2);
      const g = (n: number): Identity<number> => Identity(n);
      const m = Identity(42);
      expect(m.flatMap(h).flatMap(g)).toEqual(m.flatMap(x => h(x).flatMap(g)));
    });
  });
});
