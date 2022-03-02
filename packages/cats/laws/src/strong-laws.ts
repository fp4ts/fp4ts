// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { fst, Kind, pipe, snd } from '@fp4ts/core';
import { Strong } from '@fp4ts/cats-core';
import { IsEq } from '@fp4ts/cats-test-kit';
import { ProfunctorLaws } from './profunctor-laws';

export const StrongLaws = <F>(F: Strong<F>) => ({
  ...ProfunctorLaws(F),

  /**
   * first' == dimap swap swap . second'
   */
  firstIsSwappedSecond: <A, B, C>(
    fab: Kind<F, [A, B]>,
  ): IsEq<Kind<F, [[A, C], [B, C]]>> =>
    new IsEq(F.first(fab), pipe(F.second(fab), F.dimap(swapTuple, swapTuple))),

  /**
   * second' == dimap swap swap . first'
   */
  secondIsSwappedFirst: <A, B, C>(
    fab: Kind<F, [A, B]>,
  ): IsEq<Kind<F, [[C, A], [C, B]]>> =>
    new IsEq(F.second(fab), pipe(F.first(fab), F.dimap(swapTuple, swapTuple))),

  /**
   * lmap fst == rmap fst . first'
   */
  lmapEqualsFirstAndThenRmap: <A, B, C>(
    fab: Kind<F, [A, B]>,
  ): IsEq<Kind<F, [[A, C], B]>> =>
    new IsEq(F.lmap_(fab, fst), pipe(F.first(fab), F.rmap(fst))),

  /**
   * lmap snd == rmap snd . second'
   */
  lmapEqualsSecondAndThenRmap: <A, B, C>(
    fab: Kind<F, [A, B]>,
  ): IsEq<Kind<F, [[C, A], B]>> =>
    new IsEq(F.lmap_<A, B, [C, A]>(fab, snd), pipe(F.second(fab), F.rmap(snd))),

  /**
   * lmap (second f) . first == rmap (second f) . first
   */
  dinaturalityFirst: <A, B, C, D>(
    fab: Kind<F, [A, B]>,
    f: (c: C) => D,
  ): IsEq<Kind<F, [[A, C], [B, D]]>> =>
    new IsEq(
      pipe(F.first(fab), F.rmap(mapSecond(f))),
      pipe(F.first(fab), F.lmap(mapSecond(f))),
    ),

  /**
   * lmap (first f) . second == rmap (first f) . second
   */
  dinaturalitySecond: <A, B, C, D>(
    fab: Kind<F, [A, B]>,
    f: (c: C) => D,
  ): IsEq<Kind<F, [[C, A], [D, B]]>> =>
    new IsEq(
      pipe(F.second(fab), F.rmap(mapFirst(f))),
      pipe(F.second(fab), F.lmap(mapFirst(f))),
    ),

  /**
   * first' . first' == dimap assoc unassoc . first' where
   *   assoc ((a,b),c) = (a,(b,c))
   *   unassoc (a,(b,c)) = ((a,b),c)
   */
  firstFirstIsDimap: <A, B, C, D>(
    fab: Kind<F, [A, B]>,
  ): IsEq<Kind<F, [[[A, C], D], [[B, C], D]]>> =>
    new IsEq(
      pipe(fab, F.first, F.first),
      pipe(
        fab,
        F.first,
        F.dimap<[A, [C, D]], [B, [C, D]], [[A, C], D], [[B, C], D]>(
          assoc,
          unassoc,
        ),
      ),
    ),

  /**
   * second' . second' == dimap unassoc assoc . second' where
   *   assoc ((a,b),c) = (a,(b,c))
   *   unassoc (a,(b,c)) = ((a,b),c)
   */
  secondSecondIsDimap: <A, B, C, D>(
    fab: Kind<F, [A, B]>,
  ): IsEq<Kind<F, [[D, [C, A]], [D, [C, B]]]>> =>
    new IsEq(
      pipe(fab, F.second, F.second),
      pipe(
        fab,
        F.second,
        F.dimap<[[D, C], A], [[D, C], B], [D, [C, A]], [D, [C, B]]>(
          unassoc,
          assoc,
        ),
      ),
    ),
});

const swapTuple = <X, Y>([x, y]: [X, Y]): [Y, X] => [y, x];

const mapFirst =
  <X, Y, Z>(f: (x: X) => Z) =>
  (cb: [X, Y]): [Z, Y] =>
    [f(cb[0]), cb[1]];
const mapSecond =
  <X, Y, Z>(f: (y: Y) => Z) =>
  (cb: [X, Y]): [X, Z] =>
    [cb[0], f(cb[1])];

const assoc = <A, B, C>([[a, b], c]: [[A, B], C]): [A, [B, C]] => [a, [b, c]];
const unassoc = <A, B, C>([a, [b, c]]: [A, [B, C]]): [[A, B], C] => [[a, b], c];
