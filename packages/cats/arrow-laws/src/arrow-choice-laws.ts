// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id, Kind, pipe } from '@fp4ts/core';
import { Either, Left, Right } from '@fp4ts/cats-core/lib/data';
import { ArrowChoice } from '@fp4ts/cats-arrow';
import { ChoiceLaws } from '@fp4ts/cats-profunctor-laws';
import { IsEq } from '@fp4ts/cats-test-kit';

import { ArrowLaws } from './arrow-laws';

export const ArrowChoiceLaws = <P>(P: ArrowChoice<P>) => ({
  ...ChoiceLaws(P),
  ...ArrowLaws(P),

  arrowChoiceLiftCommutes:
    <C>() =>
    <A, B>(f: (a: A) => B) =>
      new IsEq<Kind<P, [Either<A, C>, Either<B, C>]>>(
        P.left<C>()(P.lift(f)),
        P.lift(ArrowChoice.Function1.left<C>()(f)),
      ),

  arrowChoiceLeftCompositionCommutes:
    <D>() =>
    <A, B, C>(f: Kind<P, [A, B]>, g: Kind<P, [B, C]>) =>
      new IsEq<Kind<P, [Either<A, D>, Either<C, D>]>>(
        P.left<D>()(P.andThen_(f, g)),
        P.andThen_(P.left<D>()(f), P.left<D>()(g)),
      ),

  arrowChoiceLeftAndThenLiftedLeftApplyCommutes:
    <C>() =>
    <A, B>(f: Kind<P, [A, B]>) =>
      new IsEq<Kind<P, [A, Either<B, C>]>>(
        P.andThen_(f, P.lift(Left)),
        P.andThen_(P.lift(Left), P.left<C>()(f)),
      ),

  arrowChoiceLeftAndThenRightIdentityCommutes: <A, B, C, D>(
    f: Kind<P, [A, B]>,
    g: (c: C) => D,
  ) => {
    const A = ArrowChoice.Function1;
    return new IsEq<Kind<P, [Either<A, C>, Either<B, D>]>>(
      P.andThen_(P.left<C>()(f), P.lift(A.choose_(id<B>, g))),
      P.andThen_(P.lift(A.choose_(id<A>, g)), P.left<D>()(f)),
    );
  },

  arrowChoiceLeftLeftCommutesWithSumAssoc:
    <B, C>() =>
    <A, D>(f: Kind<P, [A, D]>) =>
      new IsEq<Kind<P, [Either<Either<A, B>, C>, Either<D, Either<B, C>>]>>(
        pipe(
          f,
          P.left<B>(),
          P.left<C>(),
          // eslint-disable-next-line prettier/prettier
          P.andThen(P.lift((sumAssoc)<D, B, C>)),
        ),
        // eslint-disable-next-line prettier/prettier
        pipe(P.lift((sumAssoc)<A, B, C>), P.andThen(P.left<Either<B, C>>()(f))),
      ),
});

const sumAssoc = <A, B, C>(
  e: Either<Either<A, B>, C>,
): Either<A, Either<B, C>> =>
  e.fold(
    ab =>
      ab.fold(
        a => Left(a),
        b => Right(Left(b)),
      ),
    c => Right(Right(c)),
  );
