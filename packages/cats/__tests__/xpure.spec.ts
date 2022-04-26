// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eq } from '@fp4ts/cats-kernel';
import { Either, Left, XPure } from '@fp4ts/cats-core/lib/data';
import { MonadErrorSuite } from '@fp4ts/cats-laws';
import { MonadReader } from '@fp4ts/cats-mtl';
import { MonadReaderSuite } from '@fp4ts/cats-mtl-laws';
import { checkAll, MiniInt } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';

describe('XPure', () => {
  describe('handleErrorWith', () => {
    it('should recover from an error into success', () => {
      expect(
        XPure.throwError(new Error('test error'))
          .handleErrorWith(() => XPure(42))
          .runA(undefined, undefined),
      ).toBe(42);
    });

    it('should recover from an error into error', () => {
      expect(
        XPure.throwError(new Error('test error'))
          .handleErrorWith(() => XPure.throwError(new Error('test error 2')))
          .runEA(undefined, undefined),
      ).toEqual(Left(new Error('test error 2')));
    });
  });

  describe('Laws', () => {
    checkAll(
      'MonadError<XPure<void, void, void, unknown, Error>, Error>',
      MonadErrorSuite(
        XPure.MonadError<void, void, unknown, Error>(),
      ).monadError(
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
        X => A.fp4tsXPure(A.fp4tsError(), X),
        <X>(X: Eq<X>): Eq<XPure<void, void, void, unknown, Error, X>> =>
          Eq.by(Either.Eq(Eq.Error.strict, X), p =>
            p.runEA(undefined, undefined),
          ),
      ),
    );

    checkAll(
      'Local<XPure<void, void, void, MiniInt, Error>, MiniInt>',
      MonadReaderSuite(MonadReader.XPure<void, void, MiniInt, Error>()).local(
        fc.integer(),
        fc.integer(),
        A.fp4tsMiniInt(),
        Eq.primitive,
        Eq.primitive,
        MiniInt.Eq,
        X => A.fp4tsXPure(A.fp4tsError(), X),
        <X>(X: Eq<X>): Eq<XPure<void, void, void, MiniInt, Error, X>> =>
          Eq.by(
            eq.fn1Eq(ec.miniInt(), Either.Eq(Eq.Error.strict, X)),
            fa => r => fa.runEA(r, undefined),
          ),
      ),
    );
  });
});
