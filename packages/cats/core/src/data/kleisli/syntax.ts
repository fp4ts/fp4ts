// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { FunctionK } from '../../arrow';
import { Applicative } from '../../applicative';
import { Functor } from '../../functor';
import { FlatMap } from '../../flat-map';

import { Kleisli } from './algebra';
import {
  adaptF_,
  adapt_,
  andThen_,
  ap_,
  compose_,
  dimap_,
  flatMapF_,
  flatMap_,
  flatTapF_,
  flatTap_,
  lift_,
  map2_,
  mapK_,
  map_,
  productL_,
  productR_,
  product_,
  tap_,
} from './operators';

declare module './algebra' {
  interface Kleisli<F, A, B> {
    dimap<AA extends A, BB>(
      this: Kleisli<F, A, BB>,
      F: Functor<F>,
    ): <C>(f: (c: C) => AA) => <D>(g: (bb: BB) => D) => Kleisli<F, C, D>;

    adapt<AA>(f: (a: AA) => A): Kleisli<F, AA, B>;
    adaptF(
      F: FlatMap<F>,
    ): <AA>(f: (a: AA) => Kind<F, [A]>) => Kleisli<F, AA, B>;

    andThen<BB>(
      this: Kleisli<F, A, BB>,
      F: FlatMap<F>,
    ): <C>(that: Kleisli<F, BB, C>) => Kleisli<F, A, C>;
    '>=>'<BB>(
      this: Kleisli<F, A, BB>,
      F: FlatMap<F>,
    ): <C>(that: Kleisli<F, BB, C>) => Kleisli<F, A, C>;

    compose(
      F: FlatMap<F>,
    ): <Z, AA extends A>(that: Kleisli<F, Z, AA>) => Kleisli<F, Z, B>;
    '<=<'(
      F: FlatMap<F>,
    ): <Z, AA extends A>(that: Kleisli<F, Z, AA>) => Kleisli<F, Z, B>;

    map<C>(
      this: Kleisli<F, A, C>,
      F: Functor<F>,
    ): <D>(f: (c: C) => D) => Kleisli<F, A, D>;
    tap<C>(
      this: Kleisli<F, A, C>,
      F: Functor<F>,
    ): (f: (c: C) => unknown) => Kleisli<F, A, C>;

    ap<B, C>(
      this: Kleisli<F, A, (_: B) => C>,
      F: FlatMap<F>,
    ): <A2>(fb: Kleisli<F, A2, B>) => Kleisli<F, A & A2, C>;
    '<*>'<B, C>(
      this: Kleisli<F, A, (_: B) => C>,
      F: FlatMap<F>,
    ): <A2>(fb: Kleisli<F, A2, B>) => Kleisli<F, A & A2, C>;

    map2(
      F: FlatMap<F>,
    ): <A2, C, D>(
      that: Kleisli<F, A2, C>,
      f: (b: B, c: C) => D,
    ) => Kleisli<F, A & A2, D>;

    product(
      F: FlatMap<F>,
    ): <A2, C>(that: Kleisli<F, A2, C>) => Kleisli<F, A & A2, [B, C]>;
    productL(
      F: FlatMap<F>,
    ): <A2, C>(that: Kleisli<F, A2, C>) => Kleisli<F, A & A2, B>;
    '>>>'(
      F: FlatMap<F>,
    ): <A2, C>(that: Kleisli<F, A2, C>) => Kleisli<F, A & A2, B>;
    productR(
      F: FlatMap<F>,
    ): <A2, C>(that: Kleisli<F, A2, C>) => Kleisli<F, A & A2, C>;
    '<<<'(
      F: FlatMap<F>,
    ): <A2, C>(that: Kleisli<F, A2, C>) => Kleisli<F, A & A2, C>;

    flatMap<C>(
      this: Kleisli<F, A, C>,
      F: FlatMap<F>,
    ): <A2, D>(f: (c: C) => Kleisli<F, A2, D>) => Kleisli<F, A & A2, D>;
    flatTap<C>(
      this: Kleisli<F, A, C>,
      F: FlatMap<F>,
    ): <A2>(f: (C: C) => Kleisli<F, A2, unknown>) => Kleisli<F, A & A2, C>;
    flatMapF<C>(
      this: Kleisli<F, A, C>,
      F: FlatMap<F>,
    ): <D>(f: (c: C) => Kind<F, [D]>) => Kleisli<F, A, D>;
    flatTapF<C>(
      this: Kleisli<F, A, C>,
      F: FlatMap<F>,
    ): (f: (c: C) => Kind<F, [unknown]>) => Kleisli<F, A, C>;

    flatten<A2, C>(
      this: Kleisli<F, A, Kleisli<F, A2, C>>,
      F: FlatMap<F>,
    ): Kleisli<F, A & A2, C>;

    mapK<G>(nt: FunctionK<F, G>): Kleisli<G, A, B>;
    lift<G>(G: Applicative<G>): Kleisli<[G, F], A, B>;
  }
}

Kleisli.prototype.dimap = function (F) {
  return f => g => dimap_(F)(this, f, g);
};

Kleisli.prototype.adapt = function (f) {
  return adapt_(this, f);
};

Kleisli.prototype.adaptF = function (F) {
  return f => adaptF_(F)(this, f);
};

Kleisli.prototype.andThen = function (F) {
  return that => andThen_(F)(this, that);
};
Kleisli.prototype['>=>'] = Kleisli.prototype.andThen;

Kleisli.prototype.compose = function (F) {
  return that => compose_(F)(that, this);
};
Kleisli.prototype['<=<'] = Kleisli.prototype.compose;

Kleisli.prototype.map = function (F) {
  return f => map_(F)(this, f);
};
Kleisli.prototype.tap = function (F) {
  return f => tap_(F)(this, f);
};

Kleisli.prototype.ap = function (F) {
  return fb => ap_(F)(this, fb);
};
Kleisli.prototype['<*>'] = Kleisli.prototype.ap;

Kleisli.prototype.map2 = function (F) {
  return (that, f) => map2_(F)(this, that)(f);
};

Kleisli.prototype.product = function (F) {
  return that => product_(F)(this, that);
};

Kleisli.prototype.productL = function (F) {
  return that => productL_(F)(this, that);
};
Kleisli.prototype['>>>'] = Kleisli.prototype.productL;

Kleisli.prototype.productR = function (F) {
  return that => productR_(F)(this, that);
};
Kleisli.prototype['<<<'] = Kleisli.prototype.productR;

Kleisli.prototype.flatMap = function (F) {
  return f => flatMap_(F)(this, f);
};
Kleisli.prototype.flatTap = function (F) {
  return f => flatTap_(F)(this, f);
};
Kleisli.prototype.flatMapF = function (F) {
  return f => flatMapF_(F)(this, f);
};
Kleisli.prototype.flatTapF = function (F) {
  return f => flatTapF_(F)(this, f);
};

Kleisli.prototype.mapK = function (nt) {
  return mapK_(this, nt);
};

Kleisli.prototype.lift = function (G) {
  return lift_(this, G);
};
