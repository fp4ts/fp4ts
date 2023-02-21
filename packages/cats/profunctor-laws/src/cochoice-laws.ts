// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, pipe } from '@fp4ts/core';
import { Either, Left, Right } from '@fp4ts/cats-core/lib/data';
import { Cochoice } from '@fp4ts/cats-profunctor';
import { IsEq } from '@fp4ts/cats-test-kit';
import { ProfunctorLaws } from './profunctor-laws';

export const CochoiceLaws = <P>(P: Cochoice<P>) => ({
  ...ProfunctorLaws(P),

  /**
   * unleft == unright . dimap swap swap
   */
  unleftIsSwappedUnright: <A, B, C>(
    pab: Kind<P, [Either<A, never>, Either<B, never>]>,
  ) =>
    // eslint-disable-next-line prettier/prettier
    new IsEq(P.unleft(pab), pipe(P.dimap_(pab, (swap)<C, A>, swap), P.unright)),

  /**
   * unright == unleft . dimap swap swap
   */
  unrightIsSwappedUnleft: <A, B, C>(
    pab: Kind<P, [Either<never, A>, Either<never, B>]>,
  ) =>
    // eslint-disable-next-line prettier/prettier
    new IsEq(P.unright(pab), pipe(P.dimap_(pab, (swap)<A, C>, swap), P.unleft)),

  /**
   * rmap (either id absurd) == unleft . lmap (either id absurd)
   */
  rmapGetLeftIsLmapGetLeftAndThenUnleft: <A, B>(
    pab: Kind<P, [A, Either<B, never>]>,
  ) =>
    new IsEq(
      P.rmap_(pab, ea => ea.getLeft),
      P.unleft(P.lmap_(pab, ea => ea.getLeft)),
    ),

  /**
   * rmap (either id absurd) == unleft . lmap (either id absurd)
   */
  rmapGetIsLmapGetAndThenUnright: <A, B>(pab: Kind<P, [A, Either<never, B>]>) =>
    new IsEq(
      P.rmap_(pab, ea => ea.get),
      P.unright(P.lmap_(pab, ea => ea.get)),
    ),

  /**
   * unleft . lmap (map f) == unleft . rmap (map f)
   */
  dinatrualityUnleft: <A, B, C, D>(
    pab: Kind<P, [Either<A, C>, Either<B, D>]>,
    f: (d: D) => C,
  ): IsEq<Kind<P, [A, B]>> =>
    new IsEq(
      P.unleft(P.lmap_(pab, (ea: Either<A, D>) => ea.map(f))),
      P.unleft(P.rmap_(pab, (ea: Either<B, D>) => ea.map(f))),
    ),

  /**
   * unright . lmap (leftMap f) == unright . rmap (leftMap f)
   */
  dinatrualityUnright: <A, B, C, D>(
    pab: Kind<P, [Either<C, A>, Either<D, B>]>,
    f: (d: D) => C,
  ): IsEq<Kind<P, [A, B]>> =>
    new IsEq(
      P.unright(P.lmap_(pab, (ea: Either<D, A>) => ea.leftMap(f))),
      P.unright(P.rmap_(pab, (ea: Either<D, B>) => ea.leftMap(f))),
    ),

  /**
   * unleft . unleft == unleft . dimap unassoc assoc where
   */
  unleftUnleftIsDimap: <A, B, C, D>(
    pab: Kind<P, [Either<Either<A, C>, D>, Either<Either<B, C>, D>]>,
  ) =>
    new IsEq(P.unleft(P.unleft(pab)), P.unleft(P.dimap_(pab, unassoc, assoc))),

  /**
   * unright . unright == unright . dimap assoc unassoc
   */
  unrightUnrightIsDimap: <A, B, C, D>(
    pab: Kind<P, [Either<D, Either<C, A>>, Either<D, Either<C, B>>]>,
  ) =>
    new IsEq(
      P.unright(P.unright(pab)),
      P.unright(P.dimap_(pab, assoc, unassoc)),
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
