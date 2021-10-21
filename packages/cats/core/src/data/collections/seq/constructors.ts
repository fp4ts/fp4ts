import { id } from '@cats4ts/core';
import { Vector } from '../vector';
import { List } from '../list';
import { Seq } from './seq';

export const pure = <A>(x: A): Seq<A> => Vector.pure(x);
export const singleton = pure;
export const of = <A>(...xs: A[]): Seq<A> => fromArray(xs);
export const fromArray = <A>(xs: A[]): Seq<A> => Vector.fromArray(xs);
export const fromList: <A>(xs: List<A>) => Seq<A> = id;
export const fromVector: <A>(xs: Vector<A>) => Seq<A> = id;
export const fromIterator: <A>(xs: Iterator<A>) => Seq<A> = xs =>
  Vector.fromIterator(xs);

export const range = (from: number, to: number): Seq<number> =>
  Vector.range(from, to);
