// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { FunctionK, Monad } from '@fp4ts/cats-core';
import { Free } from './algebra';
import { flatMap_, map_, foldMap_ } from './operators';

declare module './algebra' {
  interface Free<in out F, out A> {
    map<B>(f: (a: A) => B): Free<F, B>;

    flatMap<B>(this: Free<F, A>, f: (a: A) => Free<F, B>): Free<F, B>;

    foldMap<G>(G: Monad<G>): (nt: FunctionK<F, G>) => Kind<G, [A]>;
  }
}

Free.prototype.map = function (f) {
  return map_(this, f);
};

Free.prototype.flatMap = function (f) {
  return flatMap_(this, f);
};

Free.prototype.foldMap = function (G) {
  return nt => foldMap_(G)(this, nt);
};
