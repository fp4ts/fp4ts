import { id, pipe, Kind } from '@cats4ts/core';
import { Parallel, Traversable, Either } from '@cats4ts/cats';
import { ExecutionContext, Poll } from '@cats4ts/effect-kernel';

import { IOFiber } from '../io-fiber';
import { IOOutcome } from '../io-outcome';

import { IoK } from './io';
import {
  Attempt,
  ExecuteOn,
  FlatMap,
  Fork,
  HandleErrorWith,
  IO,
  Map,
  OnCancel,
  RacePair,
} from './algebra';
import {
  canceled,
  defer,
  never,
  pure,
  readExecutionContext,
  sleep,
  throwError,
  uncancelable,
  unit,
} from './constructors';
import { bind, bindTo, Do } from './do';
import {
  ioAsync,
  ioParallel,
  ioParallelApplicative,
  ioSequentialApplicative,
} from './instances';

export const fork: <A>(ioa: IO<A>) => IO<IOFiber<A>> = ioa => new Fork(ioa);

export const onCancel: (fin: IO<void>) => <A>(ioa: IO<A>) => IO<A> =
  fin => ioa =>
    onCancel_(ioa, fin);

export const delayBy: (ms: number) => <A>(ioa: IO<A>) => IO<A> = ms => ioa =>
  delayBy_(ioa, ms);

export const timeout: (ms: number) => <A>(ioa: IO<A>) => IO<A> = ms => ioa =>
  timeout_(ioa, ms);

export const timeoutTo: <B>(
  ms: number,
  fallback: IO<B>,
) => <A extends B>(ioa: IO<A>) => IO<B> = (ms, fallback) => ioa =>
  timeoutTo_(ioa, ms, fallback);

export const executeOn: (ec: ExecutionContext) => <A>(ioa: IO<A>) => IO<A> =
  ec => ioa =>
    executeOn_(ioa, ec);

export const race: <B>(iob: IO<B>) => <A>(ioa: IO<A>) => IO<Either<A, B>> =
  iob => ioa =>
    race_(ioa, iob);

export const racePair: <B>(
  iob: IO<B>,
) => <A>(
  ioa: IO<A>,
) => IO<Either<[IOOutcome<A>, IOFiber<B>], [IOFiber<A>, IOOutcome<B>]>> =
  iob => ioa =>
    racePair_(ioa, iob);

export const both: <B>(iob: IO<B>) => <A>(ioa: IO<A>) => IO<[A, B]> =
  iob => ioa =>
    both_(ioa, iob);

export const finalize: <A>(
  finalizer: (oc: IOOutcome<A>) => IO<void>,
) => (ioa: IO<A>) => IO<A> = finalizer => ioa => finalize_(ioa, finalizer);

export const bracket: <A, B>(
  use: (a: A) => IO<B>,
) => (release: (a: A) => IO<void>) => (ioa: IO<A>) => IO<B> =
  use => release => ioa =>
    bracket_(ioa, use, release);

export const bracketOutcome: <A, B>(
  use: (a: A) => IO<B>,
) => (release: (a: A, oc: IOOutcome<B>) => IO<void>) => (ioa: IO<A>) => IO<B> =
  use => release => ioa =>
    bracketOutcome_(ioa, use, release);

export const bracketFull = <A, B>(
  acquire: (poll: Poll<IoK>) => IO<A>,
  use: (a: A) => IO<B>,
  release: (a: A, oc: IOOutcome<B>) => IO<void>,
): IO<B> =>
  uncancelable(poll =>
    pipe(
      acquire(poll),
      flatMap(a =>
        pipe(
          defer(() => poll(use(a))),
          finalize(oc => release(a, oc)),
        ),
      ),
    ),
  );

export const map: <A, B>(f: (a: A) => B) => (ioa: IO<A>) => IO<B> = f => ioa =>
  map_(ioa, f);

export const tap: <A>(f: (a: A) => unknown) => (ioa: IO<A>) => IO<A> =
  f => ioa =>
    tap_(ioa, f);

export const flatMap: <A, B>(f: (a: A) => IO<B>) => (ioa: IO<A>) => IO<B> =
  f => ioa =>
    flatMap_(ioa, f);

export const flatTap: <A>(f: (a: A) => IO<unknown>) => (ioa: IO<A>) => IO<A> =
  f => ioa =>
    flatTap_(ioa, f);

export const tailRecM: <A>(
  a: A,
) => <B>(f: (a: A) => IO<Either<A, B>>) => IO<B> = a => f => tailRecM_(a, f);

export const flatten: <A>(ioioa: IO<IO<A>>) => IO<A> = flatMap(id);

