import { Eval } from '@cats4ts/cats-core';
import { Memoize } from '@cats4ts/cats-core/lib/eval/algebra';

describe('Eval', () => {
  describe('memoization', () => {
    it('should not call memoized value more than once', () => {
      const fn = jest.fn();
      const e = Eval.later(fn).memoize;

      e.value;
      e.value;

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should memoize flat-mapped value', () => {
      const fn = jest.fn();
      const e1 = Eval.later(fn).memoize;
      const e = Eval.unit.flatMap(() => e1);

      e.value;
      e.value;

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('stack safety', () => {
    const size = 100_000;

    test('flatMap map recursion', () => {
      const loop = (i: number): Eval<number> =>
        i < size ? Eval.now(i + 1).flatMap(loop) : Eval.now(i);

      expect(loop(0).value).toBe(size);
    });

    test('flatMap self recursion', () => {
      let e = Eval.now(0);
      for (let i = 0; i < size; i++) {
        e = e.flatMap(x => Eval.now(x + 1));
      }

      expect(e.value).toBe(size);
    });

    test('defer', () => {
      let e = Eval.now(1);
      for (let i = 0; i < size; i++) {
        const temp = e;
        e = Eval.defer(() => temp.map(() => i + 1));
      }

      expect(e.value).toBe(size);
    });

    test('memoize', () => {
      let e = Eval.now(1);
      for (let i = 0; i < size; i++) {
        e = new Memoize(e);
      }

      expect(e.value).toBe(1);
    });
  });
});
