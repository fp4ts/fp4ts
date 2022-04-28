// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { snd, tupled } from '@fp4ts/core';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import { Either, Left } from '@fp4ts/cats-core/lib/data';
import { MonadErrorSuite, SemigroupKSuite } from '@fp4ts/cats-laws';
import { RWS } from '@fp4ts/cats-mtl';
import {
  MonadReaderSuite,
  MonadStateSuite,
  MonadWriterSuite,
} from '@fp4ts/cats-mtl-laws';
import { checkAll, MiniInt } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';

describe('RWS', () => {
  describe('handleErrorWith', () => {
    it('should recover from an error into success', () => {
      expect(
        RWS.throwError(new Error('test error'))
          .handleErrorWith(() => RWS.pure(42))
          .runA(),
      ).toBe(42);
    });

    it('should recover from an error into error', () => {
      expect(
        RWS.throwError(new Error('test error'))
          .handleErrorWith(() => RWS.throwError(new Error('test error 2')))
          .runEA(),
      ).toEqual(Left(new Error('test error 2')));
    });
  });

  describe('Laws', () => {
    checkAll(
      'SemigroupK<RWS<void, void, void, unknown, Error, *>>',
      SemigroupKSuite(RWS.SemigroupK<void, void, unknown, Error>()).semigroupK(
        fc.integer(),
        Eq.primitive,
        X => A.fp4tsRWS(A.fp4tsError(), X),
        <X>(X: Eq<X>): Eq<RWS<void, void, void, unknown, Error, X>> =>
          Eq.by(Either.Eq(Eq.Error.strict, X), p => p.runEA()),
      ),
    );

    checkAll(
      'MonadError<RWS<void, void, void, unknown, Error>, Error, *>',
      MonadErrorSuite(RWS.MonadError<void, void, unknown, Error>()).monadError(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        A.fp4tsError(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.Error.allEqual,
        X => A.fp4tsRWS(A.fp4tsError(), X),
        <X>(X: Eq<X>): Eq<RWS<void, void, void, unknown, Error, X>> =>
          Eq.by(Either.Eq(Eq.Error.strict, X), p => p.runEA()),
      ),
    );

    checkAll(
      'Local<RWS<void, void, void, MiniInt, Error, *>, MiniInt>',
      MonadReaderSuite(RWS.MonadReader<void, void, MiniInt, Error>()).local(
        fc.integer(),
        fc.integer(),
        A.fp4tsMiniInt(),
        Eq.primitive,
        Eq.primitive,
        MiniInt.Eq,
        X => A.fp4tsRWS(A.fp4tsError(), X),
        <X>(X: Eq<X>): Eq<RWS<void, void, void, MiniInt, Error, X>> =>
          Eq.by(
            eq.fn1Eq(ec.miniInt(), Either.Eq(Eq.Error.strict, X)),
            fa => r => fa.runAll(r, undefined)[1].map(snd),
          ),
      ),
    );

    checkAll(
      'Censor<RWS<string, void, void, unknown, Error, *>, string>',
      MonadWriterSuite(
        RWS.MonadWriter<string, void, void, Error>(Monoid.string),
      ).censor(
        fc.integer(),
        fc.string(),
        Eq.primitive,
        Eq.primitive,
        X => A.fp4tsRWS(A.fp4tsError(), X),
        <X>(X: Eq<X>): Eq<RWS<string, void, void, unknown, Error, X>> =>
          Eq.by(
            Eq.tuple(
              Eq.fromUniversalEquals<string>(),
              Either.Eq(Eq.Error.strict, X),
            ),
            fa => {
              const [w, ea] = fa.runAll(undefined, undefined);
              return tupled(
                w.foldLeft('', (a, b) => a + b),
                ea.map(snd),
              );
            },
          ),
      ),
    );

    checkAll(
      'MonadState<RWS<void, MiniInt, MiniInt, unknown, Error, *>, MiniInt>',
      MonadStateSuite(
        RWS.MonadState<void, MiniInt, unknown, Error>(),
      ).monadState(
        A.fp4tsMiniInt(),
        MiniInt.Eq,
        X => A.fp4tsRWS(A.fp4tsError(), X),
        <X>(X: Eq<X>): Eq<RWS<void, MiniInt, MiniInt, unknown, Error, X>> =>
          Eq.by(
            eq.fn1Eq(
              ec.miniInt(),
              Either.Eq(Eq.Error.strict, Eq.tuple2(MiniInt.Eq, X)),
            ),
            fa => s1 => fa.runAll(undefined, s1)[1],
          ),
      ),
    );
  });
});
