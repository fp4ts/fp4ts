// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, tupled } from '@fp4ts/core';
import { Defer, Functor, Unzip, Zip } from '@fp4ts/cats-core';
import { Proxy } from '@fp4ts/cats-core/lib/data';
import { Costrong } from '@fp4ts/cats-profunctor';
import { IsEq } from '@fp4ts/cats-test-kit';
import { ProfunctorLaws } from './profunctor-laws';

export const CostrongLaws = <P>(P: Costrong<P>) => ({
  ...ProfunctorLaws(P),

  /**
   * first == dimap swap swap . second
   */
  unfirstIsSwappedUnsecond:
    <F>(F: Defer<F>) =>
    <A, B, C>(fab: Kind<P, [[A, Kind<F, [C]>], [B, Kind<F, [C]>]]>) =>
      new IsEq<Kind<P, [A, B]>>(
        P.unfirst_(F, fab),
        P.unsecond_(
          F,
          P.dimap_<
            [A, Kind<F, [C]>],
            [B, Kind<F, [C]>],
            [Kind<F, [C]>, A],
            [Kind<F, [C]>, B]
          >(fab, swap, swap),
        ),
      ),

  /**
   * second == dimap swap swap . first
   */
  unsecondIsSwappedUnfirst:
    <F>(F: Defer<F>) =>
    <A, B, C>(pab: Kind<P, [[Kind<F, [C]>, A], [Kind<F, [C]>, B]]>) =>
      new IsEq<Kind<P, [A, B]>>(
        P.unsecond_(F, pab),
        P.unfirst_(
          F,
          P.dimap_<
            [Kind<F, [C]>, A],
            [Kind<F, [C]>, B],
            [A, Kind<F, [C]>],
            [B, Kind<F, [C]>]
          >(pab, swap, swap),
        ),
      ),

  /**
   * lmap (, void) == unfirst . rmap (, void)
   */
  lmapIsRmapAndThenUnfirst: <A, B>(pab: Kind<P, [[A, Proxy<void>], B]>) =>
    new IsEq(
      P.lmap_(pab, (a: A) => tupled(a, Proxy())),
      P.unfirst_(
        Proxy.Defer,
        P.rmap_(pab, b => tupled(b, Proxy())),
      ),
    ),

  /**
   * lmap (void, ) == unsecond . rmap (void, )
   */
  lmapIsRmapAndThenUnsecond: <A, B>(
    pab: Kind<P, [[Proxy<void>, A], B]>,
  ): IsEq<Kind<P, [A, B]>> =>
    new IsEq(
      P.lmap_(pab, (a: A) => tupled(Proxy(), a)),
      P.unsecond_(
        Proxy.Defer,
        P.rmap_(pab, b => tupled(Proxy(), b)),
      ),
    ),

  /**
   * unfirst . lmap (second f) == unfirst . rmap (second f)
   */
  dinaturalityUnfirst:
    <F>(F: Defer<F> & Functor<F>) =>
    <A, B, C, D>(
      pab: Kind<P, [[A, Kind<F, [C]>], [B, Kind<F, [D]>]]>,
      f: (d: D) => C,
    ) =>
      new IsEq<Kind<P, [A, B]>>(
        P.unfirst_(F, P.lmap_(pab, mapSnd(F.map(f)))),
        P.unfirst_(F, P.rmap_(pab, mapSnd(F.map(f)))),
      ),

  /**
   * unsecond . lmap (first f) == unsecond . rmap (first f)
   */
  dinaturalityUnsecond:
    <F>(F: Defer<F> & Functor<F>) =>
    <A, B, C, D>(
      pab: Kind<P, [[Kind<F, [C]>, A], [Kind<F, [D]>, B]]>,
      f: (d: D) => C,
    ) =>
      new IsEq<Kind<P, [A, B]>>(
        P.unsecond_(F, P.rmap_(pab, mapFst(F.map(f)))),
        P.unsecond_(F, P.lmap_(pab, mapFst(F.map(f)))),
      ),

  /**
   * unfirst . unfirst == unfirst . dimap unassoc assoc
   */
  unfirstUnfirstIsDimap:
    <F>(F: Defer<F> & Unzip<F>) =>
    <A, B, C, D>(
      pab: Kind<
        P,
        [[[A, Kind<F, [C]>], Kind<F, [D]>], [[B, Kind<F, [C]>], Kind<F, [D]>]]
      >,
    ) =>
      new IsEq<Kind<P, [A, B]>>(
        P.unfirst_(F, P.unfirst_(F, pab)),
        P.unfirst_(F, P.dimap_(pab, unassocF(F), assocF(F))),
      ),

  /**
   * unsecond . unsecond == unsecond . dimap assoc unassoc
   */
  unsecondUnsecondIsDimap:
    <F>(F: Defer<F> & Unzip<F>) =>
    <A, B, C, D>(
      pab: Kind<
        P,
        [[Kind<F, [D]>, [Kind<F, [C]>, A]], [Kind<F, [D]>, [Kind<F, [C]>, B]]]
      >,
    ) =>
      new IsEq<Kind<P, [A, B]>>(
        P.unsecond_(F, P.unsecond_(F, pab)),
        P.unsecond_(F, P.dimap_(pab, unassocS(F), assocS(F))),
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

const assocF =
  <F>(F: Zip<F>) =>
  <A, B, C>([[a, fb], fc]: [[A, Kind<F, [B]>], Kind<F, [C]>]): [
    A,
    Kind<F, [[B, C]]>,
  ] =>
    [a, F.zip_(fb, fc)];

const unassocF =
  <F>(F: Unzip<F>) =>
  <A, B, C>([a, fbc]: [A, Kind<F, [[B, C]]>]): [
    [A, Kind<F, [B]>],
    Kind<F, [C]>,
  ] => {
    const [fb, fc] = F.unzip(fbc);
    return [[a, fb], fc];
  };

const assocS =
  <F>(F: Zip<F>) =>
  <A, B, C>([fa, [fb, c]]: [Kind<F, [A]>, [Kind<F, [B]>, C]]): [
    Kind<F, [[A, B]]>,
    C,
  ] =>
    [F.zip_(fa, fb), c];

const unassocS =
  <F>(F: Unzip<F>) =>
  <A, B, C>([fab, c]: [Kind<F, [[A, B]]>, C]): [
    Kind<F, [A]>,
    [Kind<F, [B]>, C],
  ] => {
    const [fa, fb] = F.unzip(fab);
    return [fa, [fb, c]];
  };
