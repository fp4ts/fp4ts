// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Eq, CommutativeMonoid, Monoid } from '@fp4ts/cats-kernel';
import { IxRWS, RWS } from '@fp4ts/cats-mtl';
import { MonadSuite, StrongSuite } from '@fp4ts/cats-laws';
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
  checkAll(
    'Monad<RWS<boolean, string, MiniInt, *>>',
    MonadSuite(RWS.Monad<boolean, string, MiniInt>()).monad(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      <X>(X: Arbitrary<X>) =>
        A.fp4tsRWS(
          fc.func<[boolean, MiniInt], [X, MiniInt, string]>(
            fc.tuple(X, A.fp4tsMiniInt(), fc.string()),
          ),
        ),
      <X>(X: Eq<X>): Eq<RWS<boolean, string, MiniInt, X>> =>
        Eq.by(
          eq.fn1Eq(
            ec.boolean().product(ec.miniInt()),
            Eq.tuple(X, MiniInt.Eq, Eq.fromUniversalEquals<string>()),
          ),
          rsw =>
            ([r, s]) =>
              rsw.runAll(r, s, Monoid.string),
        ),
    ),
  );

  checkAll(
    'Local<RWS<boolean, string, MiniInt, *>, boolean>',
    MonadReaderSuite(RWS.MonadReader<boolean, string, MiniInt>()).local(
      fc.integer(),
      fc.integer(),
      fc.boolean(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      <X>(X: Arbitrary<X>) =>
        A.fp4tsRWS(
          fc.func<[boolean, MiniInt], [X, MiniInt, string]>(
            fc.tuple(X, A.fp4tsMiniInt(), fc.string()),
          ),
        ),
      <X>(X: Eq<X>): Eq<RWS<boolean, string, MiniInt, X>> =>
        Eq.by(
          eq.fn1Eq(
            ec.boolean().product(ec.miniInt()),
            Eq.tuple(X, MiniInt.Eq, Eq.fromUniversalEquals<string>()),
          ),
          rsw =>
            ([r, s]) =>
              rsw.runAll(r, s, Monoid.string),
        ),
    ),
  );

  checkAll(
    'Censor<RWS<boolean, string, MiniInt, *>, string>',
    MonadWriterSuite(
      RWS.MonadWriter<boolean, string, MiniInt>(Monoid.string),
    ).censor(
      fc.integer(),
      fc.string(),
      Eq.primitive,
      Eq.primitive,
      <X>(X: Arbitrary<X>) =>
        A.fp4tsRWS(
          fc.func<[boolean, MiniInt], [X, MiniInt, string]>(
            fc.tuple(X, A.fp4tsMiniInt(), fc.string()),
          ),
        ),
      <X>(X: Eq<X>): Eq<RWS<boolean, string, MiniInt, X>> =>
        Eq.by(
          eq.fn1Eq(
            ec.boolean().product(ec.miniInt()),
            Eq.tuple(X, MiniInt.Eq, Eq.fromUniversalEquals<string>()),
          ),
          rsw =>
            ([r, s]) =>
              rsw.runAll(r, s, Monoid.string),
        ),
    ),
  );

  checkAll(
    'MonadState<RWS<boolean, string, MiniInt, *>, MiniInt>',
    MonadStateSuite(RWS.MonadState<boolean, string, MiniInt>()).monadState(
      A.fp4tsMiniInt(),
      MiniInt.Eq,
      <X>(X: Arbitrary<X>) =>
        A.fp4tsRWS(
          fc.func<[boolean, MiniInt], [X, MiniInt, string]>(
            fc.tuple(X, A.fp4tsMiniInt(), fc.string()),
          ),
        ),
      <X>(X: Eq<X>): Eq<RWS<boolean, string, MiniInt, X>> =>
        Eq.by(
          eq.fn1Eq(
            ec.boolean().product(ec.miniInt()),
            Eq.tuple(X, MiniInt.Eq, Eq.fromUniversalEquals<string>()),
          ),
          rsw =>
            ([r, s]) =>
              rsw.runAll(r, s, Monoid.string),
        ),
    ),
  );

  checkAll(
    'Strong<IxRWS<boolean, number, *, *, number>>',
    StrongSuite(IxRWS.Strong<boolean, number, number>()).strong(
      A.fp4tsMiniInt(),
      fc.boolean(),
      fc.boolean(),
      fc.boolean(),
      fc.integer(),
      fc.integer(),
      ec.miniInt(),
      Eq.primitive,
      Eq.primitive,
      ec.boolean(),
      Eq.primitive,
      ec.boolean(),
      Eq.primitive,
      <X, Y>(
        X: Arbitrary<X>,
        Y: Arbitrary<Y>,
      ): Arbitrary<IxRWS<boolean, number, X, Y, number>> =>
        A.fp4tsIxRWS(
          fc.func<[boolean, X], [number, Y, number]>(
            fc.tuple(fc.integer(), Y, fc.integer()),
          ),
        ),
      <X, Y>(
        X: ec.ExhaustiveCheck<X>,
        Y: Eq<Y>,
      ): Eq<IxRWS<boolean, number, X, Y, number>> =>
        Eq.by(
          eq.fn1Eq(
            ec.boolean().product(X),
            Eq.tuple(Eq.primitive, Y, Eq.primitive),
          ),
          fa =>
            ([r, s]) =>
              fa.runAll(r, s, CommutativeMonoid.addition),
        ),
    ),
  );
});
