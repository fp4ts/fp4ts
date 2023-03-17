// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eval, lazy, throwError } from '@fp4ts/core';
import { CommutativeMonoid } from '../commutative-monoid';

export const disjunctionMonoid = lazy(() =>
  CommutativeMonoid.of({
    combine_: (x, y) => x || y,
    combineEval_: (x, y) => (x ? Eval.true : y),
    combineN_: (x, n) =>
      n <= 0 ? throwError(new Error('Semigroup.combineN_: n must be >0')) : x,
    empty: false,
  }),
);

export const conjunctionMonoid = lazy(() =>
  CommutativeMonoid.of({
    combine_: (x, y) => x && y,
    combineEval_: (x, y) => (!x ? Eval.false : y),
    combineN_: (x, n) =>
      n <= 0 ? throwError(new Error('Semigroup.combineN_: n must be >0')) : x,
    empty: true,
  }),
);
