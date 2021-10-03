import fc from 'fast-check';
import { Eq, Eval } from '@cats4ts/cats-core';
import { Memoize } from '@cats4ts/cats-core/lib/eval/algebra';
import { checkAll } from '@cats4ts/cats-test-kit';
import * as A from '@cats4ts/cats-test-kit/lib/arbitraries';
import { DeferSuite, MonadSuite } from '@cats4ts/cats-laws';

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

  const deferTests = DeferSuite(Eval.Defer);
  checkAll(
    'Defer<Eval>',
    deferTests.defer(fc.integer(), Eq.primitive, A.cats4tsEval, Eval.Eq),
  );

  const tests = MonadSuite(Eval.Monad);
  checkAll(
    'Monad<Eval>',
    tests.monad(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      A.cats4tsEval,
      Eval.Eq,
    ),
  );
});
