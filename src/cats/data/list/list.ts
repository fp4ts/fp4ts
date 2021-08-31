import { List as ListBase } from './algebra';
import { empty, fromArray, of, pure } from './constructors';

export { URI } from './algebra';

export type List<A> = ListBase<A>;

export const List: ListObj = function <A>(...xs: A[]): List<A> {
  return fromArray(xs);
};

interface ListObj {
  <A>(...xs: A[]): List<A>;

  pure: <A>(x: A) => List<A>;
  empty: List<never>;
  of: <A>(...xs: A[]) => List<A>;
}

List.pure = pure;
List.empty = empty;
List.of = of;
