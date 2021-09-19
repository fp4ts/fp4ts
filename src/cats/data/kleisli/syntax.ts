import { AnyK, Kind } from '../../../core';
import { FunctionK } from '../../function-k';
import { Monad } from '../../monad';

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
  map2_,
  mapK_,
  map_,
  productL_,
  productR_,
  product_,
  run_,
  tap_,
} from './operators';

declare module './algebra' {
  interface Kleisli<F extends AnyK, A, B> {
    dimap<C, AA extends A, BB>(
      this: Kleisli<F, A, BB>,
      f: (c: C) => AA,
    ): <D>(g: (bb: BB) => D) => Kleisli<F, C, D>;

    adapt<AA>(f: (a: AA) => A): Kleisli<F, AA, B>;
    adaptF<AA>(f: (a: AA) => Kind<F, [A]>): Kleisli<F, AA, B>;

    andThen<BB, C>(
      this: Kleisli<F, A, BB>,
      that: Kleisli<F, BB, C>,
    ): Kleisli<F, A, C>;
    '>=>'<BB, C>(
      this: Kleisli<F, A, BB>,
      that: Kleisli<F, BB, C>,
    ): Kleisli<F, A, C>;

    compose<Z, AA extends A>(that: Kleisli<F, Z, AA>): Kleisli<F, Z, B>;
    '<=<'<Z, AA extends A>(that: Kleisli<F, Z, AA>): Kleisli<F, Z, B>;

    map<C, D>(this: Kleisli<F, A, C>, f: (c: C) => D): Kleisli<F, A, D>;
    tap<C>(this: Kleisli<F, A, C>, f: (c: C) => unknown): Kleisli<F, A, C>;

    ap<A2, B, C>(
      this: Kleisli<F, A, (_: B) => C>,
      fb: Kleisli<F, A2, B>,
    ): Kleisli<F, A & A2, C>;
    '<*>'<A2, B, C>(
      this: Kleisli<F, A, (_: B) => C>,
      fb: Kleisli<F, A2, B>,
    ): Kleisli<F, A & A2, C>;

    map2<A2, C, D>(
      that: Kleisli<F, A2, C>,
      f: (b: B, c: C) => D,
    ): Kleisli<F, A & A2, D>;

    product<A2, C>(that: Kleisli<F, A2, C>): Kleisli<F, A & A2, [B, C]>;
    productL<A2, C>(that: Kleisli<F, A2, C>): Kleisli<F, A & A2, B>;
    '>>>'<A2, C>(that: Kleisli<F, A2, C>): Kleisli<F, A & A2, B>;
    productR<A2, C>(that: Kleisli<F, A2, C>): Kleisli<F, A & A2, C>;
    '<<<'<A2, C>(that: Kleisli<F, A2, C>): Kleisli<F, A & A2, C>;

    flatMap<A2, C, D>(
      this: Kleisli<F, A, C>,
      f: (c: C) => Kleisli<F, A2, D>,
    ): Kleisli<F, A & A2, D>;
    flatTap<A2, C>(
      this: Kleisli<F, A, C>,
      f: (C: C) => Kleisli<F, A2, unknown>,
    ): Kleisli<F, A & A2, C>;
    flatMapF<C, D>(
      this: Kleisli<F, A, C>,
      f: (c: C) => Kind<F, [D]>,
    ): Kleisli<F, A, D>;
    flatTapF<C>(
      this: Kleisli<F, A, C>,
      f: (c: C) => Kind<F, [unknown]>,
    ): Kleisli<F, A, C>;

    readonly flatten: B extends Kleisli<F, infer A2, infer C>
      ? Kleisli<F, A & A2, C>
      : never & unknown;

    mapK<G extends AnyK>(M: Monad<F>, nt: FunctionK<F, G>): Kleisli<G, A, B>;
    run(M: Monad<F>): <AA extends A>(a: AA) => Kind<F, [B]>;
  }
}

Kleisli.prototype.dimap = function (f) {
  return g => dimap_(this, f, g);
};

Kleisli.prototype.adapt = function (f) {
  return adapt_(this, f);
};

Kleisli.prototype.adaptF = function (f) {
  return adaptF_(this, f);
};

Kleisli.prototype.andThen = function (that) {
  return andThen_(this, that);
};
Kleisli.prototype['>=>'] = Kleisli.prototype.andThen;

Kleisli.prototype.compose = function (that) {
  return compose_(that, this);
};
Kleisli.prototype['<=<'] = Kleisli.prototype.compose;

Kleisli.prototype.map = function (f) {
  return map_(this, f);
};
Kleisli.prototype.tap = function (f) {
  return tap_(this, f);
};

Kleisli.prototype.ap = function (fb) {
  return ap_(this, fb);
};
Kleisli.prototype['<*>'] = Kleisli.prototype.ap;

Kleisli.prototype.map2 = function (that, f) {
  return map2_(this, that)(f);
};

Kleisli.prototype.product = function (that) {
  return product_(this, that);
};

Kleisli.prototype.productL = function (that) {
  return productL_(this, that);
};
Kleisli.prototype['>>>'] = Kleisli.prototype.productL;

Kleisli.prototype.productR = function (that) {
  return productR_(this, that);
};
Kleisli.prototype['<<<'] = Kleisli.prototype.productR;

Kleisli.prototype.flatMap = function (f) {
  return flatMap_(this, f);
};
Kleisli.prototype.flatTap = function (f) {
  return flatTap_(this, f);
};
Kleisli.prototype.flatMapF = function (f) {
  return flatMapF_(this, f);
};
Kleisli.prototype.flatTapF = function (f) {
  return flatTapF_(this, f);
};

Kleisli.prototype.mapK = function (M, nt) {
  return mapK_(M)(this, nt);
};

Kleisli.prototype.run = function (M) {
  return a => run_(M)(this, a);
};
