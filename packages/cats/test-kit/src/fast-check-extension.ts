// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { toStringMethod, stringify } from 'fast-check';
import { Eval } from '@fp4ts/cats-core/lib/eval/algebra';
import { Chain } from '@fp4ts/cats-core/lib/data/collections/chain/algebra';

(Eval.prototype as any)[toStringMethod] = function (this: Eval<unknown>) {
  return `Eval(${this.value})`;
};
(Chain.prototype as any)[toStringMethod] = function (this: Chain<unknown>) {
  return `Chain(${stringify(this.toArray)})`;
};
