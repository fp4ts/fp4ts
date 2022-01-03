// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { id, pipe, throwError } from '@fp4ts/core';
import { Eq, Either, Left, Right } from '@fp4ts/cats';
import { SyncIO } from '@fp4ts/effect-core';
import { SyncSuite } from '@fp4ts/effect-laws';
import { checkAll, forAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/effect-test-kit/lib/arbitraries';
import * as E from '@fp4ts/effect-test-kit/lib/eq';

describe('SyncIO', () => {
  describe('free monad', () => {
    it('should produce a pure value', () => {
      expect(SyncIO.pure(42).unsafeRunSync()).toBe(42);
    });

    it('should suspend a side effect without memoizing', () => {
      let i = 42;

      const ioa = SyncIO(() => i++);

      expect(ioa.unsafeRunSync()).toBe(42);
      expect(ioa.unsafeRunSync()).toBe(43);
      expect(ioa.unsafeRunSync()).toBe(44);
    });

    it('should sequence two effects', () => {
      let i: number = 0;

      const fa = pipe(
        SyncIO.pure(42).flatMap(i2 =>
          SyncIO(() => {
            i = i2;
          }),
        ),
      );

      expect(fa.unsafeRunSync()).toBe(undefined);
      expect(i).toBe(42);
    });

    it('should propagate out throwError', () => {
      expect(() =>
        SyncIO.throwError(new Error('test error'))
          .void.flatMap(() => SyncIO.pure(42))
          .unsafeRunSync(),
      ).toThrow(new Error('test error'));
    });
  });

  describe('error handling', () => {
    it('should map successful value', () => {
      expect(
        SyncIO(() => 42)
          .redeem(() => -1, id)
          .unsafeRunSync(),
      ).toBe(42);
    });

    test(
      'attempt is redeem with Left for recover and Right for map',
      forAll(A.fp4tsSyncIO(fc.integer()), io =>
        io.attempt['<=>'](io.redeem<Either<Error, number>>(Left, Right)),
      )(E.eqSyncIO(Either.Eq(Eq.Error.strict, Eq.primitive))),
    );

    test(
      'attempt is flattened redeemWith',
      forAll(
        A.fp4tsSyncIO(fc.integer()),
        fc.func<[Error], SyncIO<string>>(A.fp4tsSyncIO(fc.string())),
        fc.func<[number], SyncIO<string>>(A.fp4tsSyncIO(fc.string())),
        (io, recover, bind) =>
          io.attempt
            .flatMap(ea => ea.fold(recover, bind))
            ['<=>'](io.redeemWith(recover, bind)),
      )(E.eqSyncIO(Eq.primitive)),
    );

    test(
      'redeem is flattened redeemWith',
      forAll(
        A.fp4tsSyncIO(fc.integer()),
        fc.func<[Error], SyncIO<string>>(A.fp4tsSyncIO(fc.string())),
        fc.func<[number], SyncIO<string>>(A.fp4tsSyncIO(fc.string())),
        (io, recover, bind) =>
          io
            .redeem(recover, bind)
            .flatMap(id)
            ['<=>'](io.redeemWith(recover, bind)),
      )(E.eqSyncIO(Eq.primitive)),
    );

    test(
      'redeem subsumes handleError',
      forAll(
        A.fp4tsSyncIO(fc.integer()),
        fc.func<[Error], number>(fc.integer()),
        (io, recover) => io.redeem(recover, id)['<=>'](io.handleError(recover)),
      )(E.eqSyncIO(Eq.primitive)),
    );

    test(
      'redeemWith subsumes handleErrorWith',
      forAll(
        A.fp4tsSyncIO(fc.integer()),
        fc.func<[Error], SyncIO<number>>(A.fp4tsSyncIO(fc.integer())),
        (io, recover) =>
          io
            .redeemWith(recover, SyncIO.pure)
            ['<=>'](io.handleErrorWith(recover)),
      )(E.eqSyncIO(Eq.primitive)),
    );

    it('should recover from error', () => {
      expect(
        SyncIO(() => throwError(new Error('test error')))
          .map(() => 42)
          .handleErrorWith(() => SyncIO.pure(43))
          .unsafeRunSync(),
      ).toBe(43);
    });

    it('should map element', () => {
      expect(
        SyncIO(() => 42)
          .map(x => x * 2)
          .unsafeRunSync(),
      ).toBe(84);
    });

    it('should map element', () => {
      expect(
        SyncIO(() => 42)
          .map(x => x * 2)
          .flatMap(x => SyncIO(() => x + 1))
          .map(x => x + 2)
          .unsafeRunSync(),
      ).toBe(87);
    });

    it('should skip over the error failure when successful', () => {
      expect(
        SyncIO(() => 42)
          .handleErrorWith(() => SyncIO.pure(94))
          .map(x => x * 2)
          .unsafeRunSync(),
      ).toBe(84);
    });
  });

  const SyncTests = SyncSuite(SyncIO.Sync);
  checkAll(
    'Sync<SyncIO>',
    SyncTests.syncUncancelable(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      A.fp4tsSyncIO,
      E.eqSyncIO,
    ),
  );
});
