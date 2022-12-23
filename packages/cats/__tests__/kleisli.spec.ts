// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { $, Eval, EvalF, id, Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Monad } from '@fp4ts/cats-core';
import {
  Identity,
  IdentityF,
  OptionF,
  Option,
  Kleisli,
  ListF,
  List,
  EitherF,
  Either,
} from '@fp4ts/cats-core/lib/data';
import { MonadReader } from '@fp4ts/cats-mtl';
import { MonadReaderSuite } from '@fp4ts/cats-mtl-laws';
import {
  AlternativeSuite,
  ArrowApplySuite,
  ArrowChoiceSuite,
  ContravariantSuite,
  DistributiveSuite,
  FunctorFilterSuite,
  MonadErrorSuite,
} from '@fp4ts/cats-laws';
import {
  checkAll,
  fn1Eq,
  MiniInt,
  ExhaustiveCheck,
} from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';

describe('Kleisli', () => {
  const KIA = Kleisli.Compose<IdentityF>(Identity.Monad);
  const KEA = Kleisli.Compose<EvalF>(Monad.Eval);
  const KEM = <R>() => Kleisli.Monad<EvalF, R>(Monad.Eval);

  it('should be stack safe on flatMap with StackSafeMonad', () => {
    const size = 50_000;
    const go = (i: number): Kleisli<EvalF, unknown, number> =>
      i >= size ? () => Eval.now(i) : KEM().flatMap_(() => Eval.now(i + 1), go);

    expect(go(0)(undefined).value).toBe(size);
  });

  it('should be stack safe on andThen', () => {
    const size = 50_000;
    const fs = List.range(0, size).map(() => (x: number) => x + 1);
    const result = fs.foldLeft(id<number>, KIA.andThen_)(42);
    expect(result).toBe(size + 42);
  });

  it('should be stack safe on compose Eval', () => {
    const size = 50_000;
    const fs = List.range(0, size).map(() => (x: number) => Eval.now(x + 1));
    const result = fs.foldLeft(
      Eval.now as (x: number) => Eval<number>,
      KEA.compose_,
    )(42);
    expect(result.value).toBe(size + 42);
  });

  describe('Laws', () => {
    const eqKleisli = <F, A, B>(
      EA: ExhaustiveCheck<A>,
      EqFB: Eq<Kind<F, [B]>>,
    ): Eq<Kleisli<F, A, B>> => fn1Eq(EA, EqFB);

    checkAll(
      'Contravariant<Kleisli<Identity, *, number>>',
      ContravariantSuite(
        Kleisli.Contravariant<IdentityF, number>(),
      ).contravariant(
        A.fp4tsMiniInt(),
        A.fp4tsMiniInt(),
        ec.miniInt(),
        ec.miniInt(),
        <X>(_: Arbitrary<X>) =>
          A.fp4tsKleisli<IdentityF, X, number>(fc.integer()),
        X => eqKleisli(X, Eq.fromUniversalEquals()),
      ),
    );

    checkAll(
      'Distributive<Kleisli<Identity, MiniInt, *>>',
      DistributiveSuite(
        Kleisli.Distributive<IdentityF, MiniInt>(Identity.Distributive),
      ).distributive(
        fc.string(),
        fc.string(),
        fc.string(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        <X>(X: Arbitrary<X>) => A.fp4tsKleisli<IdentityF, MiniInt, X>(X),
        <X>(X: Eq<X>): Eq<Kleisli<IdentityF, MiniInt, X>> =>
          eqKleisli(ec.miniInt(), X),
      ),
    );

    checkAll(
      'FunctorFilter<Kleisli<Option, MiniInt, *>>',
      FunctorFilterSuite(
        Kleisli.FunctorFilter<OptionF, MiniInt>(Option.FunctorFilter),
      ).functorFilter(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        <X>(x: Arbitrary<X>) =>
          A.fp4tsKleisli<OptionF, MiniInt, X>(A.fp4tsOption(x)),
        <X>(E: Eq<X>) =>
          eqKleisli<OptionF, MiniInt, X>(ec.miniInt(), Option.Eq(E)),
      ),
    );

    checkAll(
      'Alternative<Kleisli<List, MiniInt, *>>',
      AlternativeSuite(
        Kleisli.Alternative<ListF, MiniInt>(List.Alternative),
      ).alternative(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        <X>(x: Arbitrary<X>) =>
          A.fp4tsKleisli<ListF, MiniInt, X>(A.fp4tsList(x)),
        <X>(E: Eq<X>) => eqKleisli<ListF, MiniInt, X>(ec.miniInt(), List.Eq(E)),
      ),
    );

    type EitherStringF = $<EitherF, [string]>;
    checkAll(
      'MonadError<Kleisli<Either<string, *>, MiniInt, *>>',
      MonadErrorSuite(
        Kleisli.MonadError<EitherStringF, MiniInt, string>(
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
        <X>(x: Arbitrary<X>) =>
          A.fp4tsKleisli<EitherStringF, MiniInt, X>(
            A.fp4tsEither(fc.string(), x),
          ),
        <X>(E: Eq<X>) =>
          eqKleisli<EitherStringF, MiniInt, X>(
            ec.miniInt(),
            Either.Eq(Eq.fromUniversalEquals(), E),
          ),
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
        <X>(x: Arbitrary<X>) =>
          A.fp4tsKleisli<OptionF, MiniInt, X>(A.fp4tsOption(x)),
        <X>(E: Eq<X>) =>
          eqKleisli<OptionF, MiniInt, X>(ec.miniInt(), Option.Eq(E)),
      ),
    );

    checkAll(
      'ArrowApply<Kleisli<Eval, *, *>>',
      ArrowApplySuite(Kleisli.ArrowApply(Monad.Eval)).arrowApply(
        A.fp4tsMiniInt(),
        A.fp4tsMiniInt(),
        fc.boolean(),
        fc.boolean(),
        fc.integer(),
        fc.integer(),
        MiniInt.Eq,
        ec.miniInt(),
        MiniInt.Eq,
        ec.miniInt(),
        Eq.fromUniversalEquals(),
        ec.boolean(),
        Eq.fromUniversalEquals(),
        ec.boolean(),
        Eq.fromUniversalEquals(),
        <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) =>
          A.fp4tsKleisli<EvalF, X, Y>(A.fp4tsEval(Y)),
        <X, Y>(X: ExhaustiveCheck<X>, Y: Eq<Y>) =>
          eqKleisli<EvalF, X, Y>(X, Eq.Eval(Y)),
        <X, Y>(X: ExhaustiveCheck<X>, Y: ExhaustiveCheck<Y>) =>
          ec.instance<Kleisli<EvalF, X, Y>>(
            Y.allValues.map(y => Kleisli((x: X) => Eval.now(y))),
          ),
      ),
    );

    checkAll(
      'ArrowChoice<Kleisli<Eval, *, *>>',
      ArrowChoiceSuite(Kleisli.ArrowChoice(Monad.Eval)).arrowChoice(
        A.fp4tsMiniInt(),
        A.fp4tsMiniInt(),
        fc.boolean(),
        fc.boolean(),
        fc.integer(),
        fc.integer(),
        MiniInt.Eq,
        ec.miniInt(),
        MiniInt.Eq,
        ec.miniInt(),
        Eq.fromUniversalEquals(),
        ec.boolean(),
        Eq.fromUniversalEquals(),
        ec.boolean(),
        Eq.fromUniversalEquals(),
        <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) =>
          A.fp4tsKleisli<EvalF, X, Y>(A.fp4tsEval(Y)),
        <X, Y>(X: ExhaustiveCheck<X>, Y: Eq<Y>) =>
          eqKleisli<EvalF, X, Y>(X, Eq.Eval(Y)),
      ),
    );
  });
});
