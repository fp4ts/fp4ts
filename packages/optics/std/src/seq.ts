// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Seq } from '@fp4ts/cats';
import { Fold, foldLeft } from '@fp4ts/optics-core';

export function toSeq<S, A>(l: Fold<S, A>): (s: S) => Seq<A> {
  return foldLeft(l)(Seq.empty as Seq<A>, (xs, x) => xs.append(x));
}
