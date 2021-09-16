import { TyK, _ } from '../../../../core';
import { List } from '../list';

import { FingerTree as FingerTreeBase } from './algebra';
import { empty, fromArray, fromList, pure, singleton } from './constructors';

export type FingerTree<A> = FingerTreeBase<A>;

export const FingerTree: FingerTreeObj = function <A>(
  ...xs: A[]
): FingerTree<A> {
  return fromArray(xs);
};

interface FingerTreeObj {
  <A>(...xs: A[]): FingerTree<A>;

  pure<A>(x: A): FingerTree<A>;
  singleton<A>(x: A): FingerTree<A>;
  empty: FingerTree<never>;

  fromArray<A>(xs: A[]): FingerTree<A>;
  fromList<A>(xs: List<A>): FingerTree<A>;
}

FingerTree.pure = pure;
FingerTree.singleton = singleton;
FingerTree.empty = empty;
FingerTree.fromArray = fromArray;
FingerTree.fromList = fromList;

// -- HKT

export const FingerTreeURI = 'cats/data/collections/finger-tree';
export type FingerTreeURI = typeof FingerTreeURI;
export type FingerTreeK = TyK<FingerTreeURI, [_]>;

declare module '../../../../core/hkt/hkt' {
  interface URItoKind<Tys extends unknown[]> {
    [FingerTreeURI]: FingerTree<Tys[0]>;
  }
}
