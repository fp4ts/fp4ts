// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { fst, id, Kind, pipe, snd } from '@fp4ts/core';
import { FunctionK } from '../../arrow';
import { Applicative } from '../../applicative';
import { Functor } from '../../functor';
import { FlatMap } from '../../flat-map';
import { AndThen } from '../and-then';

import { IndexedStateT } from './algebra';
import { lift } from './constructors';

// -- Point-ful operators

export const map_ =
  <F>(F: Functor<F>) =>
  <SA, A, B, SB = SA>(
    self: IndexedStateT<F, SA, SB, A>,
    f: (a: A) => B,
  ): IndexedStateT<F, SA, SB, B> =>
    transform_(F)(self, ([sb, a]) => [sb, f(a)]);

export const mapK_ =
  <F>(F: Functor<F>) =>
  <G, SA, SB, A>(
    self: IndexedStateT<F, SA, SB, A>,
    nt: FunctionK<F, G>,
  ): IndexedStateT<G, SA, SB, A> =>
    new IndexedStateT(
      nt(
        F.map_(self.runF, safsba => AndThen(safsba).andThen(fsba => nt(fsba))),
      ),
    );

export const contramap_ =
  <F>(F: Functor<F>) =>
  <S0, SA, A, SB = SA>(
    self: IndexedStateT<F, SA, SB, A>,
    f: (s0: S0) => SA,
  ): IndexedStateT<F, S0, SB, A> =>
    new IndexedStateT(F.map_(self.runF, safsba => AndThen(safsba).compose(f)));

export const bimap_ =
  <F>(F: Functor<F>) =>
  <SB, SC, A, B, SA>(
    self: IndexedStateT<F, SA, SB, A>,
    f: (sb: SB) => SC,
    g: (a: A) => B,
  ): IndexedStateT<F, SA, SC, B> =>
    transform_(F)(self, ([sb, a]) => [f(sb), g(a)]);

export const dimap_ =
  <F>(F: Functor<F>) =>
  <S0, SA, SB, S1, A>(
    self: IndexedStateT<F, SA, SB, A>,
    f: (s0: S0) => SA,
    g: (sb: SB) => S1,
  ): IndexedStateT<F, S0, S1, A> =>
    modify_(F)(contramap_(F)(self, f), g);

export const flatMap_ =
  <F>(F: FlatMap<F>) =>
  <SA, A, B, SB = SA, SC = SB>(
    self: IndexedStateT<F, SA, SB, A>,
    fas: (a: A) => IndexedStateT<F, SB, SC, B>,
  ): IndexedStateT<F, SA, SC, B> =>
    new IndexedStateT(
      F.map_(self.runF, safsba =>
        AndThen(safsba).andThen(fsba =>
          F.flatMap_(fsba, ([sb, a]) => run_(F)(fas(a), sb)),
        ),
      ),
    );

export const flatMapF_ =
  <F>(F: FlatMap<F>) =>
  <SA, A, B, SB = SA>(
    self: IndexedStateT<F, SA, SB, A>,
    f: (a: A) => Kind<F, [B]>,
  ): IndexedStateT<F, SA, SB, B> =>
    new IndexedStateT(
      F.map_(self.runF, safsba =>
        AndThen(safsba).andThen(fsba =>
          F.flatMap_(fsba, ([sb, a]) => F.map_(f(a), b => [sb, b])),
        ),
      ),
    );

export const transform_ =
  <F>(F: Functor<F>) =>
  <SA, A, B, SB = SA, SC = SB>(
    self: IndexedStateT<F, SA, SB, A>,
    f: (sba: [SB, A]) => [SC, B],
  ): IndexedStateT<F, SA, SC, B> =>
    new IndexedStateT(
      F.map_(self.runF, safsba =>
        AndThen(safsba).andThen(fsa => F.map_(fsa, f)),
      ),
    );

export const transformF_ =
  <F, G>(F: FlatMap<F>, G: Applicative<G>) =>
  <SA, A, B, SB = SA, SC = SB>(
    self: IndexedStateT<F, SA, SB, A>,
    f: (fsba: Kind<F, [[SB, A]]>) => Kind<G, [[SC, B]]>,
  ): IndexedStateT<G, SA, SC, B> =>
    lift(G)(sa => f(run_(F)(self, sa)));

export const modify_ =
  <F>(F: Functor<F>) =>
  <SA, SB, SC, A>(
    self: IndexedStateT<F, SA, SB, A>,
    f: (sb: SB) => SC,
  ): IndexedStateT<F, SA, SC, A> =>
    transform_(F)(self, ([sb, a]) => [f(sb), a]);

export const inspect_ =
  <F>(F: Functor<F>) =>
  <SA, SB, A, B>(
    self: IndexedStateT<F, SA, SB, A>,
    f: (sa: SB) => B,
  ): IndexedStateT<F, SA, SB, B> =>
    transform_(F)(self, ([sb]) => [sb, f(sb)]);

export const get_ =
  <F>(F: Functor<F>) =>
  <SA, SB, A>(
    self: IndexedStateT<F, SA, SB, A>,
  ): IndexedStateT<F, SA, SB, SB> =>
    inspect_(F)(self, id);

export const run_ =
  <F>(F: FlatMap<F>) =>
  <SA, SB, A>(
    self: IndexedStateT<F, SA, SB, A>,
    initial: SA,
  ): Kind<F, [[SB, A]]> =>
    F.flatMap_(self.runF, f => f(initial));

export const runS_ =
  <F>(F: FlatMap<F>) =>
  <SA, SB, A>(self: IndexedStateT<F, SA, SB, A>, initial: SA): Kind<F, [SB]> =>
    pipe(
      self.runF,
      F.flatMap(f => f(initial)),
      F.map(fst),
    );

export const runA_ =
  <F>(F: FlatMap<F>) =>
  <SA, SB, A>(self: IndexedStateT<F, SA, SB, A>, initial: SA): Kind<F, [A]> =>
    pipe(
      self.runF,
      F.flatMap(f => f(initial)),
      F.map(snd),
    );
