import { TyK, _ } from '../../../../core';
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

export const ArrayURI = 'cats/data/collections/array';
export type ArrayURI = typeof ArrayURI;
export type ArrayK = TyK<ArrayURI, [_]>;

declare module '../../../../core/hkt/hkt' {
  interface URItoKind<Tys extends unknown[]> {
    [ArrayURI]: Array<Tys[0]>;
  }
}
