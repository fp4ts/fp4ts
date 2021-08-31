import { List as ListBase } from './algebra';
import { empty, fromArray, of, pure } from './constructors';

// HKT

export const URI = 'cats/data/list';
export type URI = typeof URI;

declare module '../../../fp/hkt' {
  interface URItoKind<A> {
    [URI]: List<A>;
  }
}

export type List<A> = ListBase<A>;

export const List: ListObj = function <A>(...xs: A[]): List<A> {
  return fromArray(xs);
};

interface ListObj {
  <A>(...xs: A[]): List<A>;

  pure: <A>(x: A) => List<A>;
  empty: List<never>;
  of: <A>(...xs: A[]) => List<A>;
  fromArray: <A>(xs: A[]) => List<A>;
}

List.pure = pure;
List.empty = empty;
List.of = of;
List.fromArray = fromArray;
