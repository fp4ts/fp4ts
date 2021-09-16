import { List } from '../list';

import { FingerTree, Single, Empty } from './algebra';
import { append_ } from './operators';

export const pure = <A>(a: A): FingerTree<A> => new Single(a);

export const empty: FingerTree<never> = Empty;

export const singleton = <A>(a: A): FingerTree<A> => pure(a);

export const of = <A>(...xs: A[]): FingerTree<A> => fromArray(xs);

export const fromArray = <A>(xs: A[]): FingerTree<A> =>
  xs.reduce(append_, empty as FingerTree<A>);

export const fromList = <A>(xs: List<A>): FingerTree<A> =>
  xs.foldLeft(empty as FingerTree<A>, append_);
