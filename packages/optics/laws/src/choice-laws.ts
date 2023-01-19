// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, pipe } from '@fp4ts/core';
import { Either, Left, Right } from '@fp4ts/cats';
import { ProfunctorLaws } from '@fp4ts/cats-laws';
import { Choice } from '@fp4ts/optics-kernel';
import { IsEq } from '@fp4ts/cats-test-kit';

export const ChoiceLaws = <P>(P: Choice<P>) => ({
  ...ProfunctorLaws(P),

  leftConsistentWithRight:
    <C>() =>
    <A, B>(pab: Kind<P, [A, B]>): IsEq<Kind<P, [Either<A, C>, Either<B, C>]>> =>
      new IsEq(
        P.left<C>()(pab),
        pipe(
          P.right<C>()(pab),
          P.dimap(
            ac => ac.swapped,
            cb => cb.swapped,
          ),
        ),
      ),

  rightConsistentWithLeft:
    <C>() =>
    <A, B>(pab: Kind<P, [A, B]>): IsEq<Kind<P, [Either<C, A>, Either<C, B>]>> =>
      new IsEq(
        P.right<C>()(pab),
        pipe(
          P.left<C>()(pab),
          P.dimap(
            ac => ac.swapped,
            cb => cb.swapped,
          ),
        ),
      ),

  // rmap Left ≡ lmap Left . left
  rmapLeftIsLmapLeftAndLeft:
    <C>() =>
    <A, B>(pab: Kind<P, [A, B]>): IsEq<Kind<P, [A, Either<B, C>]>> =>
      new IsEq(P.rmap_(pab, Left), P.lmap_(P.left<C>()(pab), Left)),

  // rmap Right ≡ lmap Right . right
  rmapRightIsLmapRightAndRight:
    <C>() =>
    <A, B>(pab: Kind<P, [A, B]>): IsEq<Kind<P, [A, Either<C, B>]>> =>
      new IsEq(P.rmap_(pab, Right), P.lmap_(P.right<C>()(pab), Right)),
});

const assoc =
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

const unassoc =
  <A, B, C>() =>
  (e: Either<A, Either<B, C>>): Either<Either<A, B>, C> =>
    e.fold(
      a => Left(Left(a)),
      bc =>
        bc.fold(
          b => Left(Right(b)),
          c => Right(c),
        ),
    );
