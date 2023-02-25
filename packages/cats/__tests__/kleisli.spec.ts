// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { $, Eval, EvalF, id, Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Monad, MonadDefer } from '@fp4ts/cats-core';
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
import {
  AlternativeSuite,
  ContravariantSuite,
  DistributiveSuite,
  FunctorFilterSuite,
  MonadDeferSuite,
  MonadErrorSuite,
  MonadPlusSuite,
} from '@fp4ts/cats-laws';
import {
  checkAll,
  fn1Eq,
  MiniInt,
  ExhaustiveCheck,
} from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('Kleisli', () => {
  const KEM = <R>() => Kleisli.Monad<EvalF, R>(Monad.Eval);

  it('should be stack safe on flatMap with MonadDefer', () => {
    const size = 50_000;
    const go = (i: number): Kleisli<EvalF, unknown, number> =>
      i >= size ? () => Eval.now(i) : KEM().flatMap_(() => Eval.now(i + 1), go);

    expect(go(0)(undefined).value).toBe(size);
  });

  it('should be stack safe on andThen', () => {
    const size = 50_000;
    const fs = List.range(0, size).map(() => (x: number) => x + 1);
    const result = fs.foldLeft(id<number>, Identity.Monad.andThen_)(42);
    expect(result).toBe(size + 42);
  });

  it('should be stack safe on compose Eval', () => {
    const size = 50_000;
    const fs = List.range(0, size).map(() => (x: number) => Eval.now(x + 1));
    const result = fs.foldLeft(
      Eval.now as (x: number) => Eval<number>,
      Monad.Eval.compose_,
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
        ExhaustiveCheck.miniInt(),
        ExhaustiveCheck.miniInt(),
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
          eqKleisli(ExhaustiveCheck.miniInt(), X),
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
          eqKleisli<OptionF, MiniInt, X>(
            ExhaustiveCheck.miniInt(),
            Option.Eq(E),
          ),
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
        <X>(E: Eq<X>) =>
          eqKleisli<ListF, MiniInt, X>(ExhaustiveCheck.miniInt(), List.Eq(E)),
      ),
    );

    checkAll(
      'MonadDefer<Eval, MiniInt, *>>',
      MonadDeferSuite(
        Kleisli.MonadDefer<EvalF, MiniInt>(MonadDefer.Eval),
      ).monadDefer(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        <X>(X: Arbitrary<X>) =>
          A.fp4tsKleisli<EvalF, MiniInt, X>(A.fp4tsEval(X)),
        <X>(E: Eq<X>) =>
          eqKleisli<EvalF, MiniInt, X>(ExhaustiveCheck.miniInt(), Eq.Eval(E)),
      ),
    );

    checkAll(
      'MonadPlus<Option, MiniInt, *>>',
      MonadPlusSuite(
        Kleisli.MonadPlus<OptionF, MiniInt>(Option.MonadPlus),
      ).monadPlus(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        <X>(X: Arbitrary<X>) =>
          A.fp4tsKleisli<OptionF, MiniInt, X>(A.fp4tsOption(X)),
        <X>(E: Eq<X>) =>
          eqKleisli<OptionF, MiniInt, X>(
            ExhaustiveCheck.miniInt(),
            Option.Eq(E),
          ),
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
            ExhaustiveCheck.miniInt(),
            Either.Eq(Eq.fromUniversalEquals(), E),
          ),
      ),
    );
  });
});
