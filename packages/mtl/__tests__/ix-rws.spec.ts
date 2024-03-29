// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Eq, CommutativeMonoid, Monoid } from '@fp4ts/cats';
import { IxRWS, RWS } from '@fp4ts/mtl-core';
import { MonadDeferSuite } from '@fp4ts/cats-laws';
import { StrongSuite } from '@fp4ts/cats-profunctor-laws';
import {
  MonadReaderSuite,
  MonadStateSuite,
  MonadWriterSuite,
} from '@fp4ts/mtl-laws';
import { checkAll, ExhaustiveCheck, MiniInt } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as MA from '@fp4ts/mtl-test-kit/lib/arbitraries';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';

describe('RWS', () => {
  checkAll(
    'MonadDefer<RWS<boolean, string, MiniInt, *>>',
    MonadDeferSuite(RWS.Monad<boolean, string, MiniInt>()).monadDefer(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      <X>(X: Arbitrary<X>) =>
        MA.fp4tsRWS(
          fc.func<[boolean, MiniInt], [X, MiniInt, string]>(
            fc.tuple(X, A.fp4tsMiniInt(), fc.string()),
          ),
        ),
      <X>(X: Eq<X>): Eq<RWS<boolean, string, MiniInt, X>> =>
        Eq.by(
          eq.fn1Eq(
            ExhaustiveCheck.boolean().product(ExhaustiveCheck.miniInt()),
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
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      <X>(X: Arbitrary<X>) =>
        MA.fp4tsRWS(
          fc.func<[boolean, MiniInt], [X, MiniInt, string]>(
            fc.tuple(X, A.fp4tsMiniInt(), fc.string()),
          ),
        ),
      <X>(X: Eq<X>): Eq<RWS<boolean, string, MiniInt, X>> =>
        Eq.by(
          eq.fn1Eq(
            ExhaustiveCheck.boolean().product(ExhaustiveCheck.miniInt()),
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
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      <X>(X: Arbitrary<X>) =>
        MA.fp4tsRWS(
          fc.func<[boolean, MiniInt], [X, MiniInt, string]>(
            fc.tuple(X, A.fp4tsMiniInt(), fc.string()),
          ),
        ),
      <X>(X: Eq<X>): Eq<RWS<boolean, string, MiniInt, X>> =>
        Eq.by(
          eq.fn1Eq(
            ExhaustiveCheck.boolean().product(ExhaustiveCheck.miniInt()),
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
        MA.fp4tsRWS(
          fc.func<[boolean, MiniInt], [X, MiniInt, string]>(
            fc.tuple(X, A.fp4tsMiniInt(), fc.string()),
          ),
        ),
      <X>(X: Eq<X>): Eq<RWS<boolean, string, MiniInt, X>> =>
        Eq.by(
          eq.fn1Eq(
            ExhaustiveCheck.boolean().product(ExhaustiveCheck.miniInt()),
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
      ExhaustiveCheck.miniInt(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      ExhaustiveCheck.boolean(),
      Eq.fromUniversalEquals(),
      ExhaustiveCheck.boolean(),
      Eq.fromUniversalEquals(),
      <X, Y>(
        X: Arbitrary<X>,
        Y: Arbitrary<Y>,
      ): Arbitrary<IxRWS<boolean, number, X, Y, number>> =>
        MA.fp4tsIxRWS(
          fc.func<[boolean, X], [number, Y, number]>(
            fc.tuple(fc.integer(), Y, fc.integer()),
          ),
        ),
      <X, Y>(
        X: ExhaustiveCheck<X>,
        Y: Eq<Y>,
      ): Eq<IxRWS<boolean, number, X, Y, number>> =>
        Eq.by(
          eq.fn1Eq(
            ExhaustiveCheck.boolean().product(X),
            Eq.tuple(Eq.fromUniversalEquals(), Y, Eq.fromUniversalEquals()),
          ),
          fa =>
            ([r, s]) =>
              fa.runAll(r, s, CommutativeMonoid.addition),
        ),
    ),
  );
});
