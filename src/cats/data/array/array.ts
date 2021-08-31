import { empty, of } from './constructors';

// HKT

export const URI = 'cats/data/array';
export type URI = typeof URI;

declare module '../../../fp/hkt' {
  interface URItoKind<A> {
    [URI]: Array<A>;
  }
}

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
