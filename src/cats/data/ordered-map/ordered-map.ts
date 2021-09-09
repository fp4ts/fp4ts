import { PrimitiveType } from '../../../fp/primitive-type';
import { Foldable2, Foldable2C } from '../../foldable';
import { Functor2, Functor2C } from '../../functor';
import { FunctorFilter2, FunctorFilter2C } from '../../functor-filter';
import { Traversable2, Traversable2C } from '../../traversable';
import { List } from '../list';
import { Ord, primitiveOrd } from '../../ord';

import { OrderedMap as OrderedMapBase } from './algebra';
import { empty, fromArray, fromList, fromSortedArray } from './constructors';
import {
  orderedMapFoldable2,
  orderedMapFoldable2C,
  orderedMapFunctor2,
  orderedMapFunctor2C,
  orderedMapFunctorFilter2,
  orderedMapFunctorFilter2C,
  orderedMapTraversable2,
  orderedMapTraversable2C,
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

  Functor2C: <K>() => Functor2C<URI, K>;
  FunctorFilter2C: <K>() => FunctorFilter2C<URI, K>;
  Foldable2C: <K>() => Foldable2C<URI, K>;
  Traversable2C: <K>() => Traversable2C<URI, K>;
  readonly Functor2: Functor2<URI>;
  readonly FunctorFilter2: FunctorFilter2<URI>;
  readonly Foldable2: Foldable2<URI>;
  readonly Traversable2: Traversable2<URI>;
}

OrderedMap.empty = empty;
OrderedMap.fromArray = fromArray;
OrderedMap.fromList = fromList;
OrderedMap.fromSortedArray = fromSortedArray;

OrderedMap.Functor2C = orderedMapFunctor2C;
OrderedMap.FunctorFilter2C = orderedMapFunctorFilter2C;
OrderedMap.Foldable2C = orderedMapFoldable2C;
OrderedMap.Traversable2C = orderedMapTraversable2C;

Object.defineProperty(OrderedMap, 'Functor2', {
  get(): Functor2<URI> {
    return orderedMapFunctor2();
  },
});
Object.defineProperty(OrderedMap, 'FunctorFilter2', {
  get(): FunctorFilter2<URI> {
    return orderedMapFunctorFilter2();
  },
});
Object.defineProperty(OrderedMap, 'Foldable2', {
  get(): Foldable2<URI> {
    return orderedMapFoldable2();
  },
});
Object.defineProperty(OrderedMap, 'Traversable2', {
  get(): Traversable2<URI> {
    return orderedMapTraversable2();
  },
});

// HKT

export const URI = 'cats/data/ordered-map';
export type URI = typeof URI;

declare module '../../../fp/hkt' {
  interface URItoKind2<E, A> {
    [URI]: OrderedMap<E, A>;
  }
}
