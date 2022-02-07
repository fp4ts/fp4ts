// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { isTypeClassInstance, Kind } from '@fp4ts/core';
import { Semigroup, Monoid } from '@fp4ts/cats-kernel';
import { Functor } from '../../functor';
import { Contravariant } from '../../contravariant';
import { Apply } from '../../apply';
import { FlatMap } from '../../flat-map';
import { FunctionK } from '../../arrow';
import { Identity } from '../identity';

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
    written(this: Writer<L, V>): Kind<F, [L]>;
    written(F: Functor<F>): Kind<F, [L]>;

    value(this: Writer<L, V>): Kind<F, [V]>;
    value(F: Functor<F>): Kind<F, [L]>;

    listen(this: Writer<L, V>): Writer<L, [L, V]>;
    listen(F: Functor<F>): WriterT<F, L, [L, V]>;

    swap(this: Writer<L, V>): Writer<V, L>;
    swap(F: Functor<F>): WriterT<F, V, L>;

    reset(this: Writer<L, V>, L: Monoid<L>): Writer<L, V>;
    reset(F: Functor<F>, L: Monoid<L>): WriterT<F, L, V>;

    tell(this: Writer<L, V>, L: Semigroup<L>): (l: L) => Writer<L, V>;
    tell(F: Functor<F>, L: Semigroup<L>): (l: L) => WriterT<F, L, V>;
    '<<<'(this: Writer<L, V>, L: Semigroup<L>): (l: L) => Writer<L, V>;
    '<<<'(F: Functor<F>, L: Semigroup<L>): (l: L) => WriterT<F, L, V>;

    bimap<M, U>(
      this: Writer<L, V>,
      f: (l: L) => M,
      g: (v: V) => U,
    ): Writer<M, V>;
    bimap(
      F: Functor<F>,
    ): <M, U>(f: (l: L) => M, g: (v: V) => U) => Writer<M, V>;

    mapWritten<M>(this: Writer<L, V>, f: (l: L) => M): Writer<M, V>;
    mapWritten(F: Functor<F>): <M>(f: (l: L) => M) => WriterT<F, M, V>;

    map<U>(this: Writer<L, V>, g: (v: V) => U): Writer<L, U>;
    map(F: Functor<F>): <U>(g: (v: V) => U) => WriterT<F, L, U>;

    mapK<G>(nt: FunctionK<F, G>): WriterT<G, L, V>;

    contramap(F: Contravariant<F>): <Z>(f: (z: Z) => V) => WriterT<F, L, Z>;

    map2(
      this: Writer<L, V>,
      L: Semigroup<L>,
    ): <U, Z>(that: Writer<L, U>, f: (v: V, u: U) => Z) => Writer<L, U>;
    map2(
      F: Apply<F>,
      L: Semigroup<L>,
    ): <U, Z>(that: WriterT<F, L, U>, f: (v: V, u: U) => Z) => WriterT<F, L, U>;

    product(
      this: Writer<L, V>,
      L: Semigroup<L>,
    ): <U>(that: Writer<L, U>) => Writer<L, [V, U]>;
    product(
      F: Apply<F>,
      L: Semigroup<L>,
    ): <U>(that: WriterT<F, L, U>) => WriterT<F, L, [V, U]>;

    productL(
      this: Writer<L, V>,
      L: Semigroup<L>,
    ): <U>(that: Writer<L, U>) => Writer<L, V>;
    productL(
      F: Apply<F>,
      L: Semigroup<L>,
    ): <U>(that: WriterT<F, L, U>) => WriterT<F, L, V>;

    productR(
      this: Writer<L, V>,
      L: Semigroup<L>,
    ): <U>(that: Writer<L, U>) => Writer<L, U>;
    productR(
      F: Apply<F>,
      L: Semigroup<L>,
    ): <U>(that: WriterT<F, L, U>) => WriterT<F, L, U>;

    flatMap(
      this: Writer<L, V>,
      L: Semigroup<L>,
    ): <U>(f: (v: V) => Writer<L, U>) => Writer<L, U>;
    flatMap(
      F: FlatMap<F>,
      L: Semigroup<L>,
    ): <U>(f: (v: V) => WriterT<F, L, U>) => WriterT<F, L, U>;

    flatten(this: Writer<L, Writer<L, V>>, L: Semigroup<L>): Writer<L, V>;
    flatten(
      this: WriterT<F, L, WriterT<F, L, V>>,
      F: FlatMap<F>,
      L: Semigroup<L>,
    ): WriterT<F, L, V>;
  }
}

