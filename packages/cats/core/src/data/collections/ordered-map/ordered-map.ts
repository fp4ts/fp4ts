import { $, TyK, _, PrimitiveType } from '@cats4ts/core';
import { Eq } from '../../../eq';
import { Ord } from '../../../ord';
import { SemigroupK } from '../../../semigroup-k';
import { MonoidK } from '../../../monoid-k';
import { Foldable } from '../../../foldable';
import { Functor } from '../../../functor';
import { FunctorFilter } from '../../../functor-filter';
import { Traversable } from '../../../traversable';

import { List } from '../list';

import { OrderedMap as OrderedMapBase } from './algebra';
import {
  empty,
  fromArray,
  fromList,
  fromSortedArray,
  singleton,
} from './constructors';
import {
  orderedMapEq,
  orderedMapFoldable,
  orderedMapFunctor,
  orderedMapFunctorFilter,
  orderedMapMonoidK,
  orderedMapSemigroupK,
  orderedMapTraversable,
} from './instances';

export type OrderedMap<K, V> = OrderedMapBase<K, V>;

export const OrderedMap: OrderedMapObj = function <K extends PrimitiveType, V>(
  ...pairs: [K, V][]
): OrderedMap<K, V> {
  return fromArray<K>(Ord.primitive)(pairs);
} as any;

export interface OrderedMapObj {
  <K extends PrimitiveType, V>(...pairs: [K, V][]): OrderedMap<K, V>;
  empty: OrderedMap<never, never>;
  singleton<K, V>(k: K, v: V): OrderedMap<K, V>;
  fromList<K, V>(O: Ord<K>): <V>(xs: List<[K, V]>) => OrderedMap<K, V>;
  fromArray<K>(O: Ord<K>): <V>(xs: [K, V][]) => OrderedMap<K, V>;
  fromSortedArray<K, V>(xs: [K, V][]): OrderedMap<K, V>;

  // -- Instances

  Eq<K, V>(EK: Eq<K>, EV: Eq<V>): Eq<OrderedMap<K, V>>;
  SemigroupK: <K>(O: Ord<K>) => SemigroupK<$<OrderedMapK, [K]>>;
  MonoidK: <K>(O: Ord<K>) => MonoidK<$<OrderedMapK, [K]>>;
  Functor: <K>() => Functor<$<OrderedMapK, [K]>>;
  FunctorFilter: <K>() => FunctorFilter<$<OrderedMapK, [K]>>;
  Foldable: <K>() => Foldable<$<OrderedMapK, [K]>>;
  Traversable: <K>() => Traversable<$<OrderedMapK, [K]>>;
}

OrderedMap.empty = empty;
OrderedMap.singleton = singleton;
OrderedMap.fromArray = fromArray;
OrderedMap.fromList = fromList;
OrderedMap.fromSortedArray = fromSortedArray;

OrderedMap.Eq = orderedMapEq;
OrderedMap.SemigroupK = orderedMapSemigroupK;
OrderedMap.MonoidK = orderedMapMonoidK;
OrderedMap.Functor = orderedMapFunctor;
OrderedMap.FunctorFilter = orderedMapFunctorFilter;
OrderedMap.Foldable = orderedMapFoldable;
OrderedMap.Traversable = orderedMapTraversable;

// HKT

export const OrderedMapURI = 'cats/data/collections/ordered-map';
export type OrderedMapURI = typeof OrderedMapURI;
export type OrderedMapK = TyK<OrderedMapURI, [_, _]>;

declare module '@cats4ts/core/lib/hkt/hkt' {
  interface URItoKind<Tys extends unknown[]> {
    [OrderedMapURI]: OrderedMap<Tys[0], Tys[1]>;
  }
}
