// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eq } from '@fp4ts/cats-kernel';
import { Reader } from '@fp4ts/cats-mtl';
import { MonadSuite } from '@fp4ts/cats-laws';
import { MonadReaderSuite } from '@fp4ts/cats-mtl-laws';
import { checkAll, MiniInt } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';

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
        Reader.ask<{ a: number }>()
          .ask<{ b: string }>()
          .ask<{ c: null }>()
          .map(() => {})
          .runReader({ a: 42, b: '42', c: null }),
      ).toEqual(undefined);
    });
  });

  describe('provide', () => {
    it('should erase requirements from the environment', () => {
      expect(
        Reader.ask<number>()
          .map(x => x * 2)
          .provide(42)
          .runReader(undefined),
      ).toBe(84);
    });

    it('should scope environments when composing', () => {
      const fa = Reader.ask<number>()
        .map(x => x * 2)
        .provide(42);
      const fb = Reader.ask<string>()
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
        Reader.ask<{ a: number }>()
          .productR(Reader.ask<{ b: number }>().map(({ b }) => b))
          .runReader({ a: 42, b: 84 }),
      ).toBe(84);
    });
  });

  describe('Laws', () => {
    checkAll(
      'Reader<MiniInt, *>',
      MonadSuite(Reader.Monad<MiniInt>()).monad(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        X => A.fp4tsReader(X),
        <X>(X: Eq<X>): Eq<Reader<MiniInt, X>> =>
          Eq.by(eq.fn1Eq(ec.miniInt(), X), fa => r => fa.runReader(r)),
      ),
    );

    checkAll(
      'Local<Reader<MiniInt, *>, MiniInt>',
      MonadReaderSuite(Reader.MonadReader<MiniInt>()).local(
        fc.integer(),
        fc.integer(),
        A.fp4tsMiniInt(),
        Eq.primitive,
        Eq.primitive,
        MiniInt.Eq,
        X => A.fp4tsReader(X),
        <X>(X: Eq<X>): Eq<Reader<MiniInt, X>> =>
          Eq.by(eq.fn1Eq(ec.miniInt(), X), fa => r => fa.runReader(r)),
      ),
    );
  });
});
