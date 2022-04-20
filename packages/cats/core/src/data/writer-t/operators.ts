// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { fst, id, Kind, snd, tupled } from '@fp4ts/core';
import { Eq, Semigroup, Monoid } from '@fp4ts/cats-kernel';
import { Functor } from '../../functor';
import { Contravariant } from '../../contravariant';
import { Apply } from '../../apply';
import { FlatMap } from '../../flat-map';
import { FunctionK } from '../../arrow';

import { WriterT } from './algebra';

export const written =
  <F>(F: Functor<F>) =>
  <L, V>(flv: WriterT<F, L, V>): Kind<F, [L]> =>
    F.map_(flv.run, fst);

export const value =
  <F>(F: Functor<F>) =>
  <L, V>(flv: WriterT<F, L, V>): Kind<F, [V]> =>
    F.map_(flv.run, snd);

export const listen =
  <F>(F: Functor<F>) =>
  <L, V>(flv: WriterT<F, L, V>): WriterT<F, L, [L, V]> =>
    new WriterT(F.map_(flv.run, ([l, v]) => tupled(l, tupled(l, v))));

export const swap =
  <F>(F: Functor<F>) =>
  <L, V>(flv: WriterT<F, L, V>): WriterT<F, V, L> =>
    new WriterT(F.map_(flv.run, ([l, v]) => tupled(v, l)));

export const reset =
  <F, L>(F: Functor<F>, L: Monoid<L>) =>
  <V>(flv: WriterT<F, L, V>): WriterT<F, L, V> =>
    mapWritten_(F)(flv, () => L.empty);

export const flatten =
  <F, L>(F: FlatMap<F>, L: Monoid<L>) =>
  <V>(fflv: WriterT<F, L, WriterT<F, L, V>>): WriterT<F, L, V> =>
    flatMap_(F, L)(fflv, id);

// -- Point-ful operators

export const tell_ =
  <F, L>(F: Functor<F>, L: Semigroup<L>) =>
  <V>(flv: WriterT<F, L, V>, l2: L): WriterT<F, L, V> =>
    mapWritten_(F)(flv, l1 => L.combine_(l1, () => l2));

export const bimap_ =
  <F>(F: Functor<F>) =>
  <L, V, M, U>(
    flv: WriterT<F, L, V>,
    f: (l: L) => M,
    g: (v: V) => U,
  ): WriterT<F, M, U> =>
    new WriterT(F.map_(flv.run, ([l, v]) => tupled(f(l), g(v))));

export const mapWritten_ =
  <F>(F: Functor<F>) =>
  <L, V, M>(flv: WriterT<F, L, V>, f: (l: L) => M): WriterT<F, M, V> =>
    bimap_(F)(flv, f, id);

export const map_ =
  <F>(F: Functor<F>) =>
  <L, V, U>(flv: WriterT<F, L, V>, g: (l: V) => U): WriterT<F, L, U> =>
    bimap_(F)(flv, id, g);

export const mapK_ = <F, L, V, G>(
  flv: WriterT<F, L, V>,
  nt: FunctionK<F, G>,
): WriterT<G, L, V> => new WriterT(nt(flv.run));

export const contramap_ =
  <F>(F: Contravariant<F>) =>
  <L, V, Z>(flv: WriterT<F, L, V>, f: (z: Z) => V): WriterT<F, L, Z> =>
    new WriterT(F.contramap_(flv.run, ([l, z]) => tupled(l, f(z))));

export const ap_ =
  <F, L>(F: Apply<F>, L: Semigroup<L>) =>
  <V, Z>(
    flvz: WriterT<F, L, (v: V) => Z>,
    flv: WriterT<F, L, V>,
  ): WriterT<F, L, Z> =>
    new WriterT(
      F.map2_(
        flvz.run,
        flv.run,
      )(([l1, vz], [l2, v]) =>
        tupled(
          L.combine_(l1, () => l2),
          vz(v),
        ),
      ),
    );

export const map2_ =
  <F, L>(F: Apply<F>, L: Semigroup<L>) =>
  <V, U, Z>(
    flv: WriterT<F, L, V>,
    flu: WriterT<F, L, U>,
    f: (v: V, u: U) => Z,
  ): WriterT<F, L, Z> =>
    ap_(F, L)(
      map_(F)(flv, v => (u: U) => f(v, u)),
      flu,
    );

export const product_ =
  <F, L>(F: Apply<F>, L: Semigroup<L>) =>
  <V, U>(flv: WriterT<F, L, V>, flu: WriterT<F, L, U>): WriterT<F, L, [V, U]> =>
    map2_(F, L)(flv, flu, tupled);

export const productL_ =
  <F, L>(F: Apply<F>, L: Semigroup<L>) =>
  <V, U>(flv: WriterT<F, L, V>, flu: WriterT<F, L, U>): WriterT<F, L, V> =>
    map2_(F, L)(flv, flu, v => v);

export const productR_ =
  <F, L>(F: Apply<F>, L: Semigroup<L>) =>
  <V, U>(flv: WriterT<F, L, V>, flu: WriterT<F, L, U>): WriterT<F, L, U> =>
    map2_(F, L)(flv, flu, (_, b) => b);

export const flatMap_ =
  <F, L>(F: FlatMap<F>, L: Semigroup<L>) =>
  <V, U>(
    flv: WriterT<F, L, V>,
    f: (v: V) => WriterT<F, L, U>,
  ): WriterT<F, L, U> =>
    new WriterT(
      F.flatMap_(flv.run, ([l1, v]) =>
        F.map_(f(v).run, ([l2, u]) =>
          tupled(
            L.combine_(l1, () => l2),
            u,
          ),
        ),
      ),
    );

export const equals_ = <F, L, V>(
  E: Eq<Kind<F, [[L, V]]>>,
): Eq<WriterT<F, L, V>> => Eq.by(E, flv => flv.run);
