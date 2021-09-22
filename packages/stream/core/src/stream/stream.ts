import { List, Vector } from '@cats4ts/cats-core/lib/data';
import { AnyK, TyK, _ } from '@cats4ts/core';
import { Chunk } from '../chunk';
import { Stream as StreamBase } from './algebra';
import {
  empty,
  fromArray,
  fromChunk,
  fromList,
  fromVector,
  of,
} from './constructor';

export type Stream<F extends AnyK, A> = StreamBase<F, A>;

export const Stream: StreamObj = function (...xs) {
  return fromArray(xs);
};

interface StreamObj {
  <F extends AnyK, A>(...xs: A[]): Stream<F, A>;
  of<F extends AnyK, A>(...xs: A[]): Stream<F, A>;
  empty<F extends AnyK>(): Stream<F, never>;
  fromArray<F extends AnyK, A>(xs: A[]): Stream<F, A>;
  fromList<F extends AnyK, A>(xs: List<A>): Stream<F, A>;
  fromVector<F extends AnyK, A>(xs: Vector<A>): Stream<F, A>;
  fromChunk<F extends AnyK, A>(chunk: Chunk<A>): Stream<F, A>;
}

Stream.of = of;
Stream.empty = empty;
Stream.fromArray = fromArray;
Stream.fromList = fromList;
Stream.fromVector = fromVector;
Stream.fromChunk = fromChunk;

// -- HKT

export const StreamURI = 'cats4ts/stream/core/stream';
export type StreamURI = typeof StreamURI;
export type StreamK = TyK<StreamURI, [_, _]>;

declare module '@cats4ts/core/lib/hkt/hkt' {
  interface URItoKind<Tys extends unknown[]> {
    [StreamURI]: Tys[0] extends AnyK ? Stream<Tys[0], Tys[1]> : any;
  }
}
