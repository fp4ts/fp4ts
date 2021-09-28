import { $, TyK, _, PrimitiveType } from '@cats4ts/core';
import { Eq } from '../../../eq';
import { SemigroupK } from '../../../semigroup-k';
import { MonoidK } from '../../../monoid-k';
import { Functor } from '../../../functor';
import { FunctorFilter } from '../../../functor-filter';
import { UnorderedFoldable } from '../../../unordered-foldable';
import { UnorderedTraversable } from '../../../unordered-traversable';
import { Hashable, primitiveMD5Hashable } from '../../../hashable';

import { List } from '../list';

import { Empty, HashMap as HashMapBase } from './algebra';
import { fromArray, fromList, of } from './constructors';
import {
  hashMapUnorderedFoldable,
  hashMapFunctor,
  hashMapFunctorFilter,
  hashMapUnorderedTraversable,
  hashMapMonoidK,
  hashMapSemigroupK,
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

  SemigroupK<K>(E: Eq<K>): SemigroupK<$<HashMapK, [K]>>;
  MonoidK<K>(E: Eq<K>): MonoidK<$<HashMapK, [K]>>;
  Functor<K>(): Functor<$<HashMapK, [K]>>;
  FunctorFilter<K>(): FunctorFilter<$<HashMapK, [K]>>;
  UnorderedFoldable<K>(): UnorderedFoldable<$<HashMapK, [K]>>;
  UnorderedTraversable<K>(): UnorderedTraversable<$<HashMapK, [K]>>;
}

HashMap.empty = Empty;
HashMap.of = of;
HashMap.fromArray = fromArray;
HashMap.fromList = fromList;

HashMap.SemigroupK = hashMapSemigroupK;
HashMap.MonoidK = hashMapMonoidK;
HashMap.Functor = hashMapFunctor;
HashMap.FunctorFilter = hashMapFunctorFilter;
HashMap.UnorderedFoldable = hashMapUnorderedFoldable;
HashMap.UnorderedTraversable = hashMapUnorderedTraversable;

// HKT

export const HashMapURI = 'cats/data/collections/hash-map';
export type HashMapURI = typeof HashMapURI;
export type HashMapK = TyK<HashMapURI, [_, _]>;

declare module '@cats4ts/core/lib/hkt/hkt' {
  interface URItoKind<Tys extends unknown[]> {
    [HashMapURI]: HashMap<Tys[0], Tys[1]>;
  }
}
