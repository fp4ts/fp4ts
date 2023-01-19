// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { toStringMethod, stringify } from 'fast-check';
import { Eval } from '@fp4ts/core';
import { Chain } from '@fp4ts/cats-core/lib/data/collections/chain/algebra';
import {
  LazyList,
  _LazyList,
} from '@fp4ts/cats-core/lib/data/collections/lazy-list';

(Eval.prototype as any)[toStringMethod] = function (this: Eval<unknown>) {
  return `Eval(${this.value})`;
};
(Chain.prototype as any)[toStringMethod] = function (this: Chain<unknown>) {
  return `Chain(${stringify(this.toArray)})`;
};
(_LazyList.prototype as any)[toStringMethod] = function (
  this: LazyList<unknown>,
) {
  return `LazyList(${stringify(this.toArray)})`;
};
