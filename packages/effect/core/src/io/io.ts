// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { $type, Kind, TyK, TyVar } from '@fp4ts/core';
import {
  Applicative,
  Apply,
  Defer,
  FlatMap,
  Functor,
  Monad,
  MonadError,
  Traversable,
  Either,
  Option,
  Parallel,
} from '@fp4ts/cats';

import {
  Poll,
  MonadCancel,
  Sync,
  Spawn,
  Concurrent,
  Temporal,
  Async,
  ExecutionContext,
  Ref,
  Deferred,
} from '@fp4ts/effect-kernel';

import { IOOutcome } from '../io-outcome';

import { IO as IOBase } from './algebra';
import {
  async,
  async_,
  canceled,
  currentTimeMicros,
  currentTimeMillis,
  defer,
  deferPromise,
  delay,
  fromEither,
  fromPromise,
  never,
  pure,
  readExecutionContext,
  sleep,
  suspend,
  throwError,
  uncancelable,
  unit,
} from './constructors';
import {
  bothOutcome_,
  both_,
  bracketFull,
  parSequence,
  parSequenceN,
  parSequenceN_,
  parTraverse,
  parTraverseN,
  parTraverseN_,
  parTraverse_,
  raceOutcome_,
  race_,
  sequence,
  tailRecM,
  traverse,
  traverse_,
} from './operators';
import {
  ioAsync,
  ioConcurrent,
  ioDefer,
  ioFlatMap,
  ioFunctor,
  ioMonad,
  ioMonadCancel,
  ioMonadError,
  ioParallel,
  ioApplicative,
  ioApply,
  ioSpawn,
  ioSync,
  ioTemporal,
} from './instances';

export type IO<A> = IOBase<A>;

export const IO: IOObj = function <A>(thunk: () => A): IO<A> {
  return delay(thunk);
} as any;

interface IOObj {
  <A>(thunk: () => A): IO<A>;

  pure: <A>(a: A) => IO<A>;

  tailRecM: <A>(a: A) => <B>(f: (a: A) => IO<Either<A, B>>) => IO<B>;

  delay: <A>(thunk: () => A) => IO<A>;

  defer: <A>(thunk: () => IO<A>) => IO<A>;

  deferPromise: <A>(thunk: () => Promise<A>) => IO<A>;

  fromPromise: <A>(iop: IO<Promise<A>>) => IO<A>;
  fromEither: <A>(ea: Either<Error, A>) => IO<A>;

  throwError: (e: Error) => IO<never>;

  currentTimeMicros: IO<number>;
  currentTimeMillis: IO<number>;

  readExecutionContext: IO<ExecutionContext>;

  async: <A>(
    k: (cb: (ea: Either<Error, A>) => void) => IO<Option<IO<void>>>,
  ) => IO<A>;

  async_: <A>(k: (cb: (ea: Either<Error, A>) => void) => void) => IO<A>;

  unit: IO<void>;

  never: IO<never>;

  canceled: IO<void>;

  suspend: IO<void>;

  ref: <A>(a: A) => IO<Ref<IOF, A>>;

  deferred: <A>() => IO<Deferred<IOF, A>>;

  uncancelable: <A>(ioa: (p: Poll<IOF>) => IO<A>) => IO<A>;

  sleep: (ms: number) => IO<void>;

  race: <A, B>(ioa: IO<A>, iob: IO<B>) => IO<Either<A, B>>;
  raceOutcome: <A, B>(
    ioa: IO<A>,
    iob: IO<B>,
  ) => IO<Either<IOOutcome<A>, IOOutcome<B>>>;

  both: <A, B>(ioa: IO<A>, iob: IO<B>) => IO<[A, B]>;
  bothOutcome: <A, B>(
    ioa: IO<A>,
    iob: IO<B>,
  ) => IO<[IOOutcome<A>, IOOutcome<B>]>;

  sequence: <T>(
    T: Traversable<T>,
  ) => <A>(iots: Kind<T, [IO<A>]>) => IO<Kind<T, [A]>>;

  traverse: <T>(
    T: Traversable<T>,
  ) => <A, B>(f: (a: A) => IO<B>) => (ts: Kind<T, [A]>) => IO<Kind<T, [B]>>;

  traverse_: <T, A, B>(
    T: Traversable<T>,
    ts: Kind<T, [A]>,
    f: (a: A) => IO<B>,
  ) => IO<Kind<T, [B]>>;

  parSequence: <T>(
    T: Traversable<T>,
  ) => <A>(iots: Kind<T, [IO<A>]>) => IO<Kind<T, [A]>>;

  parTraverse: <T>(
    T: Traversable<T>,
  ) => <A, B>(f: (a: A) => IO<B>) => (ts: Kind<T, [A]>) => IO<Kind<T, [B]>>;
  parTraverse_: <T>(
    T: Traversable<T>,
  ) => <A, B>(ts: Kind<T, [A]>, f: (a: A) => IO<B>) => IO<Kind<T, [B]>>;

  parSequenceN: <T>(
    T: Traversable<T>,
  ) => (
    maxConcurrent: number,
  ) => <A>(iots: Kind<T, [IO<A>]>) => IO<Kind<T, [A]>>;
  parSequenceN_: <T>(
    T: Traversable<T>,
  ) => <A>(iots: Kind<T, [IO<A>]>, maxConcurrent: number) => IO<Kind<T, [A]>>;

