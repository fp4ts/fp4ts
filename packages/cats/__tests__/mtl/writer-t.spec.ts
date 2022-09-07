// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { $, id, Kind, pipe, tupled } from '@fp4ts/core';
import { Monoid, Eq } from '@fp4ts/cats-kernel';
import { EqK, Eval, Monad } from '@fp4ts/cats-core';
import {
  Array,
  Either,
  EitherF,
  Identity,
  Option,
  OptionF,
} from '@fp4ts/cats-core/lib/data';
import { WriterT } from '@fp4ts/cats-mtl';
import {
  AlternativeSuite,
  CoflatMapSuite,
  FlatMapSuite,
  MonadErrorSuite,
  MonadSuite,
  TraversableSuite,
} from '@fp4ts/cats-laws';
import { MonadWriterSuite } from '@fp4ts/cats-mtl-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('WriterT', () => {
  describe('cumulating results', () => {
    const W = WriterT.MonadWriter(Eval.Monad, Monoid.string);
    it('should be empty when lifting the pure value', () => {
      expect(W.pure(42).value).toEqual([42, '']);
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
        ).value,
      ).toEqual([42, '']);
    });

    it('should combine output of two writers', () => {
      const lhs = Eval.now(tupled(42, 'left side'));
      const rhs = Eval.now(tupled(42, ' right side'));

      expect(W.product_(lhs, rhs).value).toEqual([
        [42, 42],
        'left side right side',
      ]);
    });

    it('should combine result of the flatMap', () => {
      const W = WriterT.MonadWriter(
        Eval.Monad,
        Array.MonoidK().algebra<number>(),
      );
      expect(
        pipe(
          Eval.now(tupled(42, [1, 2, 3])),
          W.flatMap(x => Eval.now([x + 1, [4, 5, 6]])),
        ).value,
      ).toEqual([43, [1, 2, 3, 4, 5, 6]]);
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
        `MonadReader<WriterT<${nameF}, ${nameW}, *>, ${nameW}>`,
        MonadWriterSuite(WriterT.MonadWriter(F, W)).censor(
          fc.integer(),
          arbW,
          Eq.primitive,
          EqW,
          arbX => A.fp4tsWriterT(mkArbF(fc.tuple(arbX, arbW))),
          WriterT.EqK(EqKF, EqW).liftEq,
        ),
      );

      checkAll(
        `WriterT.FlatMap2<WriterT<${nameF}, ${nameW}, *>>`,
        FlatMapSuite(WriterT.FlatMap2(F, W)).flatMap(
          fc.string(),
          fc.integer(),
          fc.string(),
          fc.integer(),
          Eq.primitive,
          Eq.primitive,
          Eq.primitive,
          Eq.primitive,
          arbX => A.fp4tsWriterT(mkArbF(fc.tuple(arbX, arbW))),
          WriterT.EqK(EqKF, EqW).liftEq,
        ),
      );

      checkAll(
        `Monad<WriterT<${nameF}, ${nameW}, *>>`,
        MonadSuite(WriterT.Monad(F, W)).monad(
          fc.string(),
          fc.integer(),
          fc.string(),
          fc.integer(),
          Eq.primitive,
          Eq.primitive,
          Eq.primitive,
          Eq.primitive,
          arbX => A.fp4tsWriterT(mkArbF(fc.tuple(arbX, arbW))),
          WriterT.EqK(EqKF, EqW).liftEq,
        ),
      );

      checkAll(
        `CoflatMap<${nameF}, ${nameW}, *>`,
        CoflatMapSuite(WriterT.CoflatMap<F, W>(F)).coflatMap(
          fc.integer(),
          fc.integer(),
          fc.integer(),
          fc.integer(),
          Eq.primitive,
          Eq.primitive,
          Eq.primitive,
          Eq.primitive,
          arbX => A.fp4tsWriterT(mkArbF(fc.tuple(arbX, arbW))),
          WriterT.EqK(EqKF, EqW).liftEq,
        ),
      );
    }

    runTests(
      ['Identity', Identity.Monad],
      ['string', Monoid.string, fc.string(), Eq.primitive],
      id,
      Identity.EqK,
    );
    runTests(
      ['Option', Option.Monad],
      ['string', Monoid.string, fc.string(), Eq.primitive],
      A.fp4tsOption,
      Option.EqK,
    );
    runTests(
      ['Option', Option.Monad],
      [
        'string[]',
        Array.MonoidK().algebra<string>(),
        fc.array(fc.string()),
        Array.Eq(Eq.primitive),
      ],
      A.fp4tsOption,
      Option.EqK,
    );
    runTests(
      ['Eval', Eval.Monad],
      ['string', Monoid.string, fc.string(), Eq.primitive],
      A.fp4tsEval,
      EqK.of({ liftEq: Eval.Eq }),
    );
    runTests(
      ['Eval<string, *>', Either.Monad<string>()],
      ['string', Monoid.string, fc.string(), Eq.primitive],
      X => A.fp4tsEither(fc.string(), X),
      EqK.of({ liftEq: X => Either.Eq(Eq.primitive, X) }),
    );

    checkAll(
      'Alternative<WriterT<Option, string, *>>',
      AlternativeSuite(
        WriterT.Alternative(Option.Alternative, Monoid.string),
      ).alternative(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        <X>(arbX: Arbitrary<X>) =>
          A.fp4tsWriterT<OptionF, string, X>(
            A.fp4tsOption(fc.tuple(arbX, fc.string())),
          ),
        WriterT.EqK(Option.EqK, Eq.primitive).liftEq,
      ),
    );

    checkAll(
      'MonadError<WriterT<Either<string, *>, string, *>, string>',
      MonadErrorSuite(
        WriterT.MonadError(Either.MonadError<string>(), Monoid.string),
      ).monadError(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.string(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        <X>(arbX: Arbitrary<X>) =>
          A.fp4tsWriterT<$<EitherF, [string]>, string, X>(
            A.fp4tsEither(fc.string(), fc.tuple(arbX, fc.string())),
          ),
        X => Either.Eq(Eq.primitive, Eq.tuple(X, Eq.primitive)),
      ),
    );

    checkAll(
      'Traversable<WriterT<Option, string, *>>',
      TraversableSuite(
        WriterT.Traversable<OptionF, string>(Option.Traversable),
      ).traversable(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Monoid.addition,
        Monoid.addition,
        WriterT.Functor(Option.Functor),
        Option.Applicative,
        Eval.Applicative,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        <X>(arbX: Arbitrary<X>) =>
          A.fp4tsWriterT<OptionF, string, X>(
            A.fp4tsOption(fc.tuple(arbX, fc.string())),
          ),
        WriterT.EqK(Option.EqK, Eq.primitive).liftEq,
        A.fp4tsOption,
        Option.Eq,
        A.fp4tsEval,
        Eval.Eq,
      ),
    );
  });
});
