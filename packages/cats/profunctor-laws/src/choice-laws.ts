// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, pipe } from '@fp4ts/core';
import { Choice } from '@fp4ts/cats-profunctor';
import { Either, Left, Right } from '@fp4ts/cats-core/lib/data';
import { IsEq } from '@fp4ts/cats-test-kit';
import { ProfunctorLaws } from './profunctor-laws';

export const ChoiceLaws = <P>(P: Choice<P>) => ({
  ...ProfunctorLaws(P),

  /**
   * left == dimap swap swap . right
   */
  leftIsSwappedRight:
    <C>() =>
    <A, B>(pab: Kind<P, [A, B]>): IsEq<Kind<P, [Either<A, C>, Either<B, C>]>> =>
      new IsEq(P.left<C>()(pab), pipe(P.right<C>()(pab), P.dimap(swap, swap))),

  /**
   * right == dimap swap swap . left
   */
  rightIsSwappedLeft:
    <C>() =>
    <A, B>(pab: Kind<P, [A, B]>): IsEq<Kind<P, [Either<C, A>, Either<C, B>]>> =>
      new IsEq(P.right<C>()(pab), pipe(P.left<C>()(pab), P.dimap(swap, swap))),

  /**
   * rmap Left == lmap Left . left
   */
  rmapLeftIsLmapLeftAndThenLeft:
    <C>() =>
    <A, B>(pab: Kind<P, [A, B]>): IsEq<Kind<P, [A, Either<B, C>]>> =>
      new IsEq(
        P.rmap_(pab, Left<B, C>),
        pipe(P.left<C>()(pab), P.lmap(Left<A, C>)),
      ),

  /**
   * rmap Right == lmap Right . right
   */
  rmapRightIsLmapRightAndThenRight:
    <C>() =>
    <A, B>(pab: Kind<P, [A, B]>): IsEq<Kind<P, [A, Either<C, B>]>> =>
      new IsEq(
        P.rmap_(pab, Right<B, C>),
        pipe(P.right<C>()(pab), P.lmap(Right<A, C>)),
      ),

  /**
   * lmap (right f) . left == rmap (right f) . left
   */
  dinaturalityLeft: <A, B, C, D>(
    pab: Kind<P, [A, B]>,
    f: (c: C) => D,
  ): IsEq<Kind<P, [Either<A, C>, Either<B, D>]>> =>
    new IsEq(
      pipe(
        P.left<C>()(pab),
        P.rmap(ea => ea.map(f)),
      ),
      pipe(
        P.left<D>()(pab),
        P.lmap(ea => ea.map(f)),
      ),
    ),

  /**
   * lmap (left f) . right == rmap (left f) . right
   */
  dinaturalityRight: <A, B, C, D>(
    pab: Kind<P, [A, B]>,
    f: (c: C) => D,
  ): IsEq<Kind<P, [Either<C, A>, Either<D, B>]>> =>
    new IsEq(
      pipe(
        P.right<C>()(pab),
        P.rmap(ea => ea.leftMap(f)),
      ),
      pipe(
        P.right<D>()(pab),
        P.lmap(ea => ea.leftMap(f)),
      ),
    ),

  /**
   * left . left == dimap assoc unassoc . left
   */
  leftLeftIsIsDimap:
    <C, D>() =>
    <A, B>(pab: Kind<P, [A, B]>) =>
      new IsEq(
        pipe(pab, P.left<C>(), P.left<D>()),
        pipe(pab, P.left<Either<C, D>>(), P.dimap(assoc, unassoc)),
      ),

  /**
   * right . right == dimap unassoc assoc . right
   */
  rightRightIsIsDimap:
    <C, D>() =>
    <A, B>(pab: Kind<P, [A, B]>) =>
      new IsEq(
        pipe(pab, P.right<C>(), P.right<D>()),
        pipe(pab, P.right<Either<D, C>>(), P.dimap(unassoc, assoc)),
      ),
});

const swap = <A, B>(ea: Either<A, B>): Either<B, A> => ea.swapped;

const assoc = <A, B, C>(e: Either<Either<A, B>, C>): Either<A, Either<B, C>> =>
  e.fold(
    ab =>
      ab.fold(
        a => Left(a),
        b => Right(Left(b)),
      ),
    c => Right(Right(c)),
  );

const unassoc = <A, B, C>(
  e: Either<A, Either<B, C>>,
): Either<Either<A, B>, C> =>
  e.fold(
    a => Left(Left(a)),
    bc =>
      bc.fold(
        b => Left(Right(b)),
        c => Right(c),
      ),
  );
