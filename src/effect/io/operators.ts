import { flow, id, pipe } from '../../fp/core';
import * as E from '../../fp/either';
import { Traversable } from '../../cats';

import { IOFiber } from '../io-fiber';
import { IOOutcome } from '../io-outcome';
import { ExecutionContext } from '../execution-context';

import * as O from '../kernel/outcome';
import * as Sem from '../kernel/semaphore';
import { Poll } from '../kernel/poll';

import {
  URI,
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
  ioParallelApplicative,
  ioSequentialApplicative,
} from './instances';
import { Kind } from '../../fp/hkt';

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

export const race: <B>(iob: IO<B>) => <A>(ioa: IO<A>) => IO<E.Either<A, B>> =
  iob => ioa =>
    race_(ioa, iob);

export const racePair: <B>(
  iob: IO<B>,
) => <A>(
  ioa: IO<A>,
) => IO<E.Either<[IOOutcome<A>, IOFiber<B>], [IOFiber<A>, IOOutcome<B>]>> =
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
  acquire: (poll: Poll<URI>) => IO<A>,
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

export const attempt: <A>(ioa: IO<A>) => IO<E.Either<Error, A>> = ioa =>
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
) => <A, B>(f: (a: A) => IO<B>) => (ts: Kind<T, A>) => IO<Kind<T, B>> =
  T => f => ts =>
    traverse_(T, ts, f);

export const sequence =
  <T>(T: Traversable<T>) =>
  <A>(ioas: Kind<T, IO<A>>): IO<Kind<T, A>> =>
    traverse_(T, ioas, id);

export const parTraverse: <T>(
  T: Traversable<T>,
) => <A, B>(f: (a: A) => IO<B>) => (ts: Kind<T, A>) => IO<Kind<T, B>> =
  T => f => ts =>
    parTraverse_(T, ts, f);

export const parSequenceN: <T>(
  T: Traversable<T>,
  maxConcurrent: number,
) => <A>(iot: Kind<T, IO<A>>) => IO<Kind<T, A>> = (T, maxConcurrent) => iot =>
  parSequenceN_(T, iot, maxConcurrent);

export const parTraverseN: <T>(
  T: Traversable<T>,
  maxConcurrent: number,
) => <A, B>(f: (a: A) => IO<B>) => (as: Kind<T, A>) => IO<Kind<T, B>> =
  (T, ms) => f => as =>
    parTraverseN_(T, as, f, ms);

export const parSequence =
  <T>(T: Traversable<T>) =>
  <A>(iot: Kind<T, IO<A>>): IO<Kind<T, A>> =>
    parTraverse_(T, iot, id);

export const parTraverseOutcome: <T>(
  T: Traversable<T>,
) => <A, B>(
  f: (a: A) => IO<B>,
) => (ts: Kind<T, A>) => IO<Kind<T, IOOutcome<B>>> = T => f => as =>
  parTraverseOutcome_(T, as, f);

export const parSequenceOutcome =
  <T>(T: Traversable<T>) =>
  <A>(iot: Kind<T, IO<A>>): IO<Kind<T, IOOutcome<A>>> =>
    parTraverseOutcome_(T, iot, id);

export const parTraverseOutcomeN: <T>(
  T: Traversable<T>,
  maxConcurrent: number,
) => <A, B>(
  f: (a: A) => IO<B>,
) => (ts: Kind<T, A>) => IO<Kind<T, IOOutcome<B>>> =
  (T, maxConcurrent) => f => as =>
    parTraverseOutcomeN_(T, as, f, maxConcurrent);

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
  pipe(race_(sleep(ms), ioa), flatMap(E.fold(() => fallback, pure)));

export const executeOn_ = <A>(ioa: IO<A>, ec: ExecutionContext): IO<A> =>
  new ExecuteOn(ioa, ec);

export const race_ = <A, B>(ioa: IO<A>, iob: IO<B>): IO<E.Either<A, B>> => {
  const cont = <X, Y>(
    poll: Poll<URI>,
    oc: IOOutcome<X>,
    f: IOFiber<Y>,
  ): IO<E.Either<X, Y>> =>
    O.fold_<URI, Error, X, IO<E.Either<X, Y>>>(
      oc,
      () =>
        pipe(
          poll(f.join),
          onCancel(f.cancel),
          flatMap(
            O.fold(
              () => flatMap_(poll(canceled), () => never),
              ey => throwError(ey),
              fy => map_(fy, E.right),
            ),
          ),
        ),
      ex => flatMap_(f.cancel, () => throwError(ex)),
      fx =>
        pipe(
          f.cancel,
          flatMap(() => f.join),
          flatMap(
            O.fold(
              () => map_(fx, E.left),
              ey => throwError(ey),
              () => map_(fx, E.left),
            ),
          ),
        ),
    );

  return uncancelable(poll =>
    pipe(
      poll(racePair_(ioa, iob)),
      flatMap(
        E.fold(
          ([oc, f]: [IOOutcome<A>, IOFiber<B>]) => cont(poll, oc, f),
          ([f, oc]: [IOFiber<A>, IOOutcome<B>]) =>
            pipe(cont(poll, oc, f), map(E.swapped)),
        ),
      ),
    ),
  );
};

