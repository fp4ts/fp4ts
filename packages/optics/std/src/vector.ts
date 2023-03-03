// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Vector } from '@fp4ts/cats';
import { F1 } from '@fp4ts/core';
import { Fold, toArray } from '@fp4ts/optics-core';

export function toVector<S, A>(l: Fold<S, A>): (s: S) => Vector<A> {
  return F1.andThen(toArray(l), Vector.fromArray);
}
