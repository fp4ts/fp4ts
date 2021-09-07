import { PrimitiveType } from '../../../fp/primitive-type';
import { List } from '../list';
import { Ord, primitiveOrd } from '../../ord';
import { OrderedMap as OrderedMapBase } from './algebra';
import { empty, fromArray, fromList, fromSortedArray } from './constructors';

export type OrderedMap<K, V> = OrderedMapBase<K, V>;

export const OrderedMap: OrderedMapObj = function <K extends PrimitiveType, V>(
  ...pairs: [K, V][]
): OrderedMap<K, V> {
  return fromArray(primitiveOrd(), pairs);
};

export interface OrderedMapObj {
  <K extends PrimitiveType, V>(...pairs: [K, V][]): OrderedMap<K, V>;
  empty: OrderedMap<never, never>;
  fromList<K, V>(O: Ord<K>, xs: List<[K, V]>): OrderedMap<K, V>;
  fromArray<K, V>(O: Ord<K>, xs: [K, V][]): OrderedMap<K, V>;
  fromSortedArray<K, V>(xs: [K, V][]): OrderedMap<K, V>;
}

OrderedMap.empty = empty;
OrderedMap.fromArray = fromArray;
OrderedMap.fromList = fromList;
OrderedMap.fromSortedArray = fromSortedArray;

// HKT

export const URI = 'cats/data/ordered-map';
export type URI = typeof URI;

declare module '../../../fp/hkt' {
  interface URItoKind2<E, A> {
    [URI]: OrderedMap<E, A>;
  }
}
