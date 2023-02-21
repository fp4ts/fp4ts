// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, tupled } from '@fp4ts/core';
import { Costrong } from '@fp4ts/cats-profunctor';
import { IsEq } from '@fp4ts/cats-test-kit';
import { ProfunctorLaws } from './profunctor-laws';

export const CostrongLaws = <P>(P: Costrong<P>) => ({
  ...ProfunctorLaws(P),

  /**
   * first == dimap swap swap . second
   */
  unfirstIsSwappedUnsecond: <A, B, C>(
    fab: Kind<P, [[A, C], [B, C]]>,
  ): IsEq<Kind<P, [A, B]>> =>
    new IsEq(
      P.unfirst(fab),
      P.unsecond(P.dimap_<[A, C], [B, C], [C, A], [C, B]>(fab, swap, swap)),
    ),

  /**
   * second == dimap swap swap . first
   */
  unsecondIsSwappedUnfirst: <A, B, C>(
    pab: Kind<P, [[C, A], [C, B]]>,
  ): IsEq<Kind<P, [A, B]>> =>
    new IsEq(
      P.unsecond(pab),
      P.unfirst(P.dimap_<[C, A], [C, B], [A, C], [B, C]>(pab, swap, swap)),
    ),

  /**
   * lmap (, void) == unfirst . rmap (, void)
   */
  lmapIsRmapAndThenUnfirst: <A, B>(pab: Kind<P, [[A, void], B]>) =>
    new IsEq(
      P.lmap_(pab, (a: A) => tupled(a, undefined as void)),
      P.unfirst(P.rmap_(pab, b => tupled(b, undefined as void))),
    ),

  /**
   * lmap (void, ) == unsecond . rmap (void, )
   */
  lmapIsRmapAndThenUnsecond: <A, B, C>(
    pab: Kind<P, [[void, A], B]>,
  ): IsEq<Kind<P, [A, B]>> =>
    new IsEq(
      P.lmap_(pab, (a: A) => tupled(undefined as void, a)),
      P.unsecond(P.rmap_(pab, b => tupled(undefined as void, b))),
    ),

  /**
   * unfirst . lmap (second f) == unfirst . rmap (second f)
   */
  dinaturalityUnfirst: <A, B, C, D>(
    pab: Kind<P, [[A, C], [B, D]]>,
    f: (d: D) => C,
  ): IsEq<Kind<P, [A, B]>> =>
    new IsEq(
      P.unfirst(P.lmap_(pab, mapSnd(f))),
      P.unfirst(P.rmap_(pab, mapSnd(f))),
    ),

  /**
   * unsecond . lmap (first f) == unsecond . rmap (first f)
   */
  dinaturalityUnsecond: <A, B, C, D>(
    pab: Kind<P, [[C, A], [D, B]]>,
    f: (d: D) => C,
  ): IsEq<Kind<P, [A, B]>> =>
    new IsEq(
      P.unsecond(P.rmap_(pab, mapFst(f))),
      P.unsecond(P.lmap_(pab, mapFst(f))),
    ),

  /**
   * unfirst . unfirst == unfirst . dimap unassoc assoc
   */
  unfirstUnfirstIsDimap: <A, B, C, D>(
    pab: Kind<P, [[[A, C], D], [[B, C], D]]>,
  ): IsEq<Kind<P, [A, B]>> =>
    new IsEq(
      P.unfirst(P.unfirst(pab)),
      P.unfirst(
        P.dimap_<[[A, C], D], [[B, C], D], [A, [C, D]], [B, [C, D]]>(
          pab,
          unassoc,
          assoc,
        ),
      ),
    ),

  /**
   * unsecond . unsecond == unsecond . dimap assoc unassoc
   */
  unsecondUnsecondIsDimap: <A, B, C, D>(
    pab: Kind<P, [[D, [C, A]], [D, [C, B]]]>,
  ): IsEq<Kind<P, [A, B]>> =>
    new IsEq(
      P.unsecond(P.unsecond(pab)),
      P.unsecond(
        P.dimap_<[D, [C, A]], [D, [C, B]], [[D, C], A], [[D, C], B]>(
          pab,
          assoc,
          unassoc,
        ),
      ),
    ),
});

const swap = <X, Y>([x, y]: [X, Y]): [Y, X] => [y, x];

const mapFst =
  <X, Y, Z>(f: (x: X) => Z) =>
  ([x, y]: [X, Y]): [Z, Y] =>
    [f(x), y];
const mapSnd =
  <X, Y, Z>(f: (y: Y) => Z) =>
  ([x, y]: [X, Y]): [X, Z] =>
    [x, f(y)];

const assoc = <A, B, C>([ab, c]: [[A, B], C]): [A, [B, C]] =>
  ab ? [ab[0], [ab[1], c]] : [undefined as any, [undefined as any, c]];
const unassoc = <A, B, C>([a, bc]: [A, [B, C]]): [[A, B], C] =>
  bc ? [[a, bc[0]], bc[1]] : [[a, undefined as any], undefined as any];