  parTraverseN: <T>(
    T: Traversable<T>,
  ) => <A, B>(
    maxConcurrent: number,
    f: (a: A) => IO<B>,
  ) => (ts: Kind<T, [A]>) => IO<Kind<T, [B]>>;
  parTraverseN_: <T>(
    T: Traversable<T>,
  ) => <A>(
    ts: Kind<T, [A]>,
    maxConcurrent: number,
  ) => <B>(f: (a: A) => IO<B>) => IO<Kind<T, [B]>>;

  bracketFull: <A, B>(
    acquire: (poll: Poll<IOF>) => IO<A>,
    use: (a: A) => IO<B>,
    release: (a: A, oc: IOOutcome<B>) => IO<void>,
  ) => IO<B>;

  // Do notation

  Do: IO<{}>;

  bindTo: <N extends string, S extends {}, B>(
    name: N,
    iob: IO<B> | ((s: S) => IO<B>),
  ) => (
    ios: IO<S>,
  ) => IO<{ readonly [K in keyof S | N]: K extends keyof S ? S[K] : B }>;

  bind: <S extends {}, B>(
    iob: IO<B> | ((s: S) => IO<B>),
  ) => (ios: IO<S>) => IO<S>;

  // -- Instances

  readonly Defer: Defer<IOF>;
  readonly Functor: Functor<IOF>;
  readonly Apply: Apply<IOF>;
  readonly Applicative: Applicative<IOF>;
  readonly FlatMap: FlatMap<IOF>;
  readonly Monad: Monad<IOF>;
  readonly MonadError: MonadError<IOF, Error>;
  readonly MonadCancel: MonadCancel<IOF, Error>;
  readonly Sync: Sync<IOF>;
  readonly Spawn: Spawn<IOF, Error>;
  readonly Parallel: Parallel<IOF, IOF>;
  readonly Concurrent: Concurrent<IOF, Error>;
  readonly Temporal: Temporal<IOF, Error>;
  readonly Async: Async<IOF>;
}

IO.pure = pure;

IO.tailRecM = tailRecM;

IO.delay = delay;

IO.defer = defer;

IO.deferPromise = deferPromise;

IO.fromPromise = fromPromise;
IO.fromEither = fromEither;

IO.throwError = throwError;

IO.currentTimeMicros = currentTimeMicros;
IO.currentTimeMillis = currentTimeMillis;

IO.readExecutionContext = readExecutionContext;

IO.async = async;

IO.async_ = async_;

IO.unit = unit;

IO.never = never;

IO.canceled = canceled;

IO.suspend = suspend;

IO.ref = x => ioAsync().ref(x);

IO.deferred = () => ioAsync().deferred();

IO.uncancelable = uncancelable;

IO.sleep = sleep;

IO.race = race_;
IO.raceOutcome = raceOutcome_;

IO.both = both_;
IO.bothOutcome = bothOutcome_;

IO.sequence = sequence;

IO.traverse = traverse;
IO.traverse_ = traverse_;

IO.parSequence = parSequence;

IO.parTraverse = parTraverse;
IO.parTraverse_ = parTraverse_;

IO.parSequenceN = parSequenceN;
IO.parSequenceN_ = parSequenceN_;

IO.parTraverseN = parTraverseN;
IO.parTraverseN_ = parTraverseN_;

IO.bracketFull = bracketFull;

Object.defineProperty(IO, 'Do', {
  get() {
    return ioAsync().Do;
  },
});
Object.defineProperty(IO, 'bindTo', {
  get() {
    return ioAsync().bindTo;
  },
});
Object.defineProperty(IO, 'bind', {
  get() {
    return ioAsync().bind;
  },
});

Object.defineProperty(IO, 'Defer', {
  get(): Defer<IOF> {
    return ioDefer();
  },
});
Object.defineProperty(IO, 'Functor', {
  get(): Functor<IOF> {
    return ioFunctor();
  },
});
Object.defineProperty(IO, 'Apply', {
  get(): Apply<IOF> {
    return ioApply();
  },
});
Object.defineProperty(IO, 'Applicative', {
  get(): Applicative<IOF> {
    return ioApplicative();
  },
});
Object.defineProperty(IO, 'FlatMap', {
  get(): FlatMap<IOF> {
    return ioFlatMap();
  },
});
Object.defineProperty(IO, 'Monad', {
  get(): Monad<IOF> {
    return ioMonad();
  },
});
Object.defineProperty(IO, 'MonadError', {
  get(): MonadError<IOF, Error> {
    return ioMonadError();
  },
});
Object.defineProperty(IO, 'MonadCancel', {
  get(): MonadCancel<IOF, Error> {
    return ioMonadCancel();
  },
});
Object.defineProperty(IO, 'Sync', {
  get(): Sync<IOF> {
    return ioSync();
  },
});
Object.defineProperty(IO, 'Spawn', {
  get(): Spawn<IOF, Error> {
    return ioSpawn();
  },
});
Object.defineProperty(IO, 'Parallel', {
  get(): Parallel<IOF, IOF> {
    return ioParallel();
  },
});
Object.defineProperty(IO, 'Concurrent', {
  get(): Concurrent<IOF, Error> {
    return ioConcurrent();
  },
});
Object.defineProperty(IO, 'Temporal', {
  get(): Temporal<IOF, Error> {
    return ioTemporal();
  },
});
Object.defineProperty(IO, 'Async', {
  get(): Async<IOF> {
    return ioAsync();
  },
});

// HKT

export interface IOF extends TyK<[unknown]> {
  [$type]: IO<TyVar<this, 0>>;
}
