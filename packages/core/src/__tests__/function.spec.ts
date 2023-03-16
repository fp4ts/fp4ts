// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eval } from '../eval';
import { compose, flow, pipe, F0, F1, fix } from '../function';

describe('Function', () => {
  const add = (x: number) => x + 1;
  const append = (x: number) => (s: string) => `${s}${x}`;

  describe('compose', () => {
    const maxArgs = [...new Array(7).keys()].map(x => x + 1);

    maxArgs
      .map(count => [...new Array(count)].map(() => add))
      .forEach(fns =>
        it(`should compose ${fns.length} functions`, () =>
          expect((compose as any)(...fns)(1)).toBe(fns.length + 1)),
      );

    maxArgs
      .map(count => [...new Array(count).keys()].map(idx => append(idx)))
      .forEach(fns =>
        it(`should apply ${fns.length} functions in reversed order`, () =>
          expect((compose as any)(...fns)('')).toBe(
            [...new Array(fns.length).keys()].reverse().join(''),
          )),
      );
  });

  describe('flow', () => {
    const maxArgs = [...new Array(7).keys()].map(x => x + 1);
    maxArgs
      .map(count => [...new Array(count)].map(() => add))
      .forEach(fns =>
        it(`should flow ${fns.length} functions`, () =>
          expect((flow as any)(...fns)(1)).toBe(fns.length + 1)),
      );

    maxArgs
      .map(count => [...new Array(count).keys()].map(idx => append(idx)))
      .forEach(fns =>
        it(`should apply ${fns.length} functions in order`, () =>
          expect((flow as any)(...fns)('')).toBe(
            [...new Array(fns.length).keys()].join(''),
          )),
      );
  });

  describe('pipe', () => {
    const maxArgs = [...new Array(14).keys()].map(x => x + 1);
    maxArgs
      .map(count => [...new Array(count)].map(() => add))
      .forEach(fns =>
        it(`should pipe ${fns.length} functions`, () =>
          expect((pipe as any)(1, ...fns)).toBe(fns.length + 1)),
      );

    maxArgs
      .map(count => [...new Array(count).keys()].map(idx => append(idx)))
      .forEach(fns =>
        it(`should apply ${fns.length} functions in order`, () =>
          expect((pipe as any)('', ...fns)).toBe(
            [...new Array(fns.length).keys()].join(''),
          )),
      );
  });

  describe('Function0', () => {
    const SIZE = 100_000;
    it('should be stack safe under defer composition', () => {
      let cnt = 0;
      const f: () => number = F0.defer(() =>
        cnt >= SIZE ? () => cnt : (cnt++, f),
      );
      expect(f()).toBe(SIZE);
    });

    it('should be safe under map composition', () => {
      let f = () => 0;
      for (let i = 0; i < SIZE; i++) {
        f = F0.map(f, x => x + 1);
      }
      expect(f()).toBe(SIZE);
    });

    it('should be stack safe under flatMap composition', () => {
      const loop = (n: number): (() => number) =>
        n >= SIZE ? () => n : F0.flatMap(() => n + 1, loop);
      expect(loop(0)()).toBe(SIZE);
    });

    it('should be stack safe under mixed composition', () => {
      const loop = (n: number): (() => number) =>
        n >= SIZE
          ? () => n
          : F0.defer(() =>
              F0.flatMap(
                F0.map(
                  () => n,
                  x => x + 1,
                ),
                loop,
              ),
            );
      expect(loop(0)()).toBe(SIZE);
    });
  });

  describe('Function1', () => {
    const SIZE = 100_000;
    it('should be stack safe under defer composition', () => {
      let cnt = 0;
      const f: (_: unknown) => number = F1.defer(() =>
        cnt >= SIZE ? _ => cnt : (cnt++, f),
      );
      expect(f(null)).toBe(SIZE);
    });

    it('should be safe under andThen composition', () => {
      let f = (_: unknown) => 0;
      for (let i = 0; i < SIZE; i++) {
        f = F1.andThen(f, x => x + 1);
      }
      expect(f(null)).toBe(SIZE);
    });

    it('should be safe under compose composition', () => {
      let f = (x: number) => x;
      for (let i = 0; i < SIZE; i++) {
        f = F1.compose(f, x => x + 1);
      }
      expect(f(0)).toBe(SIZE);
    });

    it('should be stack safe under flatMap composition', () => {
      const loop = (n: number): ((_: unknown) => number) =>
        n >= SIZE ? _ => n : F1.flatMap(() => n + 1, loop);
      expect(loop(0)(null)).toBe(SIZE);
    });

    it('should be stack safe under mixed composition', () => {
      const loop = (n: number): ((_: unknown) => number) =>
        n >= SIZE
          ? () => n
          : F1.defer(() =>
              F1.flatMap(
                F1.andThen(
                  () => n,
                  x => x + 1,
                ),
                loop,
              ),
            );
      expect(loop(0)(null)).toBe(SIZE);
    });

    it('should locally change the scope', () => {
      const f = (x: string) => x;
      const g = F1.flatMap(
        F1.compose(f, (x: number) => `${x}`),
        x => y => [x, y],
      );

      expect(g(42)).toEqual(['42', 42]);
    });

    test('andThen(f, g) is compose(g, f)', () => {
      fc.assert(
        fc.property(
          fc.func(fc.integer()),
          fc.func(fc.integer()),
          fc.integer(),
          (f, g, x) => expect(F1.andThen(f, g)(x)).toBe(F1.compose(g, f)(x)),
        ),
      );
    });
  });

  describe('fix', () => {
    it('should calculate sum with pure result', () => {
      const sum = fix<(n: number) => number>(
        rec => (n: number) => n <= 1 ? 1 : n + rec.value(n - 1),
      );

      expect(sum(5000)).toBe(12502500);
    });

    it('should calculate sum with Eval-wrapped result', () => {
      const sumEval = fix<(n: number) => Eval<number>>(
        rec => (n: number) =>
          n <= 1 ? Eval.one : rec.flatMap(rec => rec(n - 1).map(m => m + n)),
      );

      expect(sumEval(1_000_000).value).toBe(500000500000);
    });
  });
});
