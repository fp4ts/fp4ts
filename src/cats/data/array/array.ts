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

export const ArrayURI = 'cats/data/array';
export type ArrayURI = typeof ArrayURI;

declare module '../../../core/hkt/hkt' {
  interface URItoKind<FC, TC, S, R, E, A> {
    [ArrayURI]: Array<A>;
  }
}
