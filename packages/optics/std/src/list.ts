// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { List, ListBuffer } from '@fp4ts/cats';
import { Fold, foldLeft } from '@fp4ts/optics-core';

export function toList<S, A>(l: Fold<S, A>): (s: S) => List<A> {
  return (s: S) =>
    foldLeft(l)(new ListBuffer<A>(), (xs, x) => xs.addOne(x))(s).toList;
}
