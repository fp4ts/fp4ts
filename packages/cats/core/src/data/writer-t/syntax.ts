// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Semigroup, Monoid } from '@fp4ts/cats-kernel';
import { Functor } from '../../functor';
import { Contravariant } from '../../contravariant';
import { Apply } from '../../apply';
import { FlatMap } from '../../flat-map';
import { FunctionK } from '../../arrow';

import { WriterT } from './algebra';
import { Writer } from './writer-t';
import {
  bimap_,
  contramap_,
  flatMap_,
  flatten,
  listen,
  map2_,
  mapK_,
  mapWritten_,
  map_,
  productL_,
  productR_,
  product_,
  reset,
  swap,
  tell_,
  value,
  written,
} from './operators';

declare module './algebra' {
  interface WriterT<F, L, V> {
    written(F: Functor<F>): Kind<F, [L]>;

    value(F: Functor<F>): Kind<F, [L]>;

    listen(F: Functor<F>): WriterT<F, L, [L, V]>;

    swap(F: Functor<F>): WriterT<F, V, L>;

    reset(F: Functor<F>, L: Monoid<L>): WriterT<F, L, V>;

    tell(F: Functor<F>, L: Semigroup<L>): (l: L) => WriterT<F, L, V>;
    log(F: Functor<F>, L: Semigroup<L>): (l: L) => WriterT<F, L, V>;

    bimap(
      F: Functor<F>,
    ): <M, U>(f: (l: L) => M, g: (v: V) => U) => Writer<M, V>;

    mapWritten(F: Functor<F>): <M>(f: (l: L) => M) => WriterT<F, M, V>;

    map(F: Functor<F>): <U>(g: (v: V) => U) => WriterT<F, L, U>;

    mapK<G>(nt: FunctionK<F, G>): WriterT<G, L, V>;

    contramap(F: Contravariant<F>): <Z>(f: (z: Z) => V) => WriterT<F, L, Z>;

    map2(
      F: Apply<F>,
      L: Semigroup<L>,
    ): <U, Z>(that: WriterT<F, L, U>, f: (v: V, u: U) => Z) => WriterT<F, L, U>;

    product(
      F: Apply<F>,
      L: Semigroup<L>,
    ): <U>(that: WriterT<F, L, U>) => WriterT<F, L, [V, U]>;

    productL(
      F: Apply<F>,
      L: Semigroup<L>,
    ): <U>(that: WriterT<F, L, U>) => WriterT<F, L, V>;

    productR(
      F: Apply<F>,
      L: Semigroup<L>,
    ): <U>(that: WriterT<F, L, U>) => WriterT<F, L, U>;

    flatMap(
      F: FlatMap<F>,
      L: Semigroup<L>,
    ): <U>(f: (v: V) => WriterT<F, L, U>) => WriterT<F, L, U>;

    flatten(
      this: WriterT<F, L, WriterT<F, L, V>>,
      F: FlatMap<F>,
      L: Semigroup<L>,
    ): WriterT<F, L, V>;
  }
}

WriterT.prototype.written = function (F) {
  return written(F)(this);
};
WriterT.prototype.value = function (F) {
  return value(F)(this);
};
WriterT.prototype.listen = function (F) {
  return listen(F)(this);
};
WriterT.prototype.swap = function (F) {
  return swap(F)(this);
};
WriterT.prototype.reset = function (F, L) {
  return reset(F, L)(this);
};
WriterT.prototype.tell = function (F, L) {
  return l => tell_(F, L)(this, l);
};
WriterT.prototype.log = WriterT.prototype.tell;

WriterT.prototype.bimap = function (this: any, F) {
  return (f, g) => bimap_(F)(this, f, g);
};
WriterT.prototype.mapWritten = function (F) {
  return f => mapWritten_(F)(this, f);
};
WriterT.prototype.map = function (F) {
  return f => map_(F)(this, f);
};

WriterT.prototype.mapK = function (nt) {
  return mapK_(this, nt);
};

WriterT.prototype.contramap = function (F) {
  return f => contramap_(F)(this, f);
};

WriterT.prototype.map2 = function (F, L) {
  return (that: any, f: any) => map2_(F, L)(this, that, f);
};
WriterT.prototype.product = function (F, L) {
  return that => product_(F, L)(this, that);
};
WriterT.prototype.productL = function (F, L) {
  return that => productL_(F, L)(this, that);
};
WriterT.prototype.productR = function (F, L) {
  return that => productR_(F, L)(this, that);
};

WriterT.prototype.flatMap = function (F, L) {
  return f => flatMap_(F, L)(this, f);
};
WriterT.prototype.flatten = function (F, L) {
  return flatten(F, L)(this);
};
