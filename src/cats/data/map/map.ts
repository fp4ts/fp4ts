import { PrimitiveType } from '../../../fp/primitive-type';
import { Foldable2, Foldable2C } from '../../foldable';
import { Functor2, Functor2C } from '../../functor';
import { FunctorFilter2, FunctorFilter2C } from '../../functor-filter';
import { Traversable2, Traversable2C } from '../../traversable';
import { List } from '../list';
import { Hashable, primitiveMD5Hashable } from '../../hashable';

import { Empty, Map as MapBase } from './algebra';
import { fromArray, fromList, of } from './constructors';
import {
  mapFoldable2,
  mapFoldable2C,
  mapFunctor2,
  mapFunctor2C,
  mapFunctorFilter2,
  mapFunctorFilter2C,
  mapTraversable2,
  mapTraversable2C,
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

  Functor2C: <K>() => Functor2C<URI, K>;
  FunctorFilter2C: <K>() => FunctorFilter2C<URI, K>;
  Foldable2C: <K>() => Foldable2C<URI, K>;
  Traversable2C: <K>() => Traversable2C<URI, K>;
  readonly Functor2: Functor2<URI>;
  readonly FunctorFilter2: FunctorFilter2<URI>;
  readonly Foldable2: Foldable2<URI>;
  readonly Traversable2: Traversable2<URI>;
}

Map.empty = Empty;
Map.of = of;
Map.fromArray = fromArray;
Map.fromList = fromList;

Map.Functor2C = mapFunctor2C;
Map.FunctorFilter2C = mapFunctorFilter2C;
Map.Foldable2C = mapFoldable2C;
Map.Traversable2C = mapTraversable2C;

Object.defineProperty(Map, 'Functor2', {
  get(): Functor2<URI> {
    return mapFunctor2();
  },
});
Object.defineProperty(Map, 'FunctorFilter2', {
  get(): FunctorFilter2<URI> {
    return mapFunctorFilter2();
  },
});
Object.defineProperty(Map, 'Foldable2', {
  get(): Foldable2<URI> {
    return mapFoldable2();
  },
});
Object.defineProperty(Map, 'Traversable2', {
  get(): Traversable2<URI> {
    return mapTraversable2();
  },
});

// HKT

export const URI = 'cats/data/map';
export type URI = typeof URI;

declare module '../../../fp/hkt' {
  interface URItoKind2<E, A> {
    [URI]: Map<E, A>;
  }
}
