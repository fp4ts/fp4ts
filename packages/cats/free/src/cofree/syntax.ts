// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eval, EvalF, Kind } from '@fp4ts/core';
import { FunctionK, Functor, Monad, Traversable } from '@fp4ts/cats-core';

import { Cofree } from './algebra';
import {
  cata,
  cataM,
  coflatMap_,
  coflatten,
  extract,
  forcedTail,
  map_,
  transform_,
} from './operators';

declare module './algebra' {
  interface Cofree<S, A> {
    readonly forcedTail: Cofree<S, A>;

    transform(
      S: Functor<S>,
    ): <B>(
      f: (head: A) => B,
      g: (tail: Cofree<S, A>) => Cofree<S, B>,
    ) => Cofree<S, B>;

    map(S: Functor<S>): <B>(f: (a: A) => B) => Cofree<S, B>;

    coflatMap(S: Functor<S>): <B>(f: (cfr: Cofree<S, A>) => B) => Cofree<S, B>;
    coflatten(S: Functor<S>): Cofree<S, Cofree<S, A>>;

    /** Alias over `head` */
    readonly extract: A;

    cata(
      S: Traversable<S>,
    ): <B>(folder: (a: A, sb: Kind<S, [B]>) => Eval<B>) => Eval<B>;
    cataM<M>(
      S: Traversable<S>,
      M: Monad<M>,
    ): <B>(
      folder: (a: A, sb: Kind<S, [B]>) => Kind<M, [B]>,
      inclusion: FunctionK<EvalF, M>,
    ) => Kind<M, [B]>;
  }
}

Object.defineProperty(Cofree.prototype, 'forcedTail', {
  get() {
    return forcedTail(this);
  },
});

Cofree.prototype.transform = function (S) {
  return (f, g) => transform_(S)(this, f, g);
};
Cofree.prototype.map = function (S) {
  return f => map_(S)(this, f);
};
Cofree.prototype.coflatMap = function (S) {
  return f => coflatMap_(S)(this, f);
};
Cofree.prototype.coflatten = function (S) {
  return coflatten(S)(this);
};

Object.defineProperty(Cofree.prototype, 'extract', {
  get() {
    return extract(this);
  },
});

Cofree.prototype.cata = function (S) {
  return cata(S)(this);
};
Cofree.prototype.cataM = function (S, M) {
  return cataM(S, M)(this);
};
