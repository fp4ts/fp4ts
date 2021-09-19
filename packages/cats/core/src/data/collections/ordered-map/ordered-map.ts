import { $, TyK, _, PrimitiveType } from '@cats4ts/core';
import {
  Foldable,
  Functor,
  FunctorFilter,
  Traversable,
  Ord,
  primitiveOrd,
} from '@cats4ts/cats-core';

import { List } from '../list';

import { OrderedMap as OrderedMapBase } from './algebra';
import { empty, fromArray, fromList, fromSortedArray } from './constructors';
import {
  orderedMapFoldable,
  orderedMapFunctor,
  orderedMapFunctorFilter,
  orderedMapTraversable,
} from './instances';

export type OrderedMap<K, V> = OrderedMapBase<K, V>;

export const OrderedMap: OrderedMapObj = function <K extends PrimitiveType, V>(
  ...pairs: [K, V][]
): OrderedMap<K, V> {
  return fromArray(primitiveOrd(), pairs);
} as any;

export interface OrderedMapObj {
  <K extends PrimitiveType, V>(...pairs: [K, V][]): OrderedMap<K, V>;
  empty: OrderedMap<never, never>;
  fromList<K, V>(O: Ord<K>, xs: List<[K, V]>): OrderedMap<K, V>;
  fromArray<K, V>(O: Ord<K>, xs: [K, V][]): OrderedMap<K, V>;
  fromSortedArray<K, V>(xs: [K, V][]): OrderedMap<K, V>;

  // -- Instances

  Functor: <K>() => Functor<$<OrderedMapK, [K]>>;
  FunctorFilter: <K>() => FunctorFilter<$<OrderedMapK, [K]>>;
  Foldable: <K>() => Foldable<$<OrderedMapK, [K]>>;
  Traversable: <K>() => Traversable<$<OrderedMapK, [K]>>;
}

OrderedMap.empty = empty;
OrderedMap.fromArray = fromArray;
OrderedMap.fromList = fromList;
OrderedMap.fromSortedArray = fromSortedArray;

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
