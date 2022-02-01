import { $type, PrimitiveType, TyK, TyVar } from '@fp4ts/core';
import { Ord } from '../../../ord';
import { Set as SetBase } from './algebra';
import { empty, fromArray } from './constructors';

export type Set<A> = SetBase<A>;

export const Set: SetObj = function (...xs) {
  return fromArray(Ord.primitive, xs);
};

interface SetObj {
  <A extends PrimitiveType>(...xs: A[]): Set<A>;
  fromArray<A extends PrimitiveType>(xs: A[]): Set<A>;
  fromArray<A>(O: Ord<A>, xs: A[]): Set<A>;

  empty: Set<never>;
}

Set.fromArray = function (O: any, xs?: any) {
  return xs !== undefined ? fromArray(O, xs) : fromArray(Ord.primitive, O);
};

Set.empty = empty;

// -- HKT

export interface SetK extends TyK<[unknown]> {
  [$type]: Set<TyVar<this, 0>>;
}