export const handleError: <B>(
  f: (e: Error) => B,
) => <A extends B>(ioa: IO<A>) => IO<B> = f => ioa => handleError_(ioa, f);

export const handleErrorWith: <B>(
  f: (e: Error) => IO<B>,
) => <A extends B>(ioa: IO<A>) => IO<B> = f => ioa => handleErrorWith_(ioa, f);

export const onError: (f: (e: Error) => IO<void>) => <A>(ioa: IO<A>) => IO<A> =
  f => ioa =>
    onError_(ioa, f);

export const attempt: <A>(ioa: IO<A>) => IO<Either<Error, A>> = ioa =>
  new Attempt(ioa);

export const redeem: <A, B>(
  onFailure: (e: Error) => B,
  onSuccess: (a: A) => B,
) => (ioa: IO<A>) => IO<B> = (onFailure, onSuccess) => ioa =>
  redeem_(ioa, onFailure, onSuccess);

export const redeemWith: <A, B>(
  onFailure: (e: Error) => IO<B>,
  onSuccess: (a: A) => IO<B>,
) => (ioa: IO<A>) => IO<B> = (onFailure, onSuccess) => ioa =>
  redeemWith_(ioa, onFailure, onSuccess);

export const traverse: <T>(
  T: Traversable<T>,
) => <A, B>(f: (a: A) => IO<B>) => (ts: Kind<T, [A]>) => IO<Kind<T, [B]>> =
  T => f => ts =>
    traverse_(T, ts, f);

export const sequence =
  <T>(T: Traversable<T>) =>
  <A>(ioas: Kind<T, [IO<A>]>): IO<Kind<T, [A]>> =>
    traverse_(T, ioas, id);

export const parTraverse: <T>(
  T: Traversable<T>,
) => <A, B>(f: (a: A) => IO<B>) => (ts: Kind<T, [A]>) => IO<Kind<T, [B]>> =
  T => f => ts =>
    parTraverse_(T)(ts, f);

export const parSequenceN: <T>(
  T: Traversable<T>,
) => (maxConcurrent: number) => <A>(iot: Kind<T, [IO<A>]>) => IO<Kind<T, [A]>> =
  T => maxConcurrent => iot => parSequenceN_(T)(iot, maxConcurrent);

export const parTraverseN: <T>(
  T: Traversable<T>,
) => <A, B>(
  maxConcurrent: number,
  f: (a: A) => IO<B>,
) => (as: Kind<T, [A]>) => IO<Kind<T, [B]>> = T => (maxConcurrent, f) => as =>
  parTraverseN_(T)(as, maxConcurrent)(f);

export const parSequence =
  <T>(T: Traversable<T>) =>
  <A>(iot: Kind<T, [IO<A>]>): IO<Kind<T, [A]>> =>
    Parallel.parSequence(T, ioParallel())(iot);

// -- Point-ful operators

export const onCancel_: <A>(ioa: IO<A>, fin: IO<void>) => IO<A> = (ioa, fin) =>
  new OnCancel(ioa, fin);

export const delayBy_ = <A>(thunk: IO<A>, ms: number): IO<A> =>
  pipe(
    sleep(ms),
    flatMap(() => thunk),
  );

export const timeout_ = <A>(ioa: IO<A>, ms: number): IO<A> =>
  timeoutTo_(ioa, ms, throwError(new Error('Timeout exceeded')));

export const timeoutTo_ = <A>(ioa: IO<A>, ms: number, fallback: IO<A>): IO<A> =>
  pipe(
    race_(sleep(ms), ioa),
    flatMap(ea => ea.fold(() => fallback, pure)),
  );

export const executeOn_ = <A>(ioa: IO<A>, ec: ExecutionContext): IO<A> =>
  new ExecuteOn(ioa, ec);

export const race_ = <A, B>(ioa: IO<A>, iob: IO<B>): IO<Either<A, B>> =>
  ioAsync().race_(ioa, iob);

export const raceOutcome_ = <A, B>(
  ioa: IO<A>,
  iob: IO<B>,
): IO<Either<IOOutcome<A>, IOOutcome<B>>> => ioAsync().raceOutcome_(ioa, iob);

export const racePair_ = <A, B>(
  ioa: IO<A>,
  iob: IO<B>,
): IO<Either<[IOOutcome<A>, IOFiber<B>], [IOFiber<A>, IOOutcome<B>]>> =>
  new RacePair(ioa, iob);

export const both_ = <A, B>(ioa: IO<A>, iob: IO<B>): IO<[A, B]> =>
  ioAsync().both_(ioa, iob);

export const bothOutcome_ = <A, B>(
  ioa: IO<A>,
  iob: IO<B>,
): IO<[IOOutcome<A>, IOOutcome<B>]> => ioAsync().bothOutcome_(ioa, iob);

