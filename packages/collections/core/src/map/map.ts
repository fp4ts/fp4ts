// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, TyK, PrimitiveType, $type, TyVar, HKT } from '@fp4ts/core';
import {
  Eq,
  FoldableWithIndex,
  FunctorFilter,
  FunctorWithIndex,
  MonoidK,
  Ord,
  SemigroupK,
  TraversableWithIndex,
} from '@fp4ts/cats';

import { List } from '../list';

import { Map as MapBase } from './algebra';
import {
  empty,
  fromArray,
  fromList,
  fromSortedArray,
  singleton,
} from './constructors';
import {
  mapEq,
  mapFoldableWithIndex,
  mapFunctorFilter,
  mapFunctorWithIndex,
  mapMonoidK,
  mapSemigroupK,
  mapTraversableWithIndex,
} from './instances';

export type Map<K, V> = MapBase<K, V>;

export const Map: OrderedMapObj = function <K extends PrimitiveType, V>(
  ...pairs: [K, V][]
): Map<K, V> {
  return fromArray<K>(Ord.fromUniversalCompare())(pairs);
} as any;

export interface OrderedMapObj {
  <K extends PrimitiveType, V>(...pairs: [K, V][]): Map<K, V>;
  empty: Map<never, never>;
  singleton<K, V>(k: K, v: V): Map<K, V>;
  fromList<K>(O: Ord<K>): <V>(xs: List<[K, V]>) => Map<K, V>;
  fromArray<K>(O: Ord<K>): <V>(xs: [K, V][]) => Map<K, V>;
  fromSortedArray<K, V>(xs: [K, V][]): Map<K, V>;

  // -- Instances

  Eq<K, V>(EK: Eq<K>, EV: Eq<V>): Eq<Map<K, V>>;
  SemigroupK: <K>(O: Ord<K>) => SemigroupK<$<MapF, [K]>>;
  MonoidK: <K>(O: Ord<K>) => MonoidK<$<MapF, [K]>>;
  FunctorWithIndex: <K>() => FunctorWithIndex<$<MapF, [K]>, K>;
  FunctorFilter: <K>() => FunctorFilter<$<MapF, [K]>>;
  FoldableWithIndex: <K>() => FoldableWithIndex<$<MapF, [K]>, K>;
  TraversableWithIndex: <K>() => TraversableWithIndex<$<MapF, [K]>, K>;
}

Map.empty = empty;
Map.singleton = singleton;
Map.fromArray = fromArray;
Map.fromList = fromList;
Map.fromSortedArray = fromSortedArray;

Map.Eq = mapEq;
Map.SemigroupK = mapSemigroupK;
Map.MonoidK = mapMonoidK;
Map.FunctorWithIndex = mapFunctorWithIndex;
Map.FunctorFilter = mapFunctorFilter;
Map.FoldableWithIndex = mapFoldableWithIndex;
Map.TraversableWithIndex = mapTraversableWithIndex;

// HKT

declare module './algebra' {
  export interface Map<K, V> extends HKT<MapF, [K, V]> {}
}

/**
 * @category Type Constructor
 * @category Collection
 */
export interface MapF extends TyK<[unknown, unknown]> {
  [$type]: Map<TyVar<this, 0>, TyVar<this, 1>>;
}
