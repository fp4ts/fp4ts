// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { $ } from '@fp4ts/core';
import { Monoid, Eq, Eval, EvalK } from '@fp4ts/cats-core';
import {
  Writer,
  WriterT,
  Array,
  Either,
  EitherK,
  Chain,
} from '@fp4ts/cats-core/lib/data';
import { BifunctorSuite, MonadErrorSuite, MonadSuite } from '@fp4ts/cats-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('WriterT', () => {
  describe('cumulating results', () => {
    it('should be empty when lifting the pure value', () => {
      expect(Writer.pure(Monoid.string)(42).run).toEqual(['', 42]);
    });

    it('should concatenate two string', () => {
      expect(
        Writer.pure(Monoid.string)(42)
          ['<<<'](Monoid.string)('tell')
          ['<<<'](Monoid.string)(' ')
          ['<<<'](Monoid.string)('me')
          ['<<<'](Monoid.string)(' ')
          ['<<<'](Monoid.string)('more')
          .written(),
      ).toBe('tell me more');
    });

    it('should reset cumulated result', () => {
      expect(
        Writer.pure(Monoid.string)(42)
          ['<<<'](Monoid.string)('tell')
          ['<<<'](Monoid.string)(' ')
          ['<<<'](Monoid.string)('me')
          ['<<<'](Monoid.string)(' ')
          ['<<<'](Monoid.string)('more')
          .reset(Monoid.string)
          .written(),
      ).toBe('');
    });

    it('should combine output of two writers', () => {
      const lhs = Writer(['left side', 42]);
      const rhs = Writer([' right side', 42]);

      expect(lhs.product(Monoid.string)(rhs).run).toEqual([
        'left side right side',
        [42, 42],
      ]);
    });

    it('should combine result of the flatMap', () => {
      expect(
        Writer([[1, 2, 3], 42]).flatMap(Array.MonoidK().algebra<number>())(x =>
          Writer([[4, 5, 6], x + 1]),
        ).run,
      ).toEqual([[1, 2, 3, 4, 5, 6], 43]);
    });
  });

  describe('Writer Laws', () => {
    const bifunctorTests = BifunctorSuite(Writer.Bifunctor);
    checkAll(
      'Bifunctor<Writer<string *>>',
      bifunctorTests.bifunctor(
        fc.string(),
        fc.integer(),
        fc.string(),
        fc.integer(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        (arbX, arbY) => A.fp4tsWriter(fc.tuple(arbX, arbY)),
        (EX, EY) => Writer.Eq(Eq.tuple2(EX, EY)),
      ),
    );

    const monadTests = MonadSuite(Writer.Monad<string>(Monoid.string));
    checkAll(
      'Monad<Writer<string, *>>',
      monadTests.monad(
        fc.string(),
        fc.integer(),
        fc.string(),
        fc.integer(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        arbX => A.fp4tsWriter(fc.tuple(fc.string(), arbX)),
        E => Writer.Eq(Eq.tuple2(Eq.primitive as any, E)),
      ),
    );

    const monadArrayTests = MonadSuite(
      Writer.Monad<string[]>(Array.MonoidK().algebra<string>()),
    );
    checkAll(
      'Monad<Writer<string[], *>>',
      monadArrayTests.monad(
        fc.string(),
        fc.integer(),
        fc.string(),
        fc.integer(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        arbX => A.fp4tsWriter(fc.tuple(fc.array(fc.string()), arbX)),
        E => Writer.Eq(Eq.tuple2(Array.Eq(Eq.primitive as any), E)),
      ),
    );
  });

  describe('WriterT Laws', () => {
    const bifunctorTests = BifunctorSuite(WriterT.Bifunctor(Eval.Functor));
    checkAll(
      'Bifunctor<WriterT<Eval, *, *>>',
      bifunctorTests.bifunctor(
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
        ): Arbitrary<WriterT<EvalK, X, Y>> =>
          A.fp4tsWriterT(A.fp4tsEval(fc.tuple(arbX, arbY))),
        <X, Y>(EX: Eq<X>, EY: Eq<Y>): Eq<WriterT<EvalK, X, Y>> =>
          WriterT.Eq(Eval.Eq(Eq.tuple2(EX, EY))),
      ),
    );

    const monadTests = MonadSuite(
      WriterT.Monad<EvalK, string>(Eval.Monad, Monoid.string),
    );
    checkAll(
      'Monad<WriterT<Eval, string, *>>',
      monadTests.monad(
        fc.string(),
        fc.integer(),
        fc.string(),
        fc.integer(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        <X>(arbX: Arbitrary<X>): Arbitrary<WriterT<EvalK, string, X>> =>
          A.fp4tsWriterT(A.fp4tsEval(fc.tuple(fc.string(), arbX))),
        <X>(E: Eq<X>): Eq<WriterT<EvalK, string, X>> =>
          WriterT.Eq(Eval.Eq(Eq.tuple2(Eq.primitive as any, E))),
      ),
    );

    const monadErrorTests = MonadErrorSuite(
      WriterT.MonadError<$<EitherK, [Error]>, string, Error>(
        Either.MonadError(),
        Monoid.string,
      ),
    );
    checkAll(
      'MonadError<WriterT<Either<Error, *>, string, *>, Error>',
      monadErrorTests.monadError(
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
        ): Arbitrary<WriterT<$<EitherK, [Error]>, string, X>> =>
          A.fp4tsWriterT(
            A.fp4tsEither(A.fp4tsError(), fc.tuple(fc.string(), arbX)),
          ),
        <X>(E: Eq<X>): Eq<WriterT<$<EitherK, [Error]>, string, X>> =>
          WriterT.Eq(
            Either.Eq(Eq.Error.strict, Eq.tuple2(Eq.primitive as any, E)),
          ),
      ),
    );

    const monadChainTests = MonadSuite(
      WriterT.Monad<EvalK, Chain<string>>(
        Eval.Monad,
        Chain.MonoidK.algebra<string>(),
      ),
    );
    checkAll(
      'Monad<WriterT<Eval, Chain<string>, *>>',
      monadChainTests.monad(
        fc.string(),
        fc.integer(),
        fc.string(),
        fc.integer(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        <X>(arbX: Arbitrary<X>): Arbitrary<WriterT<EvalK, Chain<string>, X>> =>
          A.fp4tsWriterT(
            A.fp4tsEval(fc.tuple(A.fp4tsChain(fc.string()), arbX)),
          ),
        <X>(E: Eq<X>): Eq<WriterT<EvalK, Chain<string>, X>> =>
          WriterT.Eq(Eval.Eq(Eq.tuple2(Chain.Eq(Eq.primitive) as any, E))),
      ),
    );
  });
});
