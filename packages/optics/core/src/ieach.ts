// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { ArrayF, TraversableWithIndex } from '@fp4ts/cats';
import { Map, MapF } from '@fp4ts/collections';
import { $, Kind, lazy } from '@fp4ts/core';
import { IndexedPTraversal, IndexedTraversal, itraversal } from './traversal';

export interface IEach<F, I> {
  <A, B>(): IndexedPTraversal<I, Kind<F, [A]>, Kind<F, [B]>, A, B>;
  <A>(): IndexedTraversal<I, Kind<F, [A]>, A>;
}

export const IEach = Object.freeze({
  Tuple: <
    S extends unknown[],
    T extends unknown[],
  >(): S['length'] extends T['length']
    ? IndexedPTraversal<number, S, T, S[0], T[0]>
    : never => IEach.Array() as any,

  Array: lazy(
    <A, B>(): IndexedPTraversal<number, A[], B[], A, B> =>
      itraversal<number, A[], B[], A, B>(
        TraversableWithIndex.Array.traverseWithIndex,
      ),
  ) as IEach<ArrayF, number>,

  Map: lazy(
    <K>(): IEach<$<MapF, [K]>, K> =>
      <A, B>(): IndexedPTraversal<K, Map<K, A>, Map<K, B>, A, B> =>
        itraversal<K, Map<K, A>, Map<K, B>, A, B>(
          Map.TraversableWithIndex<K>().traverseWithIndex,
        ),
  ) as <K>() => IEach<$<MapF, [K]>, K>,
});

export const ieach = IEach.Array;
export const ieachTuple = IEach.Tuple;