export const raceOutcome_ = <A, B>(
  ioa: IO<A>,
  iob: IO<B>,
): IO<E.Either<IOOutcome<A>, IOOutcome<B>>> =>
  uncancelable(() =>
    pipe(
      racePair_(ioa, iob),
      flatMap(
        E.fold(
          ([oc, f]: [IOOutcome<A>, IOFiber<B>]) =>
            pipe(
              f.cancel,
              map(() => E.left(oc) as E.Either<IOOutcome<A>, IOOutcome<B>>),
            ),
          ([f, oc]: [IOFiber<A>, IOOutcome<B>]) =>
            pipe(
              f.cancel,
              map(() => E.right(oc)),
            ),
        ),
      ),
    ),
  );

export const racePair_ = <A, B>(
  ioa: IO<A>,
  iob: IO<B>,
): IO<E.Either<[IOOutcome<A>, IOFiber<B>], [IOFiber<A>, IOOutcome<B>]>> =>
  new RacePair(ioa, iob);

export const both_ = <A, B>(ioa: IO<A>, iob: IO<B>): IO<[A, B]> => {
  const cont = <X, Y>(
    poll: Poll<URI>,
    oc: IOOutcome<X>,
    f: IOFiber<Y>,
  ): IO<[X, Y]> =>
    O.fold_(
      oc,
      () =>
        pipe(
          f.cancel,
          flatMap(() => poll(canceled)),
          flatMap(() => never),
        ),
      ex => flatMap_(f.cancel, () => throwError(ex)),
      fx =>
        pipe(
          poll(f.join),
          onCancel(f.cancel),
          flatMap(
            O.fold(
              () => flatMap_(poll(canceled), () => never),
              ey => throwError(ey),
              fy => flatMap_(fx, x => map_(fy, y => [x, y])),
            ),
          ),
        ),
    );

  return uncancelable(poll =>
    pipe(
      poll(racePair_(ioa, iob)),
      flatMap(
        E.fold(
          ([oc, f]: [IOOutcome<A>, IOFiber<B>]) => cont(poll, oc, f),
          ([f, oc]: [IOFiber<A>, IOOutcome<B>]) =>
            pipe(
              cont(poll, oc, f),
              map(([b, a]) => [a, b]),
            ),
        ),
      ),
    ),
  );
};

export const bothOutcome_ = <A, B>(
  ioa: IO<A>,
  iob: IO<B>,
): IO<[IOOutcome<A>, IOOutcome<B>]> =>
  uncancelable(poll =>
    pipe(
      poll(racePair_(ioa, iob)),
      flatMap(
        E.fold(
          ([oc, f]: [IOOutcome<A>, IOFiber<B>]) =>
            pipe(
              poll(f.join),
              onCancel(f.cancel),
              map(oc2 => [oc, oc2]),
            ),
          ([f, oc]: [IOFiber<A>, IOOutcome<B>]) =>
            pipe(
              poll(f.join),
              onCancel(f.cancel),
              map(oc2 => [oc2, oc]),
            ),
        ),
      ),
    ),
  );

