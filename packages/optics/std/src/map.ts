// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Ord } from '@fp4ts/cats';
import { OrdMap } from '@fp4ts/collections';
import { ifoldMap, IndexedFold } from '@fp4ts/optics-core';

export function toMap<K>(
  O: Ord<K> = Ord.fromUniversalCompare(),
): <S, A>(l: IndexedFold<K, S, A>) => (s: S) => OrdMap<K, A> {
  return <S, A>(l: IndexedFold<K, S, A>) =>
    ifoldMap(l)(OrdMap.MonoidK<K>(O).algebra<A>())((a, k) =>
      OrdMap.singleton(k, a),
    );
}
