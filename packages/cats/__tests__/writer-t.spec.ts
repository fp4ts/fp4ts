// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { $ } from '@fp4ts/core';
import { Monoid, Eq } from '@fp4ts/cats-kernel';
import { EqK, Eval, EvalF } from '@fp4ts/cats-core';
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
import { MonadErrorSuite, MonadSuite } from '@fp4ts/cats-laws';
import { MonadWriterSuite } from '@fp4ts/cats-mtl-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('WriterT', () => {
  describe('cumulating results', () => {
    it('should be empty when lifting the pure value', () => {
      expect(
        WriterT.pure(Eval.Applicative)(42).runWriter(
          Eval.Functor,
          Monoid.string,
        ).value,
      ).toEqual(['', 42]);
    });

    it('should concatenate two string', () => {
      expect(
        WriterT.pure(Eval.Applicative)(42)
          .log<string>(Eval.Functor)('tell')
          .log(Eval.Functor)(' ')
          .log(Eval.Functor)('me')
          .log(Eval.Functor)(' ')
          .log(Eval.Functor)('more')
          .runWriter(Eval.Monad, Monoid.string).value[0],
      ).toBe('tell me more');
    });

    it('should reset cumulated result', () => {
      expect(
        WriterT.pure(Eval.Applicative)(42)
          .log<string>(Eval.Functor)('tell')
          .log(Eval.Functor)(' ')
          .log(Eval.Functor)('me')
          .log(Eval.Functor)(' ')
          .log(Eval.Functor)('more')
          .reset(Eval.Monad)
          .runWriter(Eval.Monad, Monoid.string).value[0],
      ).toBe('');
    });

    it('should combine output of two writers', () => {
      const lhs = WriterT<EvalF, string, number>(
        Eval.now([Chain('left side'), 42]),
      );
      const rhs = WriterT<EvalF, string, number>(
        Eval.now([Chain(' right side'), 42]),
      );

      expect(
        lhs.product(Eval.Monad)(rhs).runWriter(Eval.Monad, Monoid.string).value,
      ).toEqual(['left side right side', [42, 42]]);
    });

    it('should combine result of the flatMap', () => {
      expect(
        WriterT<EvalF, number[], number>(Eval.now([Chain([1, 2, 3]), 42]))
          .flatMap(Eval.Monad)(x =>
            WriterT<EvalF, number[], number>(
              Eval.now([Chain([4, 5, 6]), x + 1]),
            ),
          )
          .runWriter(Eval.Monad, Array.MonoidK().algebra()).value,
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
          A.fp4tsWriterT(fc.tuple(A.fp4tsChain(fc.string()), arbX)),
        WriterT.EqK(Identity.EqK, Monoid.string, Eq.primitive).liftEq,
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
          A.fp4tsWriterT(
            A.fp4tsEval(fc.tuple(A.fp4tsChain(fc.string()), arbX)),
          ),
        WriterT.EqK(
          EqK.of<EvalF>({ liftEq: Eval.Eq }),
          Monoid.string,
          Eq.primitive,
        ).liftEq,
      ),
    );

    checkAll(
      'Monad<WriterT<Identity, string, *>>',
      MonadSuite(WriterT.Monad<IdentityF, string>(Identity.Monad)).monad(
        fc.string(),
        fc.integer(),
        fc.string(),
        fc.integer(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        <X>(arbX: Arbitrary<X>): Arbitrary<WriterT<IdentityF, string, X>> =>
          A.fp4tsWriterT(fc.tuple(A.fp4tsChain(fc.string()), arbX)),
        WriterT.EqK(Identity.EqK, Monoid.string, Eq.primitive).liftEq,
      ),
    );

    checkAll(
      'Monad<WriterT<Identity, string[], *>>',
      MonadSuite(WriterT.Monad<IdentityF, string[]>(Identity.Monad)).monad(
        fc.string(),
        fc.integer(),
        fc.string(),
        fc.integer(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        <X>(arbX: Arbitrary<X>): Arbitrary<WriterT<IdentityF, string[], X>> =>
          A.fp4tsWriterT(fc.tuple(A.fp4tsChain(fc.array(fc.string())), arbX)),
        WriterT.EqK(
          Identity.EqK,
          Array.MonoidK().algebra<string>(),
          Array.Eq(Eq.primitive),
        ).liftEq,
      ),
    );

    checkAll(
      'Monad<WriterT<Eval, string, *>>',
      MonadSuite(WriterT.Monad<EvalF, string>(Eval.Monad)).monad(
        fc.string(),
        fc.integer(),
        fc.string(),
        fc.integer(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        <X>(arbX: Arbitrary<X>): Arbitrary<WriterT<EvalF, string, X>> =>
          A.fp4tsWriterT(
            A.fp4tsEval(fc.tuple(A.fp4tsChain(fc.string()), arbX)),
          ),
        WriterT.EqK(
          EqK.of<EvalF>({ liftEq: Eval.Eq }),
          Monoid.string,
          Eq.primitive,
        ).liftEq,
      ),
    );

    checkAll(
      'MonadError<WriterT<Either<Error, *>, string, *>, Error>',
      MonadErrorSuite(
        WriterT.MonadError<$<EitherF, [Error]>, string, Error>(
          Either.MonadError(),
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
            A.fp4tsEither(
              A.fp4tsError(),
              fc.tuple(A.fp4tsChain(fc.string()), arbX),
            ),
          ),
        WriterT.EqK(
          EqK.of<$<EitherF, [Error]>>({
            liftEq: a => Either.Eq(Eq.Error.strict, a),
          }),
          Monoid.string,
          Eq.primitive,
        ).liftEq,
      ),
    );
  });
});
