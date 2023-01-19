// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { FunctionK } from '../../arrow';

import { Nested } from './algebra';
import { mapK_ } from './operators';

declare module './algebra' {
  interface Nested<F, G, A> {
    mapK<H>(nt: FunctionK<F, H>): Nested<H, G, A>;
  }
}

Nested.prototype.mapK = function (nt) {
  return mapK_(this, nt);
};
