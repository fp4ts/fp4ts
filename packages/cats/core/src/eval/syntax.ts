// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eval } from './algebra';
import { flatMap_, flatten, map_ } from './operators';

declare module './algebra' {
  interface Eval<out A> {
    map<B>(f: (a: A) => B): Eval<B>;
    flatMap<B>(f: (a: A) => Eval<B>): Eval<B>;

    readonly flatten: A extends Eval<infer B> ? Eval<B> : never;
  }
}

Eval.prototype.map = function (f) {
  return map_(this, f);
};

Eval.prototype.flatMap = function (f) {
  return flatMap_(this, f);
};

Object.defineProperty(Eval.prototype, 'flatten', {
  get<A>(this: Eval<Eval<A>>): Eval<A> {
    return flatten(this);
  },
});
