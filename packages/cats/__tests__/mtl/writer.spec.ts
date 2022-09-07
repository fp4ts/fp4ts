// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Monoid, Eq } from '@fp4ts/cats-kernel';
import { Array } from '@fp4ts/cats-core/lib/data';
import { Writer } from '@fp4ts/cats-mtl';
import { ComonadSuite, MonadSuite } from '@fp4ts/cats-laws';
import { MonadWriterSuite } from '@fp4ts/cats-mtl-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('Writer', () => {
  describe('cumulating results', () => {
    it('should be empty when lifting the pure value', () => {
      expect(Writer.pure(42).runWriter(Monoid.string)).toEqual([42, '']);
    });

    it('should concatenate two string', () => {
      expect(
        Writer.pure(42)
          .log('tell')
          .log(' ')
          .log('me')
          .log(' ')
          .log('more')
          .runWriterW(Monoid.string),
      ).toBe('tell me more');
    });

    it('should reset cumulated result', () => {
      expect(
        Writer.pure(42)
          .log('tell')
          .log(' ')
          .log('me')
          .log(' ')
          .log('more')
          .reset(Monoid.string)
          .runWriterW(Monoid.string),
      ).toBe('');
    });

    it('should combine output of two writers', () => {
      const lhs = Writer(['left side', 42]);
      const rhs = Writer([' right side', 42]);

      expect(lhs.product(rhs).runWriter(Monoid.string)).toEqual([
        [42, 42],
        'left side right side',
      ]);
    });

    it('should combine result of the flatMap', () => {
      expect(
        Writer([[1, 2, 3], 42])
          .flatMap(x => Writer([[4, 5, 6], x + 1]))
          .runWriter(Array.MonoidK().algebra()),
      ).toEqual([43, [1, 2, 3, 4, 5, 6]]);
    });
  });

  describe('Writer Laws', () => {
    // const bifunctorTests = BifunctorSuite(Writer.Bifunctor);
    // checkAll(
    //   'Bifunctor<Writer<string *>>',
    //   bifunctorTests.bifunctor(
    //     fc.string(),
    //     fc.integer(),
    //     fc.string(),
    //     fc.integer(),
    //     Eq.primitive,
    //     Eq.primitive,
    //     Eq.primitive,
    //     Eq.primitive,
    //     (arbX, arbY) => A.fp4tsWriter(fc.tuple(arbX, arbY)),
    //     (EX, EY) => Writer.Eq(Eq.tuple2(EX, EY)),
    //   ),
    // );

    checkAll(
      'Monad<Writer<string, *>>',
      MonadSuite(Writer.Monad<string>()).monad(
        fc.string(),
        fc.integer(),
        fc.string(),
        fc.integer(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        arbX => A.fp4tsWriter(fc.tuple(fc.string(), arbX)),
        <X>(E: Eq<X>): Eq<Writer<string, X>> =>
          Eq.by(Eq.tuple2(E, Eq.fromUniversalEquals<string>()), w =>
            w.runWriter(Monoid.string),
          ),
      ),
    );

    checkAll(
      'Comonad<Writer<string, *>>',
      ComonadSuite(Writer.Comonad<string>(Monoid.string)).comonad(
        fc.string(),
        fc.integer(),
        fc.string(),
        fc.string(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        arbX => A.fp4tsWriter(fc.tuple(fc.string(), arbX)),
        <X>(E: Eq<X>): Eq<Writer<string, X>> =>
          Eq.by(Eq.tuple2(E, Eq.fromUniversalEquals<string>()), w =>
            w.runWriter(Monoid.string),
          ),
        fc
          .func<[[string, string]], number>(fc.integer())
          .map(
            f => (w: Writer<string, string>) => f(w.runWriter(Monoid.string)),
          ),
        fc
          .func<[[number, string]], string>(fc.string())
          .map(
            f => (w: Writer<string, number>) => f(w.runWriter(Monoid.string)),
          ),
        fc
          .func<[[string, string]], string>(fc.string())
          .map(
            f => (w: Writer<string, string>) => f(w.runWriter(Monoid.string)),
          ),
      ),
    );

    checkAll(
      'Monad<Writer<string[], *>>',
      MonadSuite(Writer.Monad<string[]>()).monad(
        fc.string(),
        fc.integer(),
        fc.string(),
        fc.integer(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        arbX => A.fp4tsWriter(fc.tuple(fc.array(fc.string()), arbX)),
        <X>(E: Eq<X>): Eq<Writer<string[], X>> =>
          Eq.by(Eq.tuple2(E, Array.Eq(Eq.fromUniversalEquals<string>())), w =>
            w.runWriter(Array.MonoidK().algebra<string>()),
          ),
      ),
    );

    checkAll(
      'Censor<Writer<string, *>, string>>',
      MonadWriterSuite(Writer.MonadWriter<string>(Monoid.string)).censor(
        fc.integer(),
        fc.string(),
        Eq.primitive,
        Eq.primitive,
        arbX => A.fp4tsWriter(fc.tuple(fc.string(), arbX)),
        <X>(E: Eq<X>): Eq<Writer<string, X>> =>
          Eq.by(Eq.tuple2(E, Eq.primitive), w => w.runWriter(Monoid.string)),
      ),
    );
  });
});
