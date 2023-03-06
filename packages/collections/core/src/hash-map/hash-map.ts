// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, TyK, PrimitiveType, $type, TyVar, HKT } from '@fp4ts/core';
import {
  Eq,
  Hashable,
  anyHashable,
  SemigroupK,
  MonoidK,
  Functor,
  FunctorFilter,
  UnorderedFoldable,
  UnorderedTraversable,
} from '@fp4ts/cats';

import { List } from '../list';

import { Empty, HashMap as HashMapBase } from './algebra';
import { fromArray, fromList, of } from './constructors';
import {
  hashMapUnorderedFoldable,
  hashMapFunctor,
  hashMapFunctorFilter,
  hashMapUnorderedTraversable,
  hashMapMonoidK,
  hashMapSemigroupK,
  hashMapEq,
} from './instances';

export const HashMap: HashMapObj = function <K extends PrimitiveType, V>(
  ...pairs: [K, V][]
): HashMap<K, V> {
  return of<K>(anyHashable())(...pairs);
} as any;

export type HashMap<K, V> = HashMapBase<K, V>;

export interface HashMapObj {
  <K extends PrimitiveType, V>(...pairs: [K, V][]): HashMap<K, V>;
  empty: HashMap<never, never>;
  of: <K2>(
    H: Hashable<K2>,
  ) => <K extends K2, V>(...pairs: [K, V][]) => HashMap<K2, V>;
  fromArray: <K2>(
    H: Hashable<K2>,
  ) => <K extends K2, V>(xs: [K, V][]) => HashMap<K2, V>;
  fromList: <K2>(
    H: Hashable<K2>,
  ) => <K extends K2, V>(xs: List<[K, V]>) => HashMap<K2, V>;

  // -- Instances

  Eq<K, V>(EK: Eq<K>, EV: Eq<V>): Eq<HashMap<K, V>>;
  SemigroupK<K>(E: Eq<K>): SemigroupK<$<HashMapF, [K]>>;
  MonoidK<K>(E: Eq<K>): MonoidK<$<HashMapF, [K]>>;
  Functor<K>(): Functor<$<HashMapF, [K]>>;
  FunctorFilter<K>(): FunctorFilter<$<HashMapF, [K]>>;
  UnorderedFoldable<K>(): UnorderedFoldable<$<HashMapF, [K]>>;
  UnorderedTraversable<K>(): UnorderedTraversable<$<HashMapF, [K]>>;
}

HashMap.empty = Empty;
HashMap.of = of;
HashMap.fromArray = fromArray;
HashMap.fromList = fromList;

HashMap.Eq = hashMapEq;
HashMap.SemigroupK = hashMapSemigroupK;
HashMap.MonoidK = hashMapMonoidK;
HashMap.Functor = hashMapFunctor;
HashMap.FunctorFilter = hashMapFunctorFilter;
HashMap.UnorderedFoldable = hashMapUnorderedFoldable;
HashMap.UnorderedTraversable = hashMapUnorderedTraversable;

// HKT

declare module './algebra' {
  export interface HashMap<K, V> extends HKT<HashMapF, [K, V]> {}
}

/**
 * @category Type Constructor
 * @category Collection
 */
export interface HashMapF extends TyK<[unknown, unknown]> {
  [$type]: HashMap<TyVar<this, 0>, TyVar<this, 1>>;
}
