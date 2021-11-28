// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Reader } from './algebra';
import { read, unit } from './constructors';
import {
  ap_,
  flatMap_,
  flatTap_,
  flatten,
  map2_,
  map_,
  productL_,
  productR_,
  product_,
  provide_,
  runReader_,
  tap_,
} from './operators';

declare module './algebra' {
  interface Reader<R, A> {
    readonly unit: Reader<R, void>;

    read<R2>(): Reader<R & R2, R2>;
    provide(r: R): Reader<unknown, A>;

    map<B>(f: (a: A) => B): Reader<R, B>;
    tap(f: (a: A) => unknown): Reader<R, A>;

    ap: A extends (b: infer B) => infer C
      ? <R2>(fb: Reader<R2, B>) => Reader<R & R2, C>
      : never | unknown;
    '<*>': A extends (b: infer B) => infer C
      ? <R2>(fb: Reader<R2, B>) => Reader<R & R2, C>
      : never | unknown;

    map2<R2, B, C>(fb: Reader<R2, B>, f: (a: A, b: B) => C): Reader<R & R2, C>;
    product<R2, B>(fb: Reader<R2, B>): Reader<R & R2, [A, B]>;

    productL<R2, B>(fb: Reader<R2, B>): Reader<R & R2, A>;
    '<<<'<R2, B>(fb: Reader<R2, B>): Reader<R & R2, A>;
    productR<R2, B>(fb: Reader<R2, B>): Reader<R & R2, B>;
    '>>>'<R2, B>(fb: Reader<R2, B>): Reader<R & R2, B>;

    flatMap<R2, B>(f: (a: A) => Reader<R2, B>): Reader<R & R2, B>;
    flatTap<R2>(f: (a: A) => Reader<R2, unknown>): Reader<R & R2, A>;
    flatten: A extends Reader<infer R2, infer B>
      ? Reader<R & R2, B>
      : never | unknown;

    runReader(r: R): A;
  }
}

Object.defineProperty(Reader.prototype, 'unit', {
  get<R, A>(this: Reader<R, A>): Reader<R, void> {
    return flatMap_(this, () => unit);
  },
});

Reader.prototype.read = function <R1, R2, A>(
  this: Reader<R1, A>,
): Reader<R1 & R2, R2> {
  return flatMap_(this, () => read());
};

Reader.prototype.provide = function <R, A>(
  this: Reader<R, A>,
  r: R,
): Reader<unknown, A> {
  return provide_(this, r);
};

Reader.prototype.map = function <R, A, B>(
  this: Reader<R, A>,
  f: (a: A) => B,
): Reader<R, B> {
  return map_(this, f);
};

Reader.prototype.tap = function <R, A>(
  this: Reader<R, A>,
  f: (a: A) => unknown,
): Reader<R, A> {
  return tap_(this, f);
};

Reader.prototype.ap = function <R1, R2, A, B>(
  this: Reader<R1, (a: A) => B>,
  that: Reader<R2, A>,
): Reader<R1 & R2, B> {
  return ap_(this, that);
};
Reader.prototype['<*>'] = Reader.prototype.ap;

Reader.prototype.map2 = function <R1, R2, A, B, C>(
  this: Reader<R1, A>,
  that: Reader<R2, B>,
  f: (a: A, b: B) => C,
): Reader<R1 & R2, C> {
  return map2_(this, that)(f);
};

Reader.prototype.product = function <R1, R2, A, B>(
  this: Reader<R1, A>,
  that: Reader<R2, B>,
): Reader<R1 & R2, [A, B]> {
  return product_(this, that);
};

Reader.prototype.productL = function <R1, R2, A, B>(
  this: Reader<R1, A>,
  that: Reader<R2, B>,
): Reader<R1 & R2, A> {
  return productL_(this, that);
};
Reader.prototype['<<<'] = Reader.prototype.productL;

Reader.prototype.productR = function <R1, R2, A, B>(
  this: Reader<R1, A>,
  that: Reader<R2, B>,
): Reader<R1 & R2, B> {
  return productR_(this, that);
};
Reader.prototype['>>>'] = Reader.prototype.productR;

Reader.prototype.flatMap = function <R1, R2, A, B>(
  this: Reader<R1, A>,
  f: (a: A) => Reader<R2, B>,
): Reader<R1 & R2, B> {
  return flatMap_(this, f);
};

Reader.prototype.flatTap = function <R1, R2, A>(
  this: Reader<R1, A>,
  f: (a: A) => Reader<R2, unknown>,
): Reader<R1 & R2, A> {
  return flatTap_(this, f);
};

Object.defineProperty(Reader.prototype, 'flatten', {
  get<R1, R2, A>(this: Reader<R1, Reader<R2, A>>): Reader<R1 & R2, A> {
    return flatten(this);
  },
});

Reader.prototype.runReader = function <R, A>(this: Reader<R, A>, r: R): A {
  return runReader_(this, r);
};
