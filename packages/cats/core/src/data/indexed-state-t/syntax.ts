// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Applicative } from '../../applicative';
import { FunctionK } from '../../arrow';
import { FlatMap } from '../../flat-map';
import { Functor } from '../../functor';

import { IndexedStateT } from './algebra';
import {
  bimap_,
  contramap_,
  dimap_,
  flatMapF_,
  flatMap_,
  get_,
  inspect_,
  mapK_,
  map_,
  modify_,
  runA_,
  runS_,
  run_,
  transformF_,
  transform_,
} from './operators';

declare module './algebra' {
  interface IndexedStateT<F, SA, SB, A> {
    map(F: Functor<F>): <B>(f: (a: A) => B) => IndexedStateT<F, SA, SB, B>;
    mapK(
      F: Functor<F>,
    ): <G>(nt: FunctionK<F, G>) => IndexedStateT<G, SA, SB, A>;

    flatMap(
      F: FlatMap<F>,
    ): <B, SC>(
      f: (a: A) => IndexedStateT<F, SB, SC, B>,
    ) => IndexedStateT<F, SA, SC, B>;
    flatMapF(
      F: FlatMap<F>,
    ): <B>(f: (a: A) => Kind<F, [B]>) => IndexedStateT<F, SA, SB, B>;

    contramap(
      F: Functor<F>,
    ): <S0>(f: (s0: S0) => SA) => IndexedStateT<F, S0, SB, A>;

    bimap(
      F: Functor<F>,
    ): <SC, B>(
      f: (sb: SB) => SC,
      g: (a: A) => B,
    ) => IndexedStateT<F, SA, SC, B>;

    dimap(
      F: Functor<F>,
    ): <S0, S1>(
      f: (s0: S0) => SA,
      g: (sb: SB) => S1,
    ) => IndexedStateT<F, S0, S1, A>;

    transform<F>(
      F: Functor<F>,
    ): <B, SC>(f: (sba: [SB, A]) => [SC, B]) => IndexedStateT<F, SA, SC, B>;
    transformF<G>(
      F: FlatMap<F>,
      G: Applicative<G>,
    ): <B, SC>(
      f: (sba: [SB, A]) => Kind<G, [[SC, B]]>,
    ) => IndexedStateT<F, SA, SC, B>;

    modify(
      F: Functor<F>,
    ): <SC>(f: (sb: SB) => SC) => IndexedStateT<F, SA, SC, A>;

    inspect(
      F: Functor<F>,
    ): <B>(f: (sb: SB) => B) => IndexedStateT<F, SA, SB, B>;

    get(F: Functor<F>): IndexedStateT<F, SA, SB, SB>;

    run(F: FlatMap<F>): (initial: SA) => Kind<F, [[SB, A]]>;
    runS(F: FlatMap<F>): (initial: SA) => Kind<F, [SB]>;
    runA(F: FlatMap<F>): (initial: SA) => Kind<F, [A]>;
  }
}

IndexedStateT.prototype.map = function (F) {
  return f => map_(F)(this, f);
};
IndexedStateT.prototype.mapK = function (F) {
  return nt => mapK_(F)(this, nt);
};

IndexedStateT.prototype.flatMap = function (F) {
  return f => flatMap_(F)(this, f);
};
IndexedStateT.prototype.flatMapF = function (F) {
  return f => flatMapF_(F)(this, f);
};

IndexedStateT.prototype.contramap = function (F) {
  return f => contramap_(F)(this, f);
};
IndexedStateT.prototype.bimap = function (F) {
  return (f, g) => bimap_(F)(this, f, g);
};
IndexedStateT.prototype.dimap = function (F) {
  return (f, g) => dimap_(F)(this, f, g);
};

IndexedStateT.prototype.transform = function (F) {
  return f => transform_(F)(this, f);
};
IndexedStateT.prototype.transformF = function (F, G) {
  return f => transformF_(F, G)(this, f);
};

IndexedStateT.prototype.modify = function (F) {
  return f => modify_(F)(this, f);
};
IndexedStateT.prototype.inspect = function (F) {
  return f => inspect_(F)(this, f);
};
IndexedStateT.prototype.get = function (F) {
  return get_(F)(this);
};
IndexedStateT.prototype.run = function (F) {
  return initial => run_(F)(this, initial);
};
IndexedStateT.prototype.runS = function (F) {
  return initial => runS_(F)(this, initial);
};
IndexedStateT.prototype.runA = function (F) {
  return initial => runA_(F)(this, initial);
};
