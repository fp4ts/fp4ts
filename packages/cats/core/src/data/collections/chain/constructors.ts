import { Vector } from '../vector';
import { List } from '../list';
import { Seq } from '../seq';

import { Chain, Empty, Singleton, Wrap } from './algebra';

export const pure = <A>(a: A): Chain<A> => new Singleton(a);
export const singleton = pure;

export const empty: Chain<never> = Empty;

export const of = <A>(...xs: A[]): Chain<A> => fromArray(xs);

export const fromSeq = <A>(xs: Seq<A>): Chain<A> =>
  xs.nonEmpty ? new Wrap(xs) : Empty;

export const fromArray: <A>(xs: A[]) => Chain<A> = fromSeq;

export const fromList: <A>(xs: List<A>) => Chain<A> = fromSeq;

export const fromVector: <A>(xs: Vector<A>) => Chain<A> = fromSeq;
