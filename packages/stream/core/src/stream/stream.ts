import { AnyK, Kind, TyK, _ } from '@cats4ts/core';
import { Either, List, Option, Vector } from '@cats4ts/cats-core/lib/data';

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
  defer,
  throwError,
  unfold,
  unfoldChunk,
  tailRecM,
} from './constructor';
import { Spawn } from '@cats4ts/effect-kernel';

export type Stream<F extends AnyK, A> = StreamBase<F, A>;

export const Stream: StreamObj = function (...xs) {
  return fromArray(xs);
};

interface StreamObj {
  <F extends AnyK, A>(...xs: A[]): Stream<F, A>;
  pure<F extends AnyK, A>(x: A): Stream<F, A>;
  defer<F extends AnyK, A>(thunk: () => Stream<F, A>): Stream<F, A>;
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

  unfold<S>(
    s: S,
  ): <F extends AnyK, A>(f: (s: S) => Option<[A, S]>) => Stream<F, A>;
  unfoldChunk<S>(
    s: S,
  ): <F extends AnyK, A>(f: (s: S) => Option<[Chunk<A>, S]>) => Stream<F, A>;

  tailRecM<S>(
    s: S,
  ): <F extends AnyK, A>(f: (s: S) => Stream<F, Either<S, A>>) => Stream<F, A>;

  fromArray<F extends AnyK, A>(xs: A[]): Stream<F, A>;
  fromList<F extends AnyK, A>(xs: List<A>): Stream<F, A>;
  fromVector<F extends AnyK, A>(xs: Vector<A>): Stream<F, A>;
  fromChunk<F extends AnyK, A>(chunk: Chunk<A>): Stream<F, A>;
}

Stream.pure = pure;
Stream.defer = defer;
Stream.throwError = throwError;
Stream.of = of;

Stream.evalF = evalF;
Stream.repeatEval = repeatEval;

Stream.empty = empty;
Stream.range = range;
Stream.never = never;

Stream.unfold = unfold;
Stream.unfoldChunk = unfoldChunk;

Stream.tailRecM = tailRecM;

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
