import { AnyK, Kind, TyK, _ } from '@cats4ts/core';
import { List, Vector } from '@cats4ts/cats-core/lib/data';

import { Chunk } from '../chunk';
import { Stream as StreamBase } from './algebra';
import {
  empty,
  evalF,
  fromArray,
  fromChunk,
  fromList,
  fromVector,
  never,
  of,
  pure,
  range,
  repeatEval,
  suspend,
  throwError,
} from './constructor';
import { Spawn } from '@cats4ts/effect-kernel';

export type Stream<F extends AnyK, A> = StreamBase<F, A>;

export const Stream: StreamObj = function (...xs) {
  return fromArray(xs);
};

interface StreamObj {
  <F extends AnyK, A>(...xs: A[]): Stream<F, A>;
  pure<F extends AnyK, A>(x: A): Stream<F, A>;
  suspend<F extends AnyK, A>(thunk: () => Stream<F, A>): Stream<F, A>;
  throwError<F extends AnyK>(e: Error): Stream<F, never>;
  of<F extends AnyK, A>(...xs: A[]): Stream<F, A>;

  evalF<F extends AnyK, A>(fa: Kind<F, [A]>): Stream<F, A>;
  repeatEval<F extends AnyK, A>(fa: Kind<F, [A]>): Stream<F, A>;

  empty<F extends AnyK>(): Stream<F, never>;
  range<F extends AnyK>(
    from: number,
    until: number,
    step?: number,
  ): Stream<F, number>;
  never<F extends AnyK>(F: Spawn<F, Error>): Stream<F, never>;

  fromArray<F extends AnyK, A>(xs: A[]): Stream<F, A>;
  fromList<F extends AnyK, A>(xs: List<A>): Stream<F, A>;
  fromVector<F extends AnyK, A>(xs: Vector<A>): Stream<F, A>;
  fromChunk<F extends AnyK, A>(chunk: Chunk<A>): Stream<F, A>;
}

Stream.pure = pure;
Stream.suspend = suspend;
Stream.throwError = throwError;
Stream.of = of;

Stream.evalF = evalF;
Stream.repeatEval = repeatEval;

Stream.empty = empty;
Stream.range = range;
Stream.never = never;

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
