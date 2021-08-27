import { Either } from '../../fp/either';
import { ExecutionContext } from '../execution-context';
import { IOOutcome } from '../io-outcome';

import * as Ref from '../kernel/ref';
import * as D from '../kernel/deferred';
import { Poll } from '../kernel/poll';

import { IO as IOBase, URI } from './algebra';
import {
  async,
  canceled,
  currentTimeMillis,
  defer,
  deferPromise,
  delay,
  never,
  pure,
  readExecutionContext,
  sleep,
  throwError,
  uncancelable,
  unit,
} from './constructors';
import {
  both_,
  bracketFull,
  parSequence,
  parSequenceN,
  parSequenceN_,
  parTraverse,
  parTraverseN,
  parTraverseN_,
  parTraverse_,
  race_,
  sequence,
  traverse,
  traverse_,
} from './operators';
import { bind, bindTo, Do } from './do';
import { ioSync } from './instances';

export { URI } from './algebra';

export type IO<A> = IOBase<A>;

export const IO: IOObj = function <A>(thunk: () => A): IO<A> {
  return delay(thunk);
};

interface IOObj {
  <A>(thunk: () => A): IO<A>;

  pure: <A>(a: A) => IO<A>;

  delay: <A>(thunk: () => A) => IO<A>;

  defer: <A>(thunk: () => IO<A>) => IO<A>;

  deferPromise: <A>(thunk: () => Promise<A>) => IO<A>;

  throwError: (e: Error) => IO<never>;

  currentTimeMillis: IO<number>;

  readExecutionContext: IO<ExecutionContext>;

  async: <A>(
    k: (cb: (ea: Either<Error, A>) => void) => IO<IO<void> | undefined | void>,
  ) => IO<A>;

  unit: IO<void>;

  never: IO<never>;

  canceled: IO<void>;

  ref: <A>(a: A) => IO<Ref.Ref<URI, A>>;

  deferred: <A>(a?: A) => IO<D.Deferred<A>>;

  uncancelable: <A>(ioa: (p: Poll<URI>) => IO<A>) => IO<A>;

  sleep: (ms: number) => IO<void>;

  race: <A, B>(ioa: IO<A>, iob: IO<B>) => IO<Either<A, B>>;

  both: <A, B>(ioa: IO<A>, iob: IO<B>) => IO<[A, B]>;

  sequence: <A>(ioas: IO<A>[]) => IO<A[]>;

  traverse: <A, B>(f: (a: A) => IO<B>) => (as: A[]) => IO<B[]>;
  traverse_: <A, B>(as: A[], f: (a: A) => IO<B>) => IO<B[]>;

  parSequence: <A>(ioas: IO<A>[]) => IO<A[]>;

  parTraverse: <A, B>(f: (a: A) => IO<B>) => (as: A[]) => IO<B[]>;
  parTraverse_: <A, B>(as: A[], f: (a: A) => IO<B>) => IO<B[]>;

  parSequenceN: (maxConcurrent: number) => <A>(ioas: IO<A>[]) => IO<A[]>;
  parSequenceN_: <A>(ioas: IO<A>[], maxConcurrent: number) => IO<A[]>;

  parTraverseN: <A, B>(
    f: (a: A) => IO<B>,
    maxConcurrent: number,
  ) => (as: A[]) => IO<B[]>;
  parTraverseN_: <A, B>(
    as: A[],
    f: (a: A) => IO<B>,
    maxConcurrent: number,
  ) => IO<B[]>;

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
}

IO.pure = pure;

IO.delay = delay;

IO.defer = defer;

IO.deferPromise = deferPromise;

IO.throwError = throwError;

IO.currentTimeMillis = currentTimeMillis;

IO.readExecutionContext = readExecutionContext;

IO.async = async;

IO.unit = unit;

IO.never = never;

IO.canceled = canceled;

IO.ref = x => Ref.of(ioSync)(x);

IO.deferred = x => D.of(x);

IO.uncancelable = uncancelable;

IO.sleep = sleep;

IO.race = race_;

IO.both = both_;

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
