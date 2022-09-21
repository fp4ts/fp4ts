// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { $ } from '@fp4ts/core';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import {
  Either,
  EitherF,
  EitherT,
  Identity,
  IdentityF,
  Kleisli,
  Option,
  OptionF,
  OptionT,
} from '@fp4ts/cats-core/lib/data';
import { RWS, IxRWSF, MonadReader } from '@fp4ts/cats-mtl';
import { MonadReaderSuite } from '@fp4ts/cats-mtl-laws';
import { checkAll, MiniInt } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';

describe('MonadReader', () => {
  describe('Function1', () => {
    checkAll(
      'Local<Function1<MiniInt, *>>',
      MonadReaderSuite(MonadReader.Function1<MiniInt>()).local(
        fc.integer(),
        fc.integer(),
        A.fp4tsMiniInt(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        MiniInt.Eq,
        <X>(arbX: Arbitrary<X>): Arbitrary<(m: MiniInt) => X> =>
          fc.func<[MiniInt], X>(arbX),
        <X>(EqX: Eq<X>): Eq<(m: MiniInt) => X> => eq.fn1Eq(ec.miniInt(), EqX),
      ),
    );
  });

  describe('Kleisli', () => {
    checkAll(
      'Local<Kleisli<Identity MiniInt, *>>',
      MonadReaderSuite(
        MonadReader.Kleisli<IdentityF, MiniInt>(Identity.Monad),
      ).local(
        fc.integer(),
        fc.integer(),
        A.fp4tsMiniInt(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        MiniInt.Eq,
        <X>(arbX: Arbitrary<X>): Arbitrary<Kleisli<IdentityF, MiniInt, X>> =>
          A.fp4tsKleisli(arbX),
        <X>(EqX: Eq<X>): Eq<Kleisli<IdentityF, MiniInt, X>> =>
          Eq.by(eq.fn1Eq(ec.miniInt(), EqX), k => a => k(a)),
      ),
    );

    checkAll(
      'Local<Kleisli<Option, MiniInt, *>>',
      MonadReaderSuite(
        MonadReader.Kleisli<OptionF, MiniInt>(Option.Monad),
      ).local(
        fc.integer(),
        fc.integer(),
        A.fp4tsMiniInt(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        MiniInt.Eq,
        <X>(arbX: Arbitrary<X>): Arbitrary<Kleisli<OptionF, MiniInt, X>> =>
          A.fp4tsKleisli(A.fp4tsOption(arbX)),
        <X>(EqX: Eq<X>): Eq<Kleisli<OptionF, MiniInt, X>> =>
          Eq.by(eq.fn1Eq(ec.miniInt(), Option.Eq(EqX)), k => a => k(a)),
      ),
    );

    checkAll(
      'Local<Kleisli<Either<string, *>, MiniInt, *>>',
      MonadReaderSuite(
        MonadReader.Kleisli<$<EitherF, [string]>, MiniInt>(Either.Monad()),
      ).local(
        fc.integer(),
        fc.integer(),
        A.fp4tsMiniInt(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        MiniInt.Eq,
        <X>(
          arbX: Arbitrary<X>,
        ): Arbitrary<Kleisli<$<EitherF, [string]>, MiniInt, X>> =>
          A.fp4tsKleisli(A.fp4tsEither(fc.string(), arbX)),
        <X>(EqX: Eq<X>): Eq<Kleisli<$<EitherF, [string]>, MiniInt, X>> =>
          Eq.by(
            eq.fn1Eq(ec.miniInt(), Either.Eq(Eq.fromUniversalEquals(), EqX)),
            k => a => k(a),
          ),
      ),
    );
  });

  type RWSF_ = $<IxRWSF, [boolean, string, MiniInt, MiniInt]>;
  describe('EitherT', () => {
    checkAll(
      'Local<EitherT<RWS<boolean, string, MiniInt>, Error, *>',
      MonadReaderSuite(
        MonadReader.EitherT<RWSF_, Error, boolean>(RWS.MonadReader()),
      ).local(
        fc.integer(),
        fc.integer(),
        fc.boolean(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        <X>(X: Arbitrary<X>): Arbitrary<EitherT<RWSF_, Error, X>> =>
          A.fp4tsEitherT(
            A.fp4tsRWS(
              fc.func(
                fc.tuple(
                  A.fp4tsEither(A.fp4tsError(), X),
                  A.fp4tsMiniInt(),
                  fc.string(),
                ),
              ),
            ),
          ),
        <X>(EqX: Eq<X>): Eq<EitherT<RWSF_, Error, X>> =>
          Eq.by(
            eq.fn1Eq(
              ec.boolean().product(ec.miniInt()),
              Eq.tuple(
                Either.Eq(Eq.Error.allEqual, EqX),
                MiniInt.Eq,
                Eq.fromUniversalEquals<string>(),
              ),
            ),
            fa =>
              ([r, s1]) =>
                fa.value.runAll(r, s1, Monoid.string),
          ),
      ),
    );
  });

  describe('OptionT', () => {
    checkAll(
      'Local<OptionT<RWS<boolean, string, MiniInt, *>, *>',
      MonadReaderSuite(
        MonadReader.OptionT<RWSF_, boolean>(RWS.MonadReader()),
      ).local(
        fc.integer(),
        fc.integer(),
        fc.boolean(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        <X>(X: Arbitrary<X>): Arbitrary<OptionT<RWSF_, X>> =>
          A.fp4tsOptionT(
            A.fp4tsRWS(
              fc.func(
                fc.tuple(A.fp4tsOption(X), A.fp4tsMiniInt(), fc.string()),
              ),
            ),
          ),
        <X>(EqX: Eq<X>): Eq<OptionT<RWSF_, X>> =>
          Eq.by(
            eq.fn1Eq(
              ec.boolean().product(ec.miniInt()),
              Eq.tuple(
                Option.Eq(EqX),
                MiniInt.Eq,
                Eq.fromUniversalEquals<string>(),
              ),
            ),
            fa =>
              ([r, s1]) =>
                fa.value.runAll(r, s1, Monoid.string),
          ),
      ),
    );
  });
});
