import { URI } from '../../../core';
import { PrimitiveType } from '../../../fp/primitive-type';
import { Foldable } from '../../foldable';
import { Functor } from '../../functor';
import { FunctorFilter } from '../../functor-filter';
import { Traversable } from '../../traversable';
import { List } from '../list';
import { Hashable, primitiveMD5Hashable } from '../../hashable';

import { Empty, Map as MapBase } from './algebra';
import { fromArray, fromList, of } from './constructors';
import {
  Variance,
  mapFoldable,
  mapFunctor,
  mapFunctorFilter,
  mapTraversable2,
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

  readonly Functor: Functor<[URI<MapURI, Variance>], Variance>;
  readonly FunctorFilter: FunctorFilter<[URI<MapURI, Variance>], Variance>;
  readonly Foldable: Foldable<[URI<MapURI, Variance>], Variance>;
  readonly Traversable: Traversable<[URI<MapURI, Variance>], Variance>;
}

Map.empty = Empty;
Map.of = of;
Map.fromArray = fromArray;
Map.fromList = fromList;

Object.defineProperty(Map, 'Functor', {
  get(): Functor<[URI<MapURI, Variance>], Variance> {
    return mapFunctor();
  },
});
Object.defineProperty(Map, 'FunctorFilter', {
  get(): FunctorFilter<[URI<MapURI, Variance>], Variance> {
    return mapFunctorFilter();
  },
});
Object.defineProperty(Map, 'Foldable', {
  get(): Foldable<[URI<MapURI, Variance>], Variance> {
    return mapFoldable();
  },
});
Object.defineProperty(Map, 'Traversable', {
  get(): Traversable<[URI<MapURI, Variance>], Variance> {
    return mapTraversable2();
  },
});

// HKT

export const MapURI = 'cats/data/map';
export type MapURI = typeof MapURI;

declare module '../../../core/hkt/hkt' {
  interface URItoKind<FC, TC, S, R, E, A> {
    [MapURI]: Map<E, A>;
  }
}
