// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Kind, TyK, TyVar } from '@fp4ts/core';
import { Either, List, Option, Vector } from '@fp4ts/cats';
import {
  Poll,
  ExitCase,
  MonadCancel,
  Temporal,
  Resource,
  QueueSource,
} from '@fp4ts/effect';

import { PureK } from '../pure';
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
  bracketFullWeak,
  bracketFull,
  bracketWeak,
  bracket,
  force,
  repeat,
  emitChunk,
  awakeDelay,
  fixedDelay,
  resource,
  resourceWeak,
  fromQueueNoneTerminated,
  fromQueueNoneTerminatedChunk,
} from './constructors';
import { Spawn } from '@fp4ts/effect';
import {
  Align,
  Defer,
  Functor,
  FunctorFilter,
  Monad,
  MonadError,
  MonoidK,
} from '@fp4ts/cats';
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
  <F = PureK, A = never>(...xs: A[]): Stream<F, A>;
  pure<F = PureK, A = never>(x: A): Stream<F, A>;
  defer<F = PureK, A = never>(thunk: () => Stream<F, A>): Stream<F, A>;
  throwError<F = PureK>(e: Error): Stream<F, never>;
  of<F = PureK, A = never>(...xs: A[]): Stream<F, A>;
  emitChunk<F = PureK, A = never>(c: Chunk<A>): Stream<F, A>;

  evalF<F = PureK, A = never>(fa: Kind<F, [A]>): Stream<F, A>;
  execF<F = PureK, A = never>(fa: Kind<F, [A]>): Stream<F, never>;
  force<F = PureK, A = never>(fs: Kind<F, [Stream<F, A>]>): Stream<F, A>;
  evalUnChunk<F = PureK, A = never>(fa: Kind<F, [Chunk<A>]>): Stream<F, A>;
  repeat<A>(value: A): Stream<PureK, A>;
  repeatEval<F = PureK, A = never>(fa: Kind<F, [A]>): Stream<F, A>;

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

  awakeDelay<F>(F: Temporal<F, Error>): (period: number) => Stream<F, number>;
  fixedDelay<F>(F: Temporal<F, Error>): (period: number) => Stream<F, void>;

  empty<F = PureK>(): Stream<F, never>;
  range<F = PureK>(
    from: number,
    until: number,
    step?: number,
  ): Stream<F, number>;
  never<F = PureK>(F: Spawn<F, Error>): Stream<F, never>;

  unfold<S>(
    s: S,
  ): <F = PureK, A = never>(f: (s: S) => Option<[A, S]>) => Stream<F, A>;
  unfoldChunk<S>(
    s: S,
  ): <F = PureK, A = never>(f: (s: S) => Option<[Chunk<A>, S]>) => Stream<F, A>;

  tailRecM<S>(
    s: S,
  ): <F = PureK, A = never>(
    f: (s: S) => Stream<F, Either<S, A>>,
  ) => Stream<F, A>;

  fromArray<F = PureK, A = never>(xs: A[]): Stream<F, A>;
  fromList<F = PureK, A = never>(xs: List<A>): Stream<F, A>;
  fromVector<F = PureK, A = never>(xs: Vector<A>): Stream<F, A>;
  fromChunk<F = PureK, A = never>(chunk: Chunk<A>): Stream<F, A>;

  bracket<F, R>(
    resource: Kind<F, [R]>,
    release: (r: R, ec: ExitCase) => Kind<F, [void]>,
  ): Stream<F, R>;
  bracketWeak<F, R>(
    resource: Kind<F, [R]>,
    release: (r: R, ec: ExitCase) => Kind<F, [void]>,
  ): Stream<F, R>;
  bracketFull<F>(
    F: MonadCancel<F, Error>,
  ): <R>(
    acquire: (p: Poll<F>) => Kind<F, [R]>,
    release: (r: R, ec: ExitCase) => Kind<F, [void]>,
  ) => Stream<F, R>;
  bracketFullWeak<F>(
    F: MonadCancel<F, Error>,
  ): <R>(
    acquire: (p: Poll<F>) => Kind<F, [R]>,
    release: (r: R, ec: ExitCase) => Kind<F, [void]>,
  ) => Stream<F, R>;

  resource<F>(F: MonadCancel<F, Error>): <A>(r: Resource<F, A>) => Stream<F, A>;
  resourceWeak<F>(
    F: MonadCancel<F, Error>,
  ): <A>(r: Resource<F, A>) => Stream<F, A>;

  fromQueueNoneTerminated<F, A>(
    q: QueueSource<F, Option<A>>,
    limit?: number,
  ): Stream<F, A>;

  fromQueueNoneTerminatedChunk<F, A>(
    q: QueueSource<F, Option<Chunk<A>>>,
    limit?: number,
  ): Stream<F, A>;

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
Stream.emitChunk = emitChunk;

Stream.evalF = evalF;
Stream.execF = execF;
Stream.force = force;
Stream.evalUnChunk = evalUnChunk;
Stream.repeat = repeat;
Stream.repeatEval = repeatEval;
Stream.sleep = sleep;
Stream.retry = retry;

Stream.awakeDelay = awakeDelay;
Stream.fixedDelay = fixedDelay;

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

Stream.bracket = bracket;
Stream.bracketWeak = bracketWeak;
Stream.bracketFull = bracketFull;
Stream.bracketFullWeak = bracketFullWeak;

Stream.resource = resource;
Stream.resourceWeak = resourceWeak;

Stream.fromQueueNoneTerminated = fromQueueNoneTerminated;
Stream.fromQueueNoneTerminatedChunk = fromQueueNoneTerminatedChunk;

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
