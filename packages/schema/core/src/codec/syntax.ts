// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Codec } from './algebra';
import { andThen_, imap_ } from './operators';

declare module './algebra' {
  interface Codec<I, O, A> {
    imap<B>(f: (a: A) => B, g: (b: B) => A): Codec<I, O, B>;

    andThen<A, B, C>(
      this: Codec<A, A, B>,
      that: Codec<B, B, C>,
    ): Codec<A, A, C>;
  }
}

Codec.prototype.imap = function (f, g) {
  return imap_(this, f, g);
};

Codec.prototype.andThen = function (that) {
  return andThen_(this, that);
};
