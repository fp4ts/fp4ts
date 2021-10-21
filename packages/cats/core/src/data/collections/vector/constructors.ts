import { List } from '../list';

import * as FT from '../finger-tree/functional';
import { Vector } from './algebra';
import { sizeMeasured } from './instances';
import { append_ } from './operators';

export const pure: <A>(a: A) => Vector<A> = x => new Vector(FT.pure(x));

export const empty: Vector<never> = new Vector(FT.empty());

export const singleton: <A>(a: A) => Vector<A> = pure;

export const of = <A>(...xs: A[]): Vector<A> => fromArray(xs);

export const fromArray = <A>(xs: A[]): Vector<A> =>
  new Vector(FT.fromArray(sizeMeasured)(xs));

export const fromList = <A>(xs: List<A>): Vector<A> =>
  new Vector(FT.fromList(sizeMeasured)(xs));

export const fromIterator = <A>(xs: Iterator<A>): Vector<A> => {
  let result: Vector<A> = empty;
  for (let it = xs.next(); !it.done; it = xs.next()) {
    result = append_(result, it.value);
  }
  return result;
};