export const finalize_ = <A>(
  ioa: IO<A>,
  finalizer: (oc: IOOutcome<A>) => IO<void>,
): IO<A> =>
  uncancelable(poll =>
    pipe(
      poll(ioa),
      onCancel(finalizer(IOOutcome.canceled())),
      onError(e =>
        pipe(
          finalizer(IOOutcome.failure(e)),
          handleErrorWith(e2 =>
            flatMap_(readExecutionContext, ec => pure(ec.reportFailure(e2))),
          ),
        ),
      ),
      flatTap(a => finalizer(IOOutcome.success(pure(a)))),
    ),
  );

export const bracket_ = <A, B>(
  ioa: IO<A>,
  use: (a: A) => IO<B>,
  release: (a: A) => IO<void>,
): IO<B> => bracketOutcome_(ioa, use, x => release(x));

export const bracketOutcome_ = <A, B>(
  ioa: IO<A>,
  use: (a: A) => IO<B>,
  release: (a: A, oc: IOOutcome<B>) => IO<void>,
): IO<B> => bracketFull(() => ioa, use, release);

export const map_: <A, B>(ioa: IO<A>, f: (a: A) => B) => IO<B> = (ioa, f) =>
  new Map(ioa, f);

export const tap_: <A>(ioa: IO<A>, f: (a: A) => unknown) => IO<A> = (ioa, f) =>
  map_(ioa, x => {
    f(x);
    return x;
  });

export const flatMap_: <A, B>(ioa: IO<A>, f: (a: A) => IO<B>) => IO<B> = (
  ioa,
  f,
) => new FlatMap(ioa, f);

export const flatTap_: <A>(ioa: IO<A>, f: (a: A) => IO<unknown>) => IO<A> = (
  ioa,
  f,
) => flatMap_(ioa, x => map_(f(x), () => x));

export const tailRecM_ = <A, B>(a: A, f: (a: A) => IO<Either<A, B>>): IO<B> =>
  flatMap_(f(a), ab =>
    ab.fold(
      a => tailRecM_(a, f),
      b => pure(b),
    ),
  );

export const handleError_: <A>(ioa: IO<A>, f: (e: Error) => A) => IO<A> = (
  ioa,
  f,
) => handleErrorWith_(ioa, e => pure(f(e)));

export const handleErrorWith_: <A>(
  ioa: IO<A>,
  f: (e: Error) => IO<A>,
) => IO<A> = (ioa, f) => new HandleErrorWith(ioa, f);

export const onError_ = <A>(ioa: IO<A>, f: (e: Error) => IO<void>): IO<A> =>
  handleErrorWith_(ioa, e => flatMap_(f(e), () => throwError(e)));

export const redeem_ = <A, B>(
  ioa: IO<A>,
  onFailure: (e: Error) => B,
  onSuccess: (a: A) => B,
): IO<B> =>
  pipe(
    ioa,
    attempt,
    map(ea => ea.fold(onFailure, onSuccess)),
  );

export const redeemWith_ = <A, B>(
  ioa: IO<A>,
  onFailure: (e: Error) => IO<B>,
  onSuccess: (a: A) => IO<B>,
): IO<B> =>
  pipe(
    ioa,
    attempt,
    flatMap(ea => ea.fold(onFailure, onSuccess)),
  );

export const traverse_ = <T, A, B>(
  T: Traversable<T>,
  ts: Kind<T, [A]>,
  f: (a: A) => IO<B>,
): IO<Kind<T, [B]>> =>
  defer(() => T.traverse(ioSequentialApplicative())(f)(ts));

export const parSequenceN_: <T>(
  T: Traversable<T>,
) => <A>(tioa: Kind<T, [IO<A>]>, maxConcurrent: number) => IO<Kind<T, [A]>> =
  T => (tioa, maxConcurrent) =>
    ioAsync().parSequenceN_(T)(tioa, maxConcurrent);

export const map2_ = <A, B, C>(
  ioa: IO<A>,
  iob: IO<B>,
  f: (a: A, b: B) => C,
): IO<C> => ioParallel().applicative.map2_(ioa, iob)(f);

export const parTraverse_ =
  <T>(T: Traversable<T>) =>
  <A, B>(ta: Kind<T, [A]>, f: (a: A) => IO<B>): IO<Kind<T, [B]>> =>
    Parallel.parTraverse_(T, ioParallel())(ta, f);

export const parTraverseN_ =
  <T>(T: Traversable<T>) =>
  <A>(ta: Kind<T, [A]>, maxConcurrent: number) =>
  <B>(f: (a: A) => IO<B>): IO<Kind<T, [B]>> =>
    ioAsync().parTraverseN_(T)(ta, maxConcurrent)(f);