WriterT.prototype.written = function (F: any = Identity.Functor) {
  return written(F)(this);
};
WriterT.prototype.value = function (F: any = Identity.Functor) {
  return value(F)(this);
};
WriterT.prototype.listen = function (F: any = Identity.Functor) {
  return listen(F)(this);
};
WriterT.prototype.swap = function (F: any = Identity.Functor) {
  return swap(F)(this);
};
WriterT.prototype.reset = function (this: any, ...xs: any[]) {
  return xs.length === 1
    ? reset(Identity.Functor, xs[0])(this)
    : reset(xs[0], xs[1])(this);
} as any;
WriterT.prototype.tell = function (this: any, ...xs: any[]) {
  return xs.length === 1
    ? (l: any) => tell_(Identity.Functor, xs[0])(this, l)
    : (l: any) => tell_(xs[0], xs[1])(this, l);
} as any;
WriterT.prototype['<<<'] = WriterT.prototype.tell;

WriterT.prototype.bimap = function (this: any, ...xs: any[]) {
  return xs.length === 2
    ? bimap_(Identity.Functor)(this, xs[0], xs[1])
    : (f: any, g: any) => bimap_(xs[0])(this, f, g);
} as any;
WriterT.prototype.mapWritten = function (this: any, F: any) {
  return isTypeClassInstance<Functor<any>>(F)
    ? (f: any) => mapWritten_(F)(this, f)
    : mapWritten_(Identity.Functor)(this, F);
} as any;
WriterT.prototype.map = function (this: any, F: any) {
  return isTypeClassInstance<Functor<any>>(F)
    ? (f: any) => map_(F)(this, f)
    : map_(Identity.Functor)(this, F);
} as any;

WriterT.prototype.mapK = function (nt) {
  return mapK_(this, nt);
};

WriterT.prototype.contramap = function (F) {
  return f => contramap_(F)(this, f);
};

WriterT.prototype.map2 = function (this: any, ...xs: any[]) {
  return xs.length === 2
    ? (that: any, f: any) => map2_(xs[0], xs[1])(this, that, f)
    : (that: any, f: any) => map2_(Identity.Apply, xs[0])(this, that, f);
} as any;
WriterT.prototype.product = function (this: any, ...xs: any[]) {
  return xs.length === 2
    ? (that: any) => product_(xs[0], xs[1])(this, that)
    : (that: any) => product_(Identity.Apply, xs[0])(this, that);
} as any;
WriterT.prototype.productL = function (this: any, ...xs: any[]) {
  return xs.length === 2
    ? (that: any) => productL_(xs[0], xs[1])(this, that)
    : (that: any) => productL_(Identity.Apply, xs[0])(this, that);
} as any;
WriterT.prototype.productR = function (this: any, ...xs: any[]) {
  return xs.length === 2
    ? (that: any) => productR_(xs[0], xs[1])(this, that)
    : (that: any) => productR_(Identity.Apply, xs[0])(this, that);
} as any;

WriterT.prototype.flatMap = function (this: any, ...xs: any[]) {
  return xs.length === 2
    ? (f: any) => flatMap_(xs[0], xs[1])(this, f)
    : (f: any) => flatMap_(Identity.FlatMap, xs[0])(this, f);
} as any;
WriterT.prototype.flatten = function (this: any, ...xs: any[]) {
  return xs.length === 2
    ? flatten(xs[0], xs[1])(this)
    : flatten(Identity.FlatMap, xs[0])(this);
} as any;
