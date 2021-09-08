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

import * as Ref from '../kernel/ref';
import * as D from '../kernel/deferred';
import { Poll } from '../kernel/poll';
import { MonadCancel } from '../kernel/monad-cancel';
import { Sync } from '../kernel/sync';
import { Spawn } from '../kernel/spawn';
import { Concurrent } from '../kernel/concurrent';
import { Temporal } from '../kernel/temporal';
import { Async } from '../kernel/async';

import { IO as IOBase, URI } from './algebra';
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
import { Kind } from '../../fp/hkt';

export { URI } from './algebra';

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

  ref: <A>(a: A) => IO<Ref.Ref<URI, A>>;

  deferred: <A>(a?: A) => IO<D.Deferred<URI, A>>;

  uncancelable: <A>(ioa: (p: Poll<URI>) => IO<A>) => IO<A>;

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
  ) => <A>(iots: Kind<T, IO<A>>) => IO<Kind<T, A>>;

  traverse: <T>(
    T: Traversable<T>,
  ) => <A, B>(f: (a: A) => IO<B>) => (ts: Kind<T, A>) => IO<Kind<T, B>>;

  traverse_: <T, A, B>(
    T: Traversable<T>,
    ts: Kind<T, A>,
    f: (a: A) => IO<B>,
  ) => IO<Kind<T, B>>;

  parSequence: <T>(
    T: Traversable<T>,
  ) => <A>(iots: Kind<T, IO<A>>) => IO<Kind<T, A>>;

  parTraverse: <T>(
    T: Traversable<T>,
  ) => <A, B>(f: (a: A) => IO<B>) => (ts: Kind<T, A>) => IO<Kind<T, B>>;
  parTraverse_: <T, A, B>(
    T: Traversable<T>,
    ts: Kind<T, A>,
    f: (a: A) => IO<B>,
  ) => IO<Kind<T, B>>;

  parSequenceN: <T>(
    T: Traversable<T>,
    maxConcurrent: number,
  ) => <A>(iots: Kind<T, IO<A>>) => IO<Kind<T, A>>;
  parSequenceN_: <T, A>(
    T: Traversable<T>,
    iots: Kind<T, IO<A>>,
    maxConcurrent: number,
  ) => IO<Kind<T, A>>;

  parTraverseN: <T>(
    T: Traversable<T>,
    maxConcurrent: number,
  ) => <A, B>(f: (a: A) => IO<B>) => (ts: Kind<T, A>) => IO<Kind<T, B>>;
  parTraverseN_: <T, A, B>(
    T: Traversable<T>,
    ts: Kind<T, A>,
    f: (a: A) => IO<B>,
    maxConcurrent: number,
  ) => IO<Kind<T, B>>;

  bracketFull: <A, B>(
    acquire: (poll: Poll<URI>) => IO<A>,
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

  readonly Defer: Defer<URI>;
  readonly Functor: Functor<URI>;
  readonly ParallelApply: Apply<URI>;
  readonly ParallelApplicative: Applicative<URI>;
  readonly SequentialApply: Apply<URI>;
  readonly SequentialApplicative: Applicative<URI>;
  readonly FlatMap: FlatMap<URI>;
  readonly Monad: Monad<URI>;
  readonly MonadError: MonadError<URI, Error>;
  readonly MonadCancel: MonadCancel<URI, Error>;
  readonly Sync: Sync<URI>;
  readonly Spawn: Spawn<URI, Error>;
  readonly Concurrent: Concurrent<URI, Error>;
  readonly Temporal: Temporal<URI, Error>;
  readonly Async: Async<URI>;
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
  get(): Defer<URI> {
    return ioDefer();
  },
});
Object.defineProperty(IO, 'Functor', {
  get(): Functor<URI> {
    return ioFunctor();
  },
});
Object.defineProperty(IO, 'ParallelApply', {
  get(): Apply<URI> {
    return ioParallelApply();
  },
});
Object.defineProperty(IO, 'ParallelApplicative', {
  get(): Applicative<URI> {
    return ioParallelApplicative();
  },
});
Object.defineProperty(IO, 'SequentialApply', {
  get(): Apply<URI> {
    return ioSequentialApply();
  },
});
Object.defineProperty(IO, 'SequentialApplicative', {
  get(): Applicative<URI> {
    return ioSequentialApplicative();
  },
});
Object.defineProperty(IO, 'FlatMap', {
  get(): FlatMap<URI> {
    return ioFlatMap();
  },
});
Object.defineProperty(IO, 'Monad', {
  get(): Monad<URI> {
    return ioMonad();
  },
});
Object.defineProperty(IO, 'MonadError', {
  get(): MonadError<URI, Error> {
    return ioMonadError();
  },
});
Object.defineProperty(IO, 'MonadCancel', {
  get(): MonadCancel<URI, Error> {
    return ioMonadCancel();
  },
});
Object.defineProperty(IO, 'Sync', {
  get(): Sync<URI> {
    return ioSync();
  },
});
Object.defineProperty(IO, 'Spawn', {
  get(): Spawn<URI, Error> {
    return ioSpawn();
  },
});
Object.defineProperty(IO, 'Concurrent', {
  get(): Concurrent<URI, Error> {
    return ioConcurrent();
  },
});
Object.defineProperty(IO, 'Temporal', {
  get(): Temporal<URI, Error> {
    return ioTemporal();
  },
});
Object.defineProperty(IO, 'Async', {
  get(): Async<URI> {
    return ioAsync();
  },
});