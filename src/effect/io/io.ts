import { URI, Kind, URIS } from '../../core';
import {
  Applicative,
  Apply,
  Defer,
  FlatMap,
  Functor,
  Monad,
  MonadError,
  Traversable,
} from '../../cats';
import { Either, Option } from '../../cats/data';
import { ExecutionContext } from '../execution-context';
import { IOOutcome } from '../io-outcome';

import {
  Poll,
  MonadCancel,
  Sync,
  Spawn,
  Concurrent,
  Temporal,
  Async,
} from '../kernel';
import * as Ref from '../kernel/ref';
import * as D from '../kernel/deferred';

import { IO as IOBase } from './algebra';
import {
  async,
  async_,
  canceled,
  currentTimeMillis,
  defer,
  deferPromise,
  delay,
  fromPromise,
  never,
  pure,
  readExecutionContext,
  sleep,
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
  traverse,
  traverse_,
} from './operators';
import { bind, bindTo, Do } from './do';
import {
  ioAsync,
  ioConcurrent,
  ioDefer,
  ioFlatMap,
  ioFunctor,
  ioMonad,
  ioMonadCancel,
  ioMonadError,
  ioParallelApplicative,
  ioParallelApply,
  ioSequentialApplicative,
  ioSequentialApply,
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

  delay: <A>(thunk: () => A) => IO<A>;

  defer: <A>(thunk: () => IO<A>) => IO<A>;

  deferPromise: <A>(thunk: () => Promise<A>) => IO<A>;

  fromPromise: <A>(iop: IO<Promise<A>>) => IO<A>;

  throwError: (e: Error) => IO<never>;

  currentTimeMillis: IO<number>;

  readExecutionContext: IO<ExecutionContext>;

  async: <A>(
    k: (cb: (ea: Either<Error, A>) => void) => IO<Option<IO<void>>>,
  ) => IO<A>;

  async_: <A>(k: (cb: (ea: Either<Error, A>) => void) => IO<void>) => IO<A>;

  unit: IO<void>;

  never: IO<never>;

  canceled: IO<void>;

  ref: <A>(a: A) => IO<Ref.Ref<[URI<IoURI>], A>>;

  deferred: <A>(a?: A) => IO<D.Deferred<[URI<IoURI>], A>>;

  uncancelable: <A>(ioa: (p: Poll<[URI<IoURI>]>) => IO<A>) => IO<A>;

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

  sequence: <T extends URIS, C2>(
    T: Traversable<T, C2>,
  ) => <S2, R2, E2, A>(
    iots: Kind<T, C2, S2, R2, E2, IO<A>>,
  ) => IO<Kind<T, C2, S2, R2, E2, A>>;

  traverse: <T extends URIS, C2>(
    T: Traversable<T, C2>,
  ) => <A, B>(
    f: (a: A) => IO<B>,
  ) => <S2, R2, E2>(
    ts: Kind<T, C2, S2, R2, E2, A>,
  ) => IO<Kind<T, C2, S2, R2, E2, B>>;

  traverse_: <T extends URIS, C2, S2, R2, E2, A, B>(
    T: Traversable<T, C2>,
    ts: Kind<T, C2, S2, R2, E2, A>,
    f: (a: A) => IO<B>,
  ) => IO<Kind<T, C2, S2, R2, E2, B>>;

  parSequence: <T extends URIS, C2>(
    T: Traversable<T, C2>,
  ) => <C2, S2, R2, E2, A>(
    iots: Kind<T, C2, S2, R2, E2, IO<A>>,
  ) => IO<Kind<T, C2, S2, R2, E2, A>>;

  parTraverse: <T extends URIS, C2>(
    T: Traversable<T, C2>,
  ) => <A, B>(
    f: (a: A) => IO<B>,
  ) => <C2, S2, R2, E2>(
    ts: Kind<T, C2, S2, R2, E2, A>,
  ) => IO<Kind<T, C2, S2, R2, E2, B>>;
  parTraverse_: <T extends URIS, C2, S2, R2, E2, A, B>(
    T: Traversable<T, C2>,
    ts: Kind<T, C2, S2, R2, E2, A>,
    f: (a: A) => IO<B>,
  ) => IO<Kind<T, C2, S2, R2, E2, B>>;

  parSequenceN: <T extends URIS, C2>(
    T: Traversable<T, C2>,
    maxConcurrent: number,
  ) => <C2, S2, R2, E2, A>(
    iots: Kind<T, C2, S2, R2, E2, IO<A>>,
  ) => IO<Kind<T, C2, S2, R2, E2, A>>;
  parSequenceN_: <T extends URIS, C2, S2, R2, E2, A>(
    T: Traversable<T, C2>,
    iots: Kind<T, C2, S2, R2, E2, IO<A>>,
    maxConcurrent: number,
  ) => IO<Kind<T, C2, S2, R2, E2, A>>;

  parTraverseN: <T extends URIS, C2>(
    T: Traversable<T, C2>,
    maxConcurrent: number,
  ) => <A, B>(
    f: (a: A) => IO<B>,
  ) => <C2, S2, R2, E2>(
    ts: Kind<T, C2, S2, R2, E2, A>,
  ) => IO<Kind<T, C2, S2, R2, E2, B>>;
  parTraverseN_: <T extends URIS, C2, S2, R2, E2, A, B>(
    T: Traversable<T, C2>,
    ts: Kind<T, C2, S2, R2, E2, A>,
    f: (a: A) => IO<B>,
    maxConcurrent: number,
  ) => IO<Kind<T, C2, S2, R2, E2, B>>;

  bracketFull: <A, B>(
    acquire: (poll: Poll<[URI<IoURI>]>) => IO<A>,
    use: (a: A) => IO<B>,
    release: (a: A, oc: IOOutcome<B>) => IO<void>,
  ) => IO<B>;

  // Do notation

  // eslint-disable-next-line @typescript-eslint/ban-types
  Do: IO<{}>;

  // eslint-disable-next-line @typescript-eslint/ban-types
  bindTo: <N extends string, S extends {}, B>(
    name: N,
    iob: IO<B> | ((s: S) => IO<B>),
  ) => (
    ios: IO<S>,
  ) => IO<{ readonly [K in keyof S | N]: K extends keyof S ? S[K] : B }>;

  // eslint-disable-next-line @typescript-eslint/ban-types
  bind: <S extends {}, B>(
    iob: IO<B> | ((s: S) => IO<B>),
  ) => (ios: IO<S>) => IO<S>;

  // -- Instances

  readonly Defer: Defer<[URI<IoURI>]>;
  readonly Functor: Functor<[URI<IoURI>]>;
  readonly ParallelApply: Apply<[URI<IoURI>]>;
  readonly ParallelApplicative: Applicative<[URI<IoURI>]>;
  readonly SequentialApply: Apply<[URI<IoURI>]>;
  readonly SequentialApplicative: Applicative<[URI<IoURI>]>;
  readonly FlatMap: FlatMap<[URI<IoURI>]>;
  readonly Monad: Monad<[URI<IoURI>]>;
  readonly MonadError: MonadError<[URI<IoURI>], Error>;
  readonly MonadCancel: MonadCancel<[URI<IoURI>], Error>;
  readonly Sync: Sync<[URI<IoURI>]>;
  readonly Spawn: Spawn<[URI<IoURI>], Error>;
  readonly Concurrent: Concurrent<[URI<IoURI>], Error>;
  readonly Temporal: Temporal<[URI<IoURI>], Error>;
  readonly Async: Async<[URI<IoURI>]>;
}

IO.pure = pure;

IO.delay = delay;

IO.defer = defer;

IO.deferPromise = deferPromise;

IO.fromPromise = fromPromise;

IO.throwError = throwError;

IO.currentTimeMillis = currentTimeMillis;

IO.readExecutionContext = readExecutionContext;

IO.async = async;

IO.async_ = async_;

IO.unit = unit;

IO.never = never;

IO.canceled = canceled;

IO.ref = x => Ref.of(IO.Sync)(x);

IO.deferred = x => D.of(IO.Async)(x);

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

IO.Do = Do;
IO.bindTo = bindTo;
IO.bind = bind;

Object.defineProperty(IO, 'Defer', {
  get(): Defer<[URI<IoURI>]> {
    return ioDefer();
  },
});
Object.defineProperty(IO, 'Functor', {
  get(): Functor<[URI<IoURI>]> {
    return ioFunctor();
  },
});
Object.defineProperty(IO, 'ParallelApply', {
  get(): Apply<[URI<IoURI>]> {
    return ioParallelApply();
  },
});
Object.defineProperty(IO, 'ParallelApplicative', {
  get(): Applicative<[URI<IoURI>]> {
    return ioParallelApplicative();
  },
});
Object.defineProperty(IO, 'SequentialApply', {
  get(): Apply<[URI<IoURI>]> {
    return ioSequentialApply();
  },
});
Object.defineProperty(IO, 'SequentialApplicative', {
  get(): Applicative<[URI<IoURI>]> {
    return ioSequentialApplicative();
  },
});
Object.defineProperty(IO, 'FlatMap', {
  get(): FlatMap<[URI<IoURI>]> {
    return ioFlatMap();
  },
});
Object.defineProperty(IO, 'Monad', {
  get(): Monad<[URI<IoURI>]> {
    return ioMonad();
  },
});
Object.defineProperty(IO, 'MonadError', {
  get(): MonadError<[URI<IoURI>], Error> {
    return ioMonadError();
  },
});
Object.defineProperty(IO, 'MonadCancel', {
  get(): MonadCancel<[URI<IoURI>], Error> {
    return ioMonadCancel();
  },
});
Object.defineProperty(IO, 'Sync', {
  get(): Sync<[URI<IoURI>]> {
    return ioSync();
  },
});
Object.defineProperty(IO, 'Spawn', {
  get(): Spawn<[URI<IoURI>], Error> {
    return ioSpawn();
  },
});
Object.defineProperty(IO, 'Concurrent', {
  get(): Concurrent<[URI<IoURI>], Error> {
    return ioConcurrent();
  },
});
Object.defineProperty(IO, 'Temporal', {
  get(): Temporal<[URI<IoURI>], Error> {
    return ioTemporal();
  },
});
Object.defineProperty(IO, 'Async', {
  get(): Async<[URI<IoURI>]> {
    return ioAsync();
  },
});

// HKT

export const IoURI = 'effect-io/io';
export type IoURI = typeof IoURI;

declare module '../../core' {
  interface URItoKind<FC, TC, S, R, E, A> {
    [IoURI]: IO<A>;
  }
}
