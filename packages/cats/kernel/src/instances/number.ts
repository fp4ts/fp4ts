// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { lazy } from '@fp4ts/core';
import { CommutativeMonoid } from '../commutative-monoid';

export const additionMonoid = lazy(() =>
  CommutativeMonoid.of({ combine_: (x, y) => x + y, empty: 0 }),
);

export const productMonoid = lazy(() =>
  CommutativeMonoid.of({ combine_: (x, y) => x * y, empty: 1 }),
);
