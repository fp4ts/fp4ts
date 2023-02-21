// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { fst, Kind, pipe, snd } from '@fp4ts/core';
import { Strong } from '@fp4ts/cats-profunctor';
import { IsEq } from '@fp4ts/cats-test-kit';
import { ProfunctorLaws } from './profunctor-laws';

export const StrongLaws = <P>(P: Strong<P>) => ({
  ...ProfunctorLaws(P),

  /**
   * first == dimap swap swap . second
   */
  firstIsSwappedSecond:
    <C>() =>
    <A, B>(pab: Kind<P, [A, B]>): IsEq<Kind<P, [[A, C], [B, C]]>> =>
      new IsEq(
        P.first<C>()(pab),
        pipe(P.second<C>()(pab), P.dimap(swap, swap)),
      ),

  /**
   * second == dimap swap swap . first
   */
  secondIsSwappedFirst:
    <C>() =>
    <A, B>(pab: Kind<P, [A, B]>): IsEq<Kind<P, [[C, A], [C, B]]>> =>
      new IsEq(
        P.second<C>()(pab),
        pipe(P.first<C>()(pab), P.dimap(swap, swap)),
      ),

  /**
   * lmap fst == rmap fst . first
   */
  lmapEqualsFirstAndThenRmap:
    <C>() =>
    <A, B>(pab: Kind<P, [A, B]>): IsEq<Kind<P, [[A, C], B]>> =>
      new IsEq(P.lmap_(pab, fst), pipe(P.first<C>()(pab), P.rmap(fst))),

  /**
   * lmap snd == rmap snd . second
   */
  lmapEqualsSecondAndThenRmap:
    <C>() =>
    <A, B>(pab: Kind<P, [A, B]>): IsEq<Kind<P, [[C, A], B]>> =>
      new IsEq(
        P.lmap_<A, B, [C, A]>(pab, snd),
        pipe(P.second<C>()(pab), P.rmap(snd)),
      ),

  /**
   * lmap (second f) . first == rmap (second f) . first
   */
  dinaturalityFirst: <A, B, C, D>(
    pab: Kind<P, [A, B]>,
    f: (c: C) => D,
  ): IsEq<Kind<P, [[A, C], [B, D]]>> =>
    new IsEq(
      pipe(P.first<C>()(pab), P.rmap(mapSnd(f))),
      pipe(P.first<D>()(pab), P.lmap(mapSnd(f))),
    ),

  /**
   * lmap (first f) . second == rmap (first f) . second
   */
  dinaturalitySecond: <A, B, C, D>(
    pab: Kind<P, [A, B]>,
    f: (c: C) => D,
  ): IsEq<Kind<P, [[C, A], [D, B]]>> =>
    new IsEq(
      pipe(P.second<C>()(pab), P.rmap(mapFst(f))),
      pipe(P.second<D>()(pab), P.lmap(mapFst(f))),
    ),

  /**
   * first . first == dimap assoc unassoc . first where
   *   assoc ((a,b),c) = (a,(b,c))
   *   unassoc (a,(b,c)) = ((a,b),c)
   */
  firstFirstIsDimap:
    <C, D>() =>
    <A, B>(pab: Kind<P, [A, B]>): IsEq<Kind<P, [[[A, C], D], [[B, C], D]]>> =>
      new IsEq(
        pipe(pab, P.first<C>(), P.first<D>()),
        pipe(pab, P.first<[C, D]>(), P.dimap(assoc, unassoc)),
      ),

  /**
   * second . second == dimap unassoc assoc . second where
   *   assoc ((a,b),c) = (a,(b,c))
   *   unassoc (a,(b,c)) = ((a,b),c)
   */
  secondSecondIsDimap:
    <C, D>() =>
    <A, B>(pab: Kind<P, [A, B]>): IsEq<Kind<P, [[D, [C, A]], [D, [C, B]]]>> =>
      new IsEq(
        pipe(pab, P.second<C>(), P.second<D>()),
        pipe(pab, P.second<[D, C]>(), P.dimap(unassoc, assoc)),
      ),
});

const swap = <X, Y>([x, y]: [X, Y]): [Y, X] => [y, x];

const mapFst =
  <X, Y, Z>(f: (x: X) => Z) =>
  (cb: [X, Y]): [Z, Y] =>
    [f(cb[0]), cb[1]];
const mapSnd =
  <X, Y, Z>(f: (y: Y) => Z) =>
  (cb: [X, Y]): [X, Z] =>
    [cb[0], f(cb[1])];

const assoc = <A, B, C>([[a, b], c]: [[A, B], C]): [A, [B, C]] => [a, [b, c]];
const unassoc = <A, B, C>([a, [b, c]]: [A, [B, C]]): [[A, B], C] => [[a, b], c];
