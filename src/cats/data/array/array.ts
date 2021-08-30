import { empty, of } from './constructors';

interface ArrayCon {
  <A>(...xs: A[]): A[];

  empty: Array<never>;
  of: <A>(...xs: A[]) => A[];
}

export type Array<A> = A[];

export const Array: ArrayCon = function (...xs) {
  return xs;
};
Array.of = of;
Array.empty = empty;

// HKT

export const URI = 'cats/array';
export type URI = typeof URI;

declare module '../../../fp/hkt' {
  interface URItoKind<A> {
    [URI]: Array<A>;
  }
}
