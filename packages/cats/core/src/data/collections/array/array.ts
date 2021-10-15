import { $type, TyK, TyVar } from '@cats4ts/core';
import { empty, of } from './constructors';

interface ArrayObj {
  <A>(...xs: A[]): A[];

  empty: Array<never>;
  of: <A>(...xs: A[]) => A[];
}

export type Array<A> = A[];

export const Array: ArrayObj = function (...xs) {
  return xs;
};
Array.of = of;
Array.empty = empty;

// HKT

export interface ArrayK extends TyK<[unknown]> {
  [$type]: Array<TyVar<this, 0>>;
}
