import { TyK, _ } from '../../../../core';
import { List } from '../list';

import { Vector as VectorBase } from './algebra';
import { empty, fromArray, fromList, pure, singleton } from './constructors';

export type Vector<A> = VectorBase<A>;

export const Vector: VectorObj = function <A>(...xs: A[]): Vector<A> {
  return fromArray(xs);
};

interface VectorObj {
  <A>(...xs: A[]): Vector<A>;

  pure<A>(x: A): Vector<A>;
  singleton<A>(x: A): Vector<A>;
  empty: Vector<never>;

  fromArray<A>(xs: A[]): Vector<A>;
  fromList<A>(xs: List<A>): Vector<A>;
}

Vector.pure = pure;
Vector.singleton = singleton;
Vector.empty = empty;
Vector.fromArray = fromArray;
Vector.fromList = fromList;

// -- HKT

export const VectorURI = 'cats/data/collections/vector';
export type VectorURI = typeof VectorURI;
export type VectorK = TyK<VectorURI, [_]>;

declare module '../../../../core/hkt/hkt' {
  interface URItoKind<Tys extends unknown[]> {
    [VectorURI]: Vector<Tys[0]>;
  }
}
