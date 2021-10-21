import { id } from '@cats4ts/core';

import { Vector } from '../vector';
import { Seq } from './seq';

export const concat_ = <A>(xs: Seq<A>, ys: Seq<A>): Seq<A> =>
  Vector.fromIterator(xs.iterator)['+++'](Vector.fromIterator(ys.iterator));

export const flatMapSeq_ = <A, B>(xs: Seq<A>, f: (a: A) => Seq<B>): Seq<B> =>
  Vector.fromIterator(xs.iterator).flatMap(x =>
    Vector.fromIterator(f(x).iterator),
  );

export const flattenSeq = <A>(xs: Seq<Seq<A>>): Seq<A> => flatMapSeq_(xs, id);
