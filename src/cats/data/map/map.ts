import { List } from '../list';
import { Hashable, primitiveMD5Hashable } from '../../hashable';

import { Empty, Map as MapBase } from './algebra';
import { fromArray, fromList, of } from './constructors';
import { PrimitiveType } from '../../../fp/primitive-type';

export const Map: MapObj = function <K extends PrimitiveType, V>(
  ...pairs: [K, V][]
): Map<K, V> {
  return of<K>(primitiveMD5Hashable())(...pairs);
};
export type Map<K, V> = MapBase<K, V>;

export interface MapObj {
  <K extends PrimitiveType, V>(...pairs: [K, V][]): Map<K, V>;

  empty: Map<never, never>;

  of: <K2>(
    H: Hashable<K2>,
  ) => <K extends K2, V>(...pairs: [K, V][]) => Map<K2, V>;

  fromArray: <K2>(
    H: Hashable<K2>,
  ) => <K extends K2, V>(xs: [K, V][]) => Map<K2, V>;

  fromList: <K2>(
    H: Hashable<K2>,
  ) => <K extends K2, V>(xs: List<[K, V]>) => Map<K2, V>;
}

Map.empty = Empty;
Map.of = of;
Map.fromArray = fromArray;
Map.fromList = fromList;

// HKT

export const URI = 'cats/data/map';
export type URI = typeof URI;

declare module '../../../fp/hkt' {
  interface URItoKind2<E, A> {
    [URI]: Map<E, A>;
  }
}
