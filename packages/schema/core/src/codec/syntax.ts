// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Codec } from './algebra';
import { imap_ } from './operators';

declare module './algebra' {
  interface Codec<I, O, A> {
    imap<B>(f: (a: A) => B, g: (b: B) => A): Codec<I, O, B>;
  }
}

Codec.prototype.imap = function (f, g) {
  return imap_(this, f, g);
};
