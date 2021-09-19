import { $, TyK, _, PrimitiveType } from '@cats4ts/core';
import {
  Foldable,
  Functor,
  FunctorFilter,
  Traversable,
  Hashable,
  primitiveMD5Hashable,
} from '@cats4ts/cats-core';

import { List } from '../list';

import { Empty, HashMap as HashMapBase } from './algebra';
import { fromArray, fromList, of } from './constructors';
import {
  mapFoldable,
  mapFunctor,
  mapFunctorFilter,
  mapTraversable,
} from './instances';

export const HashMap: HashMapObj = function <K extends PrimitiveType, V>(
  ...pairs: [K, V][]
): HashMap<K, V> {
  return of<K>(primitiveMD5Hashable())(...pairs);
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

  Functor<K>(): Functor<$<HashMapK, [K]>>;
  FunctorFilter<K>(): FunctorFilter<$<HashMapK, [K]>>;
  Foldable<K>(): Foldable<$<HashMapK, [K]>>;
  Traversable<K>(): Traversable<$<HashMapK, [K]>>;
}

HashMap.empty = Empty;
HashMap.of = of;
HashMap.fromArray = fromArray;
HashMap.fromList = fromList;

HashMap.Functor = mapFunctor;
HashMap.FunctorFilter = mapFunctorFilter;
HashMap.Foldable = mapFoldable;
HashMap.Traversable = mapTraversable;

// HKT

export const HashMapURI = 'cats/data/collections/hash-map';
export type HashMapURI = typeof HashMapURI;
export type HashMapK = TyK<HashMapURI, [_, _]>;

declare module '@cats4ts/core/lib/hkt/hkt' {
  interface URItoKind<Tys extends unknown[]> {
    [HashMapURI]: HashMap<Tys[0], Tys[1]>;
  }
}
