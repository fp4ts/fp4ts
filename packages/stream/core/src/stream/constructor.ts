import { List, Vector } from '@cats4ts/cats-core/lib/data';
import { AnyK } from '@cats4ts/core';
import { Chunk } from '../chunk';
import { Pull } from '../pull';
import { Stream } from './algebra';

export const pure = <F extends AnyK, A>(x: A): Stream<F, A> =>
  new Stream(Pull.output1(x));

export const empty = <F extends AnyK>(): Stream<F, never> =>
  new Stream(Pull.done());

export const of = <F extends AnyK, A>(...xs: A[]): Stream<F, A> =>
  fromArray(xs);

export const fromArray = <F extends AnyK, A>(xs: A[]): Stream<F, A> => {
  switch (xs.length) {
    case 0:
      return empty();
    case 1:
      return pure(xs[0]);
    default:
      return new Stream(Pull.output(Chunk.fromArray(xs)));
  }
};

export const fromList = <F extends AnyK, A>(xs: List<A>): Stream<F, A> =>
  fromArray(xs.toArray);

export const fromVector = <F extends AnyK, A>(xs: Vector<A>): Stream<F, A> =>
  fromArray(xs.toArray);

export const fromChunk = <F extends AnyK, A>(chunk: Chunk<A>): Stream<F, A> =>
  new Stream(Pull.output(chunk));
