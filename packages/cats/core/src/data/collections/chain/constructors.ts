import { Kind } from '@cats4ts/core';
import { Foldable } from '../../../foldable';
import { Vector } from '../vector';
import { List } from '../list';

import { Chain, Empty, Singleton, Wrap } from './algebra';

export const pure = <A>(a: A): Chain<A> => new Singleton(a);
export const singleton = pure;

export const empty: Chain<never> = Empty;

export const of = <A>(...xs: A[]): Chain<A> => fromArray(xs);

export const fromArray: <A>(xs: A[]) => Chain<A> = xs =>
  fromVector(Vector.fromArray(xs));

export const fromList: <A>(xs: List<A>) => Chain<A> = xs =>
  fromFoldable(List.Foldable)(xs);

export const fromVector: <A>(xs: Vector<A>) => Chain<A> = xs =>
  fromFoldable(Vector.Foldable)(xs);

export const fromFoldable =
  <F>(F: Foldable<F>) =>
  <A>(fa: Kind<F, [A]>): Chain<A> =>
    F.nonEmpty(fa) ? new Wrap(F, fa) : Empty;
