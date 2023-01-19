// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { $, Eval, EvalF, id, Kind, pipe } from '@fp4ts/core';
import { Monoid, Eq } from '@fp4ts/cats-kernel';
import { EqK, Monad } from '@fp4ts/cats-core';
import {
  Array,
  Either,
  EitherF,
  Identity,
  IdentityF,
  Option,
  OptionF,
} from '@fp4ts/cats-core/lib/data';
import { WriterTChurch as WriterT } from '@fp4ts/cats-mtl';
import { MonadErrorSuite, MonadSuite } from '@fp4ts/cats-laws';
import { MonadWriterSuite } from '@fp4ts/cats-mtl-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('WriterT', () => {
  describe('cumulating results', () => {
    const M = Monoid.string;
    const W = WriterT.MonadWriter(Monad.Eval, M);
    it('should be empty when lifting the pure value', () => {
      expect(WriterT.runAW(Monad.Eval, M)(W.pure(42)).value).toEqual([42, '']);
    });

    it('should concatenate two string', () => {
      expect(
        pipe(
          W.pure(42),
          W.productL(W.tell('tell')),
          W.productL(W.tell(' ')),
          W.productL(W.tell('me')),
          W.productL(W.tell(' ')),
          W.productL(W.tell('more')),
          WriterT.runAW(Monad.Eval, M),
        ).value,
      ).toEqual([42, 'tell me more']);
    });

    it('should reset cumulated result', () => {
      expect(
        pipe(
          W.pure(42),
          W.productL(W.tell('tell')),
          W.productL(W.tell(' ')),
          W.productL(W.tell('me')),
          W.productL(W.tell(' ')),
          W.productL(W.tell('more')),
          W.clear,
          WriterT.runAW(Monad.Eval, M),
        ).value,
      ).toEqual([42, '']);
    });
  });

  describe('Laws', () => {
    function runTests<F, W>(
      [nameF, F]: [string, Monad<F>],
      [nameW, W, arbW, EqW]: [string, Monoid<W>, Arbitrary<W>, Eq<W>],
      mkArbF: <X>(X: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      EqKF: EqK<F>,
    ) {
      checkAll(
        `MonadWriter<WriterT<${nameF}, ${nameW}, *>, ${nameW}>`,
        MonadWriterSuite(WriterT.MonadWriter(F, W)).censor(
          fc.integer(),
          arbW,
          Eq.fromUniversalEquals(),
          EqW,
          arbX =>
            fc
              .tuple(arbX, arbW)
              .map(([x, w]) =>
                WriterT.flatMap_(WriterT.tell(W)(w), () => WriterT.pure(x)),
              ),
          <X>(EqX: Eq<X>) =>
            Eq.by<WriterT<F, W, X>, Kind<F, [[X, W]]>>(
              EqKF.liftEq(Eq.tuple(EqX, EqW)),
              WriterT.runAW(F, W),
            ),
        ),
      );

      checkAll(
        `Monad<WriterT<${nameF}, ${nameW}, *>>`,
        MonadSuite(WriterT.Monad<F, W>(F)).monad(
          fc.string(),
          fc.integer(),
          fc.string(),
          fc.integer(),
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
          Eq.fromUniversalEquals(),
          arbX =>
            fc
              .tuple(arbX, arbW)
              .map(([x, w]) =>
                WriterT.flatMap_(WriterT.tell(W)(w), () => WriterT.pure(x)),
              ),
          <X>(EqX: Eq<X>) =>
            Eq.by<WriterT<F, W, X>, Kind<F, [[X, W]]>>(
              EqKF.liftEq(Eq.tuple(EqX, EqW)),
              WriterT.runAW(F, W),
            ),
        ),
      );
    }

    runTests<IdentityF, string>(
      ['Identity', Identity.Monad],
      ['string', Monoid.string, fc.string(), Eq.fromUniversalEquals()],
      id,
      Identity.EqK,
    );
    runTests<OptionF, string>(
      ['Option', Option.Monad],
      ['string', Monoid.string, fc.string(), Eq.fromUniversalEquals()],
      A.fp4tsOption,
      Option.EqK,
    );
    runTests<OptionF, string[]>(
      ['Option', Option.Monad],
      [
        'string[]',
        Array.MonoidK().algebra<string>(),
        fc.array(fc.string()),
        Array.Eq(Eq.fromUniversalEquals()),
      ],
      A.fp4tsOption,
      Option.EqK,
    );
    runTests<EvalF, string>(
      ['Eval', Monad.Eval],
      ['string', Monoid.string, fc.string(), Eq.fromUniversalEquals()],
      A.fp4tsEval,
      EqK.of({ liftEq: Eq.Eval }),
    );
    runTests<$<EitherF, [string]>, string>(
      ['Either<string, *>', Either.Monad<string>()],
      ['string', Monoid.string, fc.string(), Eq.fromUniversalEquals()],
      X => A.fp4tsEither(fc.string(), X),
      Either.EqK(Eq.fromUniversalEquals<string>()),
    );

    checkAll(
      'MonadError<WriterT<Either<string, *>, string, *>, string>',
      MonadErrorSuite(
        WriterT.MonadError<$<EitherF, [string]>, string, string>(
          Either.MonadError<string>(),
        ),
      ).monadError(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.string(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        <X>(
          arbX: Arbitrary<X>,
        ): Arbitrary<WriterT<$<EitherF, [string]>, string, X>> =>
          fc
            .tuple(arbX, fc.string())
            .map(([x, w]) =>
              WriterT.flatMap_(
                WriterT.tell(Monoid.string)<$<EitherF, [string]>>(w),
                () => WriterT.pure<$<EitherF, [string]>, string, X>(x),
              ),
            ),
        <X>(EqX: Eq<X>) =>
          Eq.by<
            WriterT<$<EitherF, [string]>, string, X>,
            Kind<$<EitherF, [string]>, [[X, string]]>
          >(
            Either.EqK(Eq.fromUniversalEquals<string>()).liftEq(
              Eq.tuple(EqX, Eq.fromUniversalEquals()),
            ),
            WriterT.runAW(Either.Monad<string>(), Monoid.string),
          ),
      ),
    );
  });
});
