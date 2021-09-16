import { List } from '../list';

import { Vector, Single, Empty } from './algebra';
import { append_ } from './operators';

export const pure = <A>(a: A): Vector<A> => new Single(a);

export const empty: Vector<never> = Empty;

export const singleton = <A>(a: A): Vector<A> => pure(a);

export const of = <A>(...xs: A[]): Vector<A> => fromArray(xs);

export const fromArray = <A>(xs: A[]): Vector<A> =>
  xs.reduce(append_, empty as Vector<A>);

export const fromList = <A>(xs: List<A>): Vector<A> =>
  xs.foldLeft(empty as Vector<A>, append_);
