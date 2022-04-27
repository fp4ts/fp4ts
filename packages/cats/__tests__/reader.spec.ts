// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Reader } from '@fp4ts/cats-core/lib/data';

describe('Reader', () => {
  describe('types', () => {
    it('should be contravariant in the first type argument', () => {
      const r1: Reader<unknown, number> = Reader.pure(10);
      const r: Reader<number, number> = r1;
    });

    it('should be covariant in the second type argument', () => {
      const r1: Reader<unknown, 1> = Reader.pure(1);
      const r: Reader<unknown, number> = r1;
    });
  });

  describe('read', () => {
    it('should pull value from the environment', () => {
      expect(
        Reader.pure(undefined)
          .ask<{ a: number }>()
          .map(({ a }) => a)
          .runReader({ a: 42 }),
      ).toEqual(42);
    });

    it('should widen environment as requirements accumulate', () => {
      expect(
        Reader.read<{ a: number }>()
          .ask<{ b: string }>()
          .ask<{ c: null }>()
          .void.runReader({ a: 42, b: '42', c: null }),
      ).toEqual(undefined);
    });
  });

  describe('provide', () => {
    it('should erase requirements from the environment', () => {
      expect(
        Reader.read<number>()
          .map(x => x * 2)
          .provide(42)
          .runReader(undefined),
      ).toBe(84);
    });

    it('should scope environments when composing', () => {
      const fa = Reader.read<number>()
        .map(x => x * 2)
        .provide(42);
      const fb = Reader.read<string>()
        .map(x => `${x} ${x}`)
        .provide('test');

      expect(
        fa.flatMap(a => fb.map(b => `${a} ${b}`)).runReader(undefined),
      ).toEqual('84 test test');
    });
  });

  describe('flatMap', () => {
    it('should widen the environment', () => {
      expect(
        Reader.read<{ a: number }>()
          ['>>>'](Reader.read<{ b: number }>().map(({ b }) => b))
          .runReader({ a: 42, b: 84 }),
      ).toBe(84);
    });
  });

  describe('monad', () => {
    it('should a pure value', () => {
      expect(Reader.pure(42).runReader(undefined)).toBe(42);
    });

    test('lest identity', () => {
      const h = (x: number): Reader<unknown, number> => Reader(x * 2);
      expect(Reader.pure(42).flatMap(h).runReader(undefined)).toEqual(
        h(42).runReader(undefined),
      );
    });

    test('right identity', () => {
      expect(Reader(42).flatMap(Reader.pure).runReader(undefined)).toEqual(
        Reader(42).runReader(undefined),
      );
    });

    test('associativity', () => {
      const h = (n: number): Reader<unknown, number> => Reader(n * 2);
      const g = (n: number): Reader<unknown, number> => Reader(n);
      const m = Reader(42);
      expect(m.flatMap(h).flatMap(g).runReader(undefined)).toEqual(
        m.flatMap(x => h(x).flatMap(g)).runReader(undefined),
      );
    });
  });
});
