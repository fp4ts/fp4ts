import { Left, Right } from '../either';
import { Identity } from '../identity';

describe('Identity', () => {
  describe('tailRecM', () => {
    it('should return initial result when returned right', () => {
      expect(Identity.tailRecM(42)(x => Identity(Right(x)))).toEqual(
        Identity(42),
      );
    });

    it('should compute recursive sum', () => {
      expect(
        Identity.tailRecM<[number, number]>([0, 0])(([i, x]) =>
          i < 10 ? Identity(Left([i + 1, x + i])) : Identity(Right(x)),
        ),
      ).toEqual(Identity(45));
    });

    it('should be stack safe', () => {
      const size = 100_000;

      expect(
        Identity.tailRecM(0)(i =>
          i < size ? Identity(Left(i + 1)) : Identity(Right(i)),
        ),
      ).toEqual(Identity(size));
    });
  });

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
