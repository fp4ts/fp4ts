// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { $ } from '@fp4ts/core';
import { Monoid, Eq } from '@fp4ts/cats-kernel';
import { Eval, EvalF } from '@fp4ts/cats-core';
import {
  WriterT,
  Array,
  Either,
  EitherF,
  Chain,
  Identity,
  IdentityF,
} from '@fp4ts/cats-core/lib/data';
import { MonadWriter } from '@fp4ts/cats-mtl';
import {
  BifunctorSuite,
  CoflatMapSuite,
  ComonadSuite,
  MonadErrorSuite,
  MonadSuite,
} from '@fp4ts/cats-laws';
import { MonadWriterSuite } from '@fp4ts/cats-mtl-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('WriterT', () => {
  describe('cumulating results', () => {
    it('should be empty when lifting the pure value', () => {
      expect(
        WriterT.pure(Eval.Applicative, Monoid.string)(42).run.value,
      ).toEqual(['', 42]);
    });

    it('should concatenate two string', () => {
      expect(
        WriterT.pure(Eval.Applicative, Monoid.string)(42)
          .log(
            Eval.Monad,
            Monoid.string,
          )('tell')
          .log(
            Eval.Monad,
            Monoid.string,
          )(' ')
          .log(
            Eval.Monad,
            Monoid.string,
          )('me')
          .log(
            Eval.Monad,
            Monoid.string,
          )(' ')
          .log(
            Eval.Monad,
            Monoid.string,
          )('more')
          .written(Eval.Monad).value,
      ).toBe('tell me more');
    });

    it('should reset cumulated result', () => {
      expect(
        WriterT.pure(Eval.Applicative, Monoid.string)(42)
          .log(
            Eval.Monad,
            Monoid.string,
          )('tell')
          .log(
            Eval.Monad,
            Monoid.string,
          )(' ')
          .log(
            Eval.Monad,
            Monoid.string,
          )('me')
          .log(
            Eval.Monad,
            Monoid.string,
          )(' ')
          .log(
            Eval.Monad,
            Monoid.string,
          )('more')
          .reset(Eval.Monad, Monoid.string)
          .written(Eval.Monad).value,
      ).toBe('');
    });

    it('should combine output of two writers', () => {
      const lhs = WriterT<EvalF, string, number>(Eval.now(['left side', 42]));
      const rhs = WriterT<EvalF, string, number>(Eval.now([' right side', 42]));

      expect(lhs.product(Eval.Monad, Monoid.string)(rhs).run.value).toEqual([
        'left side right side',
        [42, 42],
      ]);
    });

    it('should combine result of the flatMap', () => {
      expect(
        WriterT<EvalF, number[], number>(Eval.now([[1, 2, 3], 42])).flatMap(
          Eval.Monad,
          Array.MonoidK().algebra<number>(),
        )(x => WriterT<EvalF, number[], number>(Eval.now([[4, 5, 6], x + 1])))
          .run.value,
      ).toEqual([[1, 2, 3, 4, 5, 6], 43]);
    });
  });

  describe('Laws', () => {
    checkAll(
      'Censor<WriterT<Identity, string, *>, string>',
      MonadWriterSuite(
        MonadWriter.WriterT(Identity.Monad, Monoid.string),
      ).censor(
        fc.integer(),
        fc.string(),
        Eq.primitive,
        Eq.primitive,
        <X>(arbX: Arbitrary<X>): Arbitrary<WriterT<IdentityF, string, X>> =>
          A.fp4tsWriterT(fc.tuple(fc.string(), arbX)),
        <X>(E: Eq<X>): Eq<WriterT<IdentityF, string, X>> =>
          WriterT.Eq(Eq.tuple2(Eq.primitive, E)),
      ),
    );
    checkAll(
      'Censor<WriterT<Eval, string, *>, string>',
      MonadWriterSuite(MonadWriter.WriterT(Eval.Monad, Monoid.string)).censor(
        fc.integer(),
        fc.string(),
        Eq.primitive,
        Eq.primitive,
        <X>(arbX: Arbitrary<X>): Arbitrary<WriterT<EvalF, string, X>> =>
          A.fp4tsWriterT(A.fp4tsEval(fc.tuple(fc.string(), arbX))),
        <X>(E: Eq<X>): Eq<WriterT<EvalF, string, X>> =>
          WriterT.Eq(Eval.Eq(Eq.tuple2(Eq.primitive, E))),
      ),
    );

    checkAll(
      'Bifunctor<WriterT<Identity, string *>>',
      BifunctorSuite(WriterT.Bifunctor(Identity.Monad)).bifunctor(
        fc.string(),
        fc.integer(),
        fc.string(),
        fc.integer(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        <X, Y>(
          arbX: Arbitrary<X>,
          arbY: Arbitrary<Y>,
        ): Arbitrary<WriterT<IdentityF, X, Y>> =>
          A.fp4tsWriterT(fc.tuple(arbX, arbY)),
        <X, Y>(EX: Eq<X>, EY: Eq<Y>): Eq<WriterT<IdentityF, X, Y>> =>
          WriterT.Eq(Eq.tuple2(EX, EY)),
      ),
    );

    checkAll(
      'Monad<WriterT<Identity, string, *>>',
      MonadSuite(WriterT.Monad(Identity.Monad, Monoid.string)).monad(
        fc.string(),
        fc.integer(),
        fc.string(),
        fc.integer(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        <X>(arbX: Arbitrary<X>): Arbitrary<WriterT<IdentityF, string, X>> =>
          A.fp4tsWriterT(fc.tuple(fc.string(), arbX)),
        <X>(E: Eq<X>): Eq<WriterT<IdentityF, string, X>> =>
          WriterT.Eq(Eq.tuple2(Eq.primitive, E)),
      ),
    );

    checkAll(
      'Comonad<WriterT<Identity, string, *>>',
      ComonadSuite(
        WriterT.Comonad<IdentityF, string>(Identity.Comonad),
      ).comonad(
        fc.string(),
        fc.integer(),
        fc.string(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        <X>(arbX: Arbitrary<X>): Arbitrary<WriterT<IdentityF, string, X>> =>
          A.fp4tsWriterT(fc.tuple(fc.string(), arbX)),
        <X>(E: Eq<X>): Eq<WriterT<IdentityF, string, X>> =>
          WriterT.Eq(Eq.tuple2(Eq.primitive, E)),
      ),
    );

    checkAll(
      'Monad<WriterT<Identity, string[], *>>',
      MonadSuite(
        WriterT.Monad<IdentityF, string[]>(
          Identity.Monad,
          Array.MonoidK().algebra<string>(),
        ),
      ).monad(
        fc.string(),
        fc.integer(),
        fc.string(),
        fc.integer(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        <X>(arbX: Arbitrary<X>): Arbitrary<WriterT<IdentityF, string[], X>> =>
          A.fp4tsWriterT(fc.tuple(fc.array(fc.string()), arbX)),
        <X>(E: Eq<X>): Eq<WriterT<IdentityF, string[], X>> =>
          WriterT.Eq(Eq.tuple2(Array.Eq(Eq.primitive), E)),
      ),
    );

    checkAll(
      'Bifunctor<WriterT<Eval, *, *>>',
      BifunctorSuite(WriterT.Bifunctor(Eval.Functor)).bifunctor(
        fc.string(),
        fc.integer(),
        fc.string(),
        fc.integer(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        <X, Y>(
          arbX: Arbitrary<X>,
          arbY: Arbitrary<Y>,
        ): Arbitrary<WriterT<EvalF, X, Y>> =>
          A.fp4tsWriterT(A.fp4tsEval(fc.tuple(arbX, arbY))),
        <X, Y>(EX: Eq<X>, EY: Eq<Y>): Eq<WriterT<EvalF, X, Y>> =>
          WriterT.Eq(Eval.Eq(Eq.tuple2(EX, EY))),
      ),
    );

    checkAll(
      'CoflatMap<WriterT<Eval, string, *>>',
      CoflatMapSuite(
        WriterT.CoflatMap<EvalF, string>(Eval.CoflatMap),
      ).coflatMap(
        fc.string(),
        fc.integer(),
        fc.string(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        <X>(arbX: Arbitrary<X>): Arbitrary<WriterT<EvalF, string, X>> =>
          A.fp4tsWriterT(A.fp4tsEval(fc.tuple(fc.string(), arbX))),
        <X>(E: Eq<X>): Eq<WriterT<EvalF, string, X>> =>
          WriterT.Eq(Eval.Eq(Eq.tuple2(Eq.primitive, E))),
      ),
    );

    checkAll(
      'Monad<WriterT<Eval, string, *>>',
      MonadSuite(WriterT.Monad<EvalF, string>(Eval.Monad, Monoid.string)).monad(
        fc.string(),
        fc.integer(),
        fc.string(),
        fc.integer(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        <X>(arbX: Arbitrary<X>): Arbitrary<WriterT<EvalF, string, X>> =>
          A.fp4tsWriterT(A.fp4tsEval(fc.tuple(fc.string(), arbX))),
        <X>(E: Eq<X>): Eq<WriterT<EvalF, string, X>> =>
          WriterT.Eq(Eval.Eq(Eq.tuple2(Eq.primitive, E))),
      ),
    );

    checkAll(
      'MonadError<WriterT<Either<Error, *>, string, *>, Error>',
      MonadErrorSuite(
        WriterT.MonadError<$<EitherF, [Error]>, string, Error>(
          Either.MonadError(),
          Monoid.string,
        ),
      ).monadError(
        fc.string(),
        fc.integer(),
        fc.string(),
        fc.integer(),
        A.fp4tsError(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.Error.strict,
        <X>(
          arbX: Arbitrary<X>,
        ): Arbitrary<WriterT<$<EitherF, [Error]>, string, X>> =>
          A.fp4tsWriterT(
            A.fp4tsEither(A.fp4tsError(), fc.tuple(fc.string(), arbX)),
          ),
        <X>(E: Eq<X>): Eq<WriterT<$<EitherF, [Error]>, string, X>> =>
          WriterT.Eq(Either.Eq(Eq.Error.strict, Eq.tuple2(Eq.primitive, E))),
      ),
    );

    checkAll(
      'Monad<WriterT<Eval, Chain<string>, *>>',
      MonadSuite(
        WriterT.Monad<EvalF, Chain<string>>(
          Eval.Monad,
          Chain.MonoidK.algebra<string>(),
        ),
      ).monad(
        fc.string(),
        fc.integer(),
        fc.string(),
        fc.integer(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        <X>(arbX: Arbitrary<X>): Arbitrary<WriterT<EvalF, Chain<string>, X>> =>
          A.fp4tsWriterT(
            A.fp4tsEval(fc.tuple(A.fp4tsChain(fc.string()), arbX)),
          ),
        <X>(E: Eq<X>): Eq<WriterT<EvalF, Chain<string>, X>> =>
          WriterT.Eq(Eval.Eq(Eq.tuple2(Chain.Eq(Eq.primitive), E))),
      ),
    );
  });
});
