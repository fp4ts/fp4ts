import { $, TyK, _ } from '../../../core';
import { PrimitiveType } from '../../../core/primitive-type';
import { Foldable } from '../../foldable';
import { Functor } from '../../functor';
import { FunctorFilter } from '../../functor-filter';
import { Traversable } from '../../traversable';
import { List } from '../list';
import { Hashable, primitiveMD5Hashable } from '../../hashable';

import { Empty, Map as MapBase } from './algebra';
import { fromArray, fromList, of } from './constructors';
import {
  mapFoldable,
  mapFunctor,
  mapFunctorFilter,
  mapTraversable,
} from './instances';

export const Map: MapObj = function <K extends PrimitiveType, V>(
  ...pairs: [K, V][]
): Map<K, V> {
  return of<K>(primitiveMD5Hashable())(...pairs);
} as any;

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

  // -- Instances

  Functor<K>(): Functor<$<MapK, [K]>>;
  FunctorFilter<K>(): FunctorFilter<$<MapK, [K]>>;
  Foldable<K>(): Foldable<$<MapK, [K]>>;
  Traversable<K>(): Traversable<$<MapK, [K]>>;
}

Map.empty = Empty;
Map.of = of;
Map.fromArray = fromArray;
Map.fromList = fromList;

Map.Functor = mapFunctor;
Map.FunctorFilter = mapFunctorFilter;
Map.Foldable = mapFoldable;
Map.Traversable = mapTraversable;

// HKT

export const MapURI = 'cats/data/map';
export type MapURI = typeof MapURI;
export type MapK = TyK<MapURI, [_, _]>;

declare module '../../../core/hkt/hkt' {
  interface URItoKind<Tys extends unknown[]> {
    [MapURI]: Map<Tys[0], Tys[1]>;
  }
}
