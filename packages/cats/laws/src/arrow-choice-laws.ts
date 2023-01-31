// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, pipe } from '@fp4ts/core';
import { ArrowChoice } from '@fp4ts/cats-core';
import { Either, Left, Right } from '@fp4ts/cats-core/lib/data';
import { IsEq } from '@fp4ts/cats-test-kit';

const FAC = ArrowChoice.Function1;

export const ArrowChoiceLaws = <F>(F: ArrowChoice<F>) => ({
  leftLiftCommute:
    <C>() =>
    <A, B>(f: (a: A) => B): IsEq<Kind<F, [Either<A, C>, Either<B, C>]>> =>
      new IsEq(
        F.left<C>()(F.lift(f)),
        F.lift(ArrowChoice.Function1.left<C>()(f)),
      ),

  leftComposeCommute:
    <D>() =>
    <A, B, C>(
      f: Kind<F, [A, B]>,
      g: Kind<F, [B, C]>,
    ): IsEq<Kind<F, [Either<A, D>, Either<C, D>]>> =>
      new IsEq(
        F.left<D>()(F.andThen_(f, g)),
        F.andThen_(F.left<D>()(f), F.left<D>()(g)),
      ),

  leftRightConsistent:
    <C>() =>
    <A, B>(f: (a: A) => B): IsEq<Kind<F, [Either<C, A>, Either<C, B>]>> =>
      new IsEq(
        F.right<C>()(F.lift(f)),
        pipe(
          F.lift(f),
          F.left<C>(),
          F.dimap(
            da => da.swapped,
            bc => bc.swapped,
          ),
        ),
      ),

  leftAndThenLiftedLeftApplyCommutes:
    <C>() =>
    <A, B>(fab: Kind<F, [A, B]>): IsEq<Kind<F, [A, Either<B, C>]>> =>
      new IsEq(
        F.andThen_(fab, F.lift<B, Either<B, C>>(Left)),
        F.andThen_(F.lift<A, Either<A, C>>(Left), F.left<C>()(fab)),
      ),

  leftAndThenRightIdentityCommutes: <A, B, C, D>(
    fab: Kind<F, [A, B]>,
    g: (c: C) => D,
  ): IsEq<Kind<F, [Either<A, C>, Either<B, D>]>> =>
    new IsEq(
      F.andThen_(F.left<C>()(fab), F.lift(FAC.choose(FAC.id<B>(), g))),
      F.andThen_(F.lift(FAC.choose(FAC.id<A>(), g)), F.left<D>()(fab)),
    ),

  leftTwiceCommutesWithSumAssociation:
    <B, C>() =>
    <A, D>(
      fad: Kind<F, [A, D]>,
    ): IsEq<Kind<F, [Either<Either<A, B>, C>, Either<D, Either<B, C>>]>> =>
      new IsEq(
        pipe(
          fad,
          F.left<B>(),
          F.left<C>(),
          F.andThen(F.lift(sumAssoc<D, B, C>())),
        ),
        pipe(
          F.lift(sumAssoc<A, B, C>()),
          F.andThen(F.left<Either<B, C>>()(fad)),
        ),
      ),
});

const sumAssoc =
  <A, B, C>() =>
  (e: Either<Either<A, B>, C>): Either<A, Either<B, C>> =>
    e.fold(
      ab =>
        ab.fold(
          a => Left(a),
          b => Right(Left(b)),
        ),
      c => Right(Right(c)),
    );
