import { Either, Left, State } from '@fp4ts/cats-core/lib/data';

describe('State', () => {
  describe('types', () => {
    it('should be covariant in second type parameter', () => {
      const s1: State<number, 1> = State.pure(1 as const);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const s: State<number, number> = s1;
    });
  });

  describe('state management', () => {
    it('should pull the state to a value', () => {
      expect(
        State.get<number>()
          .map(x => x + 1)
          .runState(42),
      ).toEqual([42, 43]);
    });

    it('should set state from a value', () => {
      expect(
        State.pure<number, number>(42)
          .flatMap(x => State.set(x))
          .runState(-1),
      ).toEqual([42, undefined]);
    });

    it('should update the state', () => {
      expect(State.update<number>(x => x + 1).runState(42)).toEqual([
        43,
        undefined,
      ]);
    });

    it('should update the state and return it', () => {
      expect(State.updateAndGet<number>(x => x + 1).runState(42)).toEqual([
        43, 43,
      ]);
    });

    it('should update the state and return a new value', () => {
      expect(
        State.modify<number, string>(x => [x + 1, 'test']).runState(42),
      ).toEqual([43, 'test']);
    });

    it('should update the state using previous value', () => {
      expect(
        State.pure<number, number>(42)
          .mapState((s, x) => [s + 1, `${s + x}`])
          .runState(42),
      ).toEqual([43, '84']);
    });

    it('should be stack safe', () => {
      const size = 10_000;
      const loop = (i: number): State<number, void> =>
        i < size
          ? State.update<number>(j => j + 1).get.flatMap(loop)
          : State.unit();

      expect(loop(0).runState(0)).toEqual([10_000, undefined]);
    });
  });

  describe('tailRecM', () => {
    it('should compute sum of all numbers by accessing the state', () => {
      expect(
        State.tailRecM(0)<number, void>(i =>
          i < 10
            ? State.get<number>()
                .flatMap(s => State.set(s + i))
                .map(() => Left(i + 1))
            : State.pure(Either.rightUnit),
        ).runState(0),
      ).toEqual([45, undefined]);
    });
  });

  describe('monad', () => {
    it('should a pure value', () => {
      expect(State.pure(42).runState(undefined)).toEqual([undefined, 42]);
    });

    test('lest identity', () => {
      const h = (x: number): State<unknown, number> => State.pure(x * 2);
      expect(State.pure(42).flatMap(h).runState(undefined)).toEqual(
        h(42).runState(undefined),
      );
    });

    test('right identity', () => {
      expect(State.pure(42).flatMap(State.pure).runState(undefined)).toEqual(
        State.pure(42).runState(undefined),
      );
    });

    test('associativity', () => {
      const h = (n: number): State<unknown, number> => State.pure(n * 2);
      const g = (n: number): State<unknown, number> => State.pure(n);
      const m = State.pure(42);
      expect(m.flatMap(h).flatMap(g).runState(undefined)).toEqual(
        m.flatMap(x => h(x).flatMap(g)).runState(undefined),
      );
    });
  });
});
