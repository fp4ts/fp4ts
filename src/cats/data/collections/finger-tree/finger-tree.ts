import { TyK, _ } from '../../../../core';
import { List } from '../list';

import { FingerTree as FingerTreeBase } from './algebra';
import { empty, fromArray, fromList, pure, singleton } from './constructors';
import { Measured } from './measured';

export type FingerTree<V, A> = FingerTreeBase<V, A>;

export const FingerTree: FingerTreeObj = function <V, A>(
  M: Measured<A, V>,
): (...xs: A[]) => FingerTree<V, A> {
  return (...xs) => fromArray(M)(xs);
};

interface FingerTreeObj {
  <V, A>(M: Measured<A, V>): (...xs: A[]) => FingerTree<V, A>;

  pure<V, A>(x: A): FingerTree<V, A>;
  singleton<V, A>(x: A): FingerTree<V, A>;
  empty<V>(): FingerTree<V, never>;

  fromArray<V, A>(M: Measured<A, V>): (xs: A[]) => FingerTree<V, A>;
  fromList<V, A>(M: Measured<A, V>): (xs: List<A>) => FingerTree<V, A>;
}

FingerTree.pure = pure;
FingerTree.singleton = singleton;
FingerTree.empty = empty;
FingerTree.fromArray = fromArray;
FingerTree.fromList = fromList;

// -- HKT

export const FingerTreeURI = 'cats/data/collections/finger-tree';
export type FingerTreeURI = typeof FingerTreeURI;
export type FingerTreeK = TyK<FingerTreeURI, [_, _]>;

declare module '../../../../core/hkt/hkt' {
  interface URItoKind<Tys extends unknown[]> {
    [FingerTreeURI]: FingerTree<Tys[0], Tys[1]>;
  }
}
