// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Functor, Monad, None, OptionT, Some } from '@fp4ts/cats';
import { Response } from '@fp4ts/http-core';
import { RouteResult, RouteResultT, view } from './algebra';
import {
  flatMapT_,
  flatMap_,
  flatten,
  flattenT,
  mapT_,
  map_,
  orElseT_,
  orElse_,
} from './operators';

declare module './algebra' {
  interface RouteResult<A> {
    map<B>(f: (a: A) => B): RouteResult<B>;

    flatMap<B>(f: (a: A) => RouteResult<B>): RouteResult<B>;
    flatten<B>(this: RouteResult<RouteResult<B>>): RouteResult<B>;

    orElse<B>(this: RouteResult<B>, that: () => RouteResult<B>): RouteResult<B>;
    '<|>'<B>(this: RouteResult<B>, that: () => RouteResult<B>): RouteResult<B>;
  }

  interface RouteResultT<F, A> {
    map(F: Functor<F>): <B>(f: (a: A) => B) => RouteResultT<F, B>;

    flatMap(
      F: Monad<F>,
    ): <B>(f: (a: A) => RouteResultT<F, B>) => RouteResultT<F, B>;

    flatten<B>(
      this: RouteResultT<F, RouteResultT<F, B>>,
      F: Monad<F>,
    ): RouteResultT<F, B>;

    orElse<B>(
      this: RouteResultT<F, B>,
      F: Monad<F>,
    ): (that: () => RouteResultT<F, B>) => RouteResultT<F, B>;
    '<|>'<B>(
      this: RouteResultT<F, B>,
      F: Monad<F>,
    ): (that: () => RouteResultT<F, B>) => RouteResultT<F, B>;

    respond<F>(
      this: RouteResultT<F, Response<F>>,
      F: Monad<F>,
    ): OptionT<F, Response<F>>;
  }
}

RouteResult.prototype.map = function (f) {
  return map_(this, f);
};

RouteResult.prototype.flatMap = function (f) {
  return flatMap_(this, f);
};
RouteResult.prototype.flatten = function () {
  return flatten(this);
};

RouteResult.prototype.orElse = function (f) {
  return orElse_(this, f);
};
RouteResult.prototype['<|>'] = RouteResult.prototype.orElse;

RouteResultT.prototype.map = function (F) {
  return f => mapT_(F)(this, f);
};

RouteResultT.prototype.flatMap = function (F) {
  return f => flatMapT_(F)(this, f);
};
RouteResultT.prototype.flatten = function (F) {
  return flattenT(F)(this);
};

RouteResultT.prototype.orElse = function (F) {
  return that => orElseT_(F)(this, that);
};
RouteResultT.prototype['<|>'] = RouteResultT.prototype.orElse;
RouteResultT.prototype.respond = function (F) {
  return OptionT(
    F.map_(this.value, fa => {
      const va = view(fa);
      switch (va.tag) {
        case 'route':
          return Some(va.value);
        case 'fail':
        case 'fatal-fail':
          return Some(va.failure.toHttpResponse('1.1'));
      }
    }),
  );
};
