import { URI } from '../../../core';
import { PrimitiveType } from '../../../fp/primitive-type';
import { Foldable } from '../../foldable';
import { Functor } from '../../functor';
import { FunctorFilter } from '../../functor-filter';
import { Traversable } from '../../traversable';
import { List } from '../list';
import { Ord, primitiveOrd } from '../../ord';

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

  readonly Functor: Functor<[URI<OrderedMapURI>]>;
  readonly FunctorFilter: FunctorFilter<[URI<OrderedMapURI>]>;
  readonly Foldable: Foldable<[URI<OrderedMapURI>]>;
  readonly Traversable: Traversable<[URI<OrderedMapURI>]>;
}

OrderedMap.empty = empty;
OrderedMap.fromArray = fromArray;
OrderedMap.fromList = fromList;
OrderedMap.fromSortedArray = fromSortedArray;

Object.defineProperty(OrderedMap, 'Functor', {
  get(): Functor<[URI<OrderedMapURI>]> {
    return orderedMapFunctor();
  },
});
Object.defineProperty(OrderedMap, 'FunctorFilter', {
  get(): FunctorFilter<[URI<OrderedMapURI>]> {
    return orderedMapFunctorFilter();
  },
});
Object.defineProperty(OrderedMap, 'Foldable', {
  get(): Foldable<[URI<OrderedMapURI>]> {
    return orderedMapFoldable();
  },
});
Object.defineProperty(OrderedMap, 'Traversable', {
  get(): Traversable<[URI<OrderedMapURI>]> {
    return orderedMapTraversable();
  },
});

// HKT

export const OrderedMapURI = 'cats/data/ordered-map';
export type OrderedMapURI = typeof OrderedMapURI;

declare module '../../../core/hkt/hkt' {
  interface URItoKind<FC, S, R, E, A> {
    [OrderedMapURI]: OrderedMap<E, A>;
  }
}
