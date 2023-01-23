// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eval, lazyVal } from '@fp4ts/core';
import { CommutativeMonoid } from '../commutative-monoid';

export const disjunctionMonoid = lazyVal(() =>
  CommutativeMonoid.of({
    combine_: (x, y) => x || y,
    combineEval_: (x, y) => (x ? Eval.true : y),
    empty: false,
  }),
);

export const conjunctionMonoid = lazyVal(() =>
  CommutativeMonoid.of({
    combine_: (x, y) => x && y,
    combineEval_: (x, y) => (!x ? Eval.false : y),
    empty: true,
  }),
);
