import { List } from '../list';

import * as FT from '../finger-tree/functional';
import { Vector } from './algebra';
import { sizeMeasured } from './instances';

export const pure: <A>(a: A) => Vector<A> = x => new Vector(FT.pure(x));

export const empty: Vector<never> = new Vector(FT.empty());

export const singleton: <A>(a: A) => Vector<A> = pure;

export const of = <A>(...xs: A[]): Vector<A> => fromArray(xs);

export const fromArray = <A>(xs: A[]): Vector<A> =>
  new Vector(FT.fromArray(sizeMeasured)(xs));

export const fromList = <A>(xs: List<A>): Vector<A> =>
  new Vector(FT.fromList(sizeMeasured)(xs));
