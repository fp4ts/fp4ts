import { $, $type, Kind, TyK, TyVar } from '@cats4ts/core';
import { Either, List, Option, Vector } from '@cats4ts/cats';
import { Temporal, SyncIoK } from '@cats4ts/effect';

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
  evalUnChunk,
  sleep,
  retry,
  execF,
} from './constructors';
import { Spawn } from '@cats4ts/effect';
import {
  Align,
  Defer,
  Functor,
  FunctorFilter,
  Monad,
  MonadError,
  MonoidK,
} from '@cats4ts/cats';
import {
  streamAlign,
  streamDefer,
  streamFunctor,
  streamFunctorFilter,
  streamMonad,
  streamMonadError,
  streamMonoidK,
} from './instances';

export type Stream<F, A> = StreamBase<F, A>;

export const Stream: StreamObj = function (...xs) {
  return fromArray(xs);
};

interface StreamObj {
  <F = SyncIoK, A = never>(...xs: A[]): Stream<F, A>;
  pure<F = SyncIoK, A = never>(x: A): Stream<F, A>;
  defer<F = SyncIoK, A = never>(thunk: () => Stream<F, A>): Stream<F, A>;
  throwError<F = SyncIoK>(e: Error): Stream<F, never>;
  of<F = SyncIoK, A = never>(...xs: A[]): Stream<F, A>;

  evalF<F = SyncIoK, A = never>(fa: Kind<F, [A]>): Stream<F, A>;
  execF<F = SyncIoK, A = never>(fa: Kind<F, [A]>): Stream<F, never>;
  evalUnChunk<F = SyncIoK, A = never>(fa: Kind<F, [Chunk<A>]>): Stream<F, A>;
  repeatEval<F = SyncIoK, A = never>(fa: Kind<F, [A]>): Stream<F, A>;

  sleep<F>(F: Temporal<F, Error>): (ms: number) => Stream<F, void>;

  retry<F>(
    F: Temporal<F, Error>,
  ): <A>(
    fa: Kind<F, [A]>,
    delay: number,
    nextDelay: (n: number) => number,
    maxAttempts: number,
    retriable?: (e: Error) => boolean,
  ) => Stream<F, A>;

  empty<F = SyncIoK>(): Stream<F, never>;
  range<F = SyncIoK>(
    from: number,
    until: number,
    step?: number,
  ): Stream<F, number>;
  never<F = SyncIoK>(F: Spawn<F, Error>): Stream<F, never>;

  unfold<S>(
    s: S,
  ): <F = SyncIoK, A = never>(f: (s: S) => Option<[A, S]>) => Stream<F, A>;
  unfoldChunk<S>(
    s: S,
  ): <F = SyncIoK, A = never>(
    f: (s: S) => Option<[Chunk<A>, S]>,
  ) => Stream<F, A>;

  tailRecM<S>(
    s: S,
  ): <F = SyncIoK, A = never>(
    f: (s: S) => Stream<F, Either<S, A>>,
  ) => Stream<F, A>;

  fromArray<F = SyncIoK, A = never>(xs: A[]): Stream<F, A>;
  fromList<F = SyncIoK, A = never>(xs: List<A>): Stream<F, A>;
  fromVector<F = SyncIoK, A = never>(xs: Vector<A>): Stream<F, A>;
  fromChunk<F = SyncIoK, A = never>(chunk: Chunk<A>): Stream<F, A>;

  // -- Instances

  MonoidK<F>(): MonoidK<$<StreamK, [F]>>;
  Defer<F>(): Defer<$<StreamK, [F]>>;
  Functor<F>(): Functor<$<StreamK, [F]>>;
  Align<F>(): Align<$<StreamK, [F]>>;
  FunctorFilter<F>(): FunctorFilter<$<StreamK, [F]>>;
  Monad<F>(): Monad<$<StreamK, [F]>>;
  MonadError<F>(): MonadError<$<StreamK, [F]>, Error>;
}

Stream.pure = pure;
Stream.defer = defer;
Stream.throwError = throwError;
Stream.of = of;

Stream.evalF = evalF;
Stream.execF = execF;
Stream.evalUnChunk = evalUnChunk;
Stream.repeatEval = repeatEval;
Stream.sleep = sleep;
Stream.retry = retry;

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

Stream.MonoidK = streamMonoidK;
Stream.Defer = streamDefer;
Stream.Functor = streamFunctor;
Stream.Align = streamAlign;
Stream.FunctorFilter = streamFunctorFilter;
Stream.Monad = streamMonad;
Stream.MonadError = streamMonadError;

// -- HKT

export interface StreamK extends TyK<[unknown, unknown]> {
  [$type]: Stream<TyVar<this, 0>, TyVar<this, 1>>;
}