export const finalize_ = <A>(
  ioa: IO<A>,
  finalizer: (oc: IOOutcome<A>) => IO<void>,
): IO<A> =>
  uncancelable(poll =>
    pipe(
      poll(ioa),
      onCancel(finalizer(O.canceled)),
      onError(e =>
        pipe(
          finalizer(O.failure(e)),
          handleErrorWith(e2 =>
            flatMap_(readExecutionContext, ec => pure(ec.reportFailure(e2))),
          ),
        ),
      ),
      flatTap(a => finalizer(O.success(pure(a)))),
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

export const handleError_: <A>(ioa: IO<A>, f: (e: Error) => A) => IO<A> = (
  ioa,
  f,
) => handleErrorWith_(ioa, e => pure(f(e)));

export const handleErrorWith_: <A>(
  ioa: IO<A>,
  f: (e: Error) => IO<A>,
) => IO<A> = (ioa, f) => new HandleErrorWith(ioa, f);

export const onError_ = <A>(ioa: IO<A>, f: (e: Error) => IO<void>): IO<A> =>
  handleErrorWith_(ioa, e =>
    pipe(
      f(e),
      attempt,
      flatMap(() => throwError(e)),
    ),
  );

export const redeem_ = <A, B>(
  ioa: IO<A>,
  onFailure: (e: Error) => B,
  onSuccess: (a: A) => B,
): IO<B> => pipe(ioa, attempt, map(E.fold(onFailure, onSuccess)));

export const redeemWith_ = <A, B>(
  ioa: IO<A>,
  onFailure: (e: Error) => IO<B>,
  onSuccess: (a: A) => IO<B>,
): IO<B> => pipe(ioa, attempt, flatMap(E.fold(onFailure, onSuccess)));

export const traverse_ = <T, A, B>(
  T: Traversable<T>,
  ts: Kind<T, A>,
  f: (a: A) => IO<B>,
): IO<Kind<T, B>> => defer(() => T.traverse(ioSequentialApplicative())(f)(ts));

export const parSequenceN_: <T, A>(
  T: Traversable<T>,
  ioas: Kind<T, IO<A>>,
  maxConcurrent: number,
) => IO<Kind<T, A>> = (T, ioas, maxConcurrent) =>
  parTraverseN_(T, ioas, id, maxConcurrent);

export const map2_ = <A, B, C>(
  ioa: IO<A>,
  iob: IO<B>,
  f: (a: A, b: B) => C,
): IO<C> =>
  uncancelable(poll =>
    pipe(
      Do,
      bindTo('fiberA', fork(ioa)),
      bindTo('fiberB', fork(iob)),

      bind(({ fiberA, fiberB }) =>
        pipe(
          fiberB.join,
          flatMap(
            O.fold(
              () => fiberA.cancel,
              () => fiberA.cancel,
              () => unit,
            ),
          ),
          fork,
        ),
      ),
      bind(({ fiberA, fiberB }) =>
        pipe(
          fiberA.join,
          flatMap(
            O.fold(
              () => fiberB.cancel,
              () => fiberB.cancel,
              () => unit,
            ),
          ),
          fork,
        ),
      ),

      bindTo('a', ({ fiberA, fiberB }) =>
        pipe(
          poll(fiberA.join),
          onCancel(fiberA.cancel),
          onCancel(fiberB.cancel),
          flatMap(
            O.fold(
              () =>
                flatMap_(fiberB.cancel, () =>
                  pipe(
                    fiberB.join,
                    flatMap(
                      O.fold(
                        () => flatMap_(canceled, () => never),
                        e => throwError(e),
                        () => flatMap_(canceled, () => never),
                      ),
                    ),
                    poll,
                  ),
                ),
              e => flatMap_(fiberB.cancel, () => throwError(e)),
              a => a,
            ),
          ),
        ),
      ),

      bindTo('b', ({ fiberA, fiberB }) =>
        pipe(
          poll(fiberB.join),
          onCancel(fiberB.cancel),
          flatMap(
            O.fold(
              () =>
                pipe(
                  fiberA.join,
                  flatMap(
                    O.fold(
                      () => flatMap_(canceled, () => never),
                      e => throwError(e),
                      () => flatMap_(canceled, () => never),
                    ),
                  ),
                  poll,
                ),
              e => throwError(e),
              b => b,
            ),
          ),
        ),
      ),

      map(({ a, b }) => f(a, b)),
    ),
  );

export const parTraverse_ = <T, A, B>(
  T: Traversable<T>,
  ts: Kind<T, A>,
  f: (a: A) => IO<B>,
): IO<Kind<T, B>> => defer(() => T.traverse(ioParallelApplicative())(f)(ts));

export const parTraverseN_ = <T, A, B>(
  T: Traversable<T>,
  ts: Kind<T, A>,
  f: (a: A) => IO<B>,
  maxConcurrent: number,
): IO<Kind<T, B>> =>
  pipe(
    Sem.of(ioAsync())(maxConcurrent),
    flatMap(sem => parTraverse_(T, ts, x => sem.withPermit(f(x)))),
  );

export const parTraverseOutcome_ = <T, A, B>(
  T: Traversable<T>,
  ts: Kind<T, A>,
  f: (a: A) => IO<B>,
): IO<Kind<T, IOOutcome<B>>> =>
  defer(() => {
    const iobFibers = T.map(flow((x: A) => defer(() => f(x)), fork))(ts);

    return pipe(
      sequence(T)(iobFibers),
      flatMap(fibers => {
        const results = traverse_(T, fibers, x => x.join);
        const fiberCancels = traverse_(T, fibers, f =>
          pipe(
            f.cancel,
            fork,
            flatMap(f2 => f2.join),
          ),
        );
        return onCancel_(
          results,
          map_(fiberCancels, () => undefined),
        );
      }),
    );
  });

export const parTraverseOutcomeN_ = <T, A, B>(
  T: Traversable<T>,
  ts: Kind<T, A>,
  f: (a: A) => IO<B>,
  maxConcurrent: number,
): IO<Kind<T, IOOutcome<B>>> =>
  pipe(
    Sem.of(ioAsync())(maxConcurrent),
    flatMap(sem => parTraverseOutcome_(T, ts, flow(f, Sem.withPermit(sem)))),
  );
