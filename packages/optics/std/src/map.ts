// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Ord } from '@fp4ts/cats';
import { Map } from '@fp4ts/collections';
import { ifoldMap, IndexedFold } from '@fp4ts/optics-core';

export function toMap<K>(
  O: Ord<K> = Ord.fromUniversalCompare(),
): <S, A>(l: IndexedFold<K, S, A>) => (s: S) => Map<K, A> {
  return <S, A>(l: IndexedFold<K, S, A>) =>
    ifoldMap(l)(Map.MonoidK<K>(O).algebra<A>())((a, k) => Map.singleton(k, a));
}
