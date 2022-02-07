// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, TyK, PrimitiveType, $type, TyVar } from '@fp4ts/core';
import { Eq, Ord } from '@fp4ts/cats-kernel';

import { SemigroupK } from '../../../semigroup-k';
import { MonoidK } from '../../../monoid-k';
import { Foldable } from '../../../foldable';
import { Functor } from '../../../functor';
import { FunctorFilter } from '../../../functor-filter';
import { Traversable } from '../../../traversable';

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
  mapFoldable,
  mapFunctor,
  mapFunctorFilter,
  mapMonoidK,
  mapSemigroupK,
  mapTraversable,
} from './instances';

export type Map<K, V> = MapBase<K, V>;

export const Map: OrderedMapObj = function <K extends PrimitiveType, V>(
  ...pairs: [K, V][]
): Map<K, V> {
  return fromArray<K>(Ord.primitive)(pairs);
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
  SemigroupK: <K>(O: Ord<K>) => SemigroupK<$<MapK, [K]>>;
  MonoidK: <K>(O: Ord<K>) => MonoidK<$<MapK, [K]>>;
  Functor: <K>() => Functor<$<MapK, [K]>>;
  FunctorFilter: <K>() => FunctorFilter<$<MapK, [K]>>;
  Foldable: <K>() => Foldable<$<MapK, [K]>>;
  Traversable: <K>() => Traversable<$<MapK, [K]>>;
}

Map.empty = empty;
Map.singleton = singleton;
Map.fromArray = fromArray;
Map.fromList = fromList;
Map.fromSortedArray = fromSortedArray;

Map.Eq = mapEq;
Map.SemigroupK = mapSemigroupK;
Map.MonoidK = mapMonoidK;
Map.Functor = mapFunctor;
Map.FunctorFilter = mapFunctorFilter;
Map.Foldable = mapFoldable;
Map.Traversable = mapTraversable;

// HKT

/**
 * @category Type Constructor
 * @category Collection
 */
export interface MapK extends TyK<[unknown, unknown]> {
  [$type]: Map<TyVar<this, 0>, TyVar<this, 1>>;
}
