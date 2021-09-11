import { flow, id, pipe, Kind, URI, URIS } from '../../core';
import { Traversable } from '../../cats';
import { Either, Left, Right } from '../../cats/data';

import { IOFiber } from '../io-fiber';
import { IOOutcome } from '../io-outcome';
import { ExecutionContext } from '../execution-context';

import * as Sem from '../kernel/semaphore';
import { Outcome, Poll } from '../kernel';

import { IoURI } from './io';
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
  acquire: (poll: Poll<[URI<IoURI>]>) => IO<A>,
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

export const traverse: <T extends URIS>(
  T: Traversable<T>,
) => <A, B>(
  f: (a: A) => IO<B>,
) => <C2, S2, R2, E2>(
  ts: Kind<T, C2, S2, R2, E2, A>,
) => IO<Kind<T, C2, S2, R2, E2, B>> = T => f => ts => traverse_(T, ts, f);

export const sequence =
  <T extends URIS>(T: Traversable<T>) =>
  <A, C2, S2, R2, E2>(
    ioas: Kind<T, C2, S2, R2, E2, IO<A>>,
  ): IO<Kind<T, C2, S2, R2, E2, A>> =>
    traverse_(T, ioas, id);

export const parTraverse: <T extends URIS>(
  T: Traversable<T>,
) => <A, B>(
  f: (a: A) => IO<B>,
) => <C2, S2, R2, E2>(
  ts: Kind<T, C2, S2, R2, E2, A>,
) => IO<Kind<T, C2, S2, R2, E2, B>> = T => f => ts => parTraverse_(T, ts, f);

export const parSequenceN: <T extends URIS>(
  T: Traversable<T>,
  maxConcurrent: number,
) => <C2, S2, R2, E2, A>(
  iot: Kind<T, C2, S2, R2, E2, IO<A>>,
) => IO<Kind<T, C2, S2, R2, E2, A>> = (T, maxConcurrent) => iot =>
  parSequenceN_(T, iot, maxConcurrent);

export const parTraverseN: <T extends URIS, C2>(
  T: Traversable<T, C2>,
  maxConcurrent: number,
) => <A, B>(
  f: (a: A) => IO<B>,
) => <S2, R2, E2>(
  as: Kind<T, C2, S2, R2, E2, A>,
) => IO<Kind<T, C2, S2, R2, E2, B>> = (T, ms) => f => as =>
  parTraverseN_(T, as, f, ms);

export const parSequence =
  <T extends URIS>(T: Traversable<T>) =>
  <C2, S2, R2, E2, A>(
    iot: Kind<T, C2, S2, R2, E2, IO<A>>,
  ): IO<Kind<T, C2, S2, R2, E2, A>> =>
    parTraverse_(T, iot, id);

export const parTraverseOutcome: <T extends URIS>(
  T: Traversable<T>,
) => <A, B>(
  f: (a: A) => IO<B>,
) => <C2, S2, R2, E2>(
  ts: Kind<T, C2, S2, R2, E2, A>,
) => IO<Kind<T, C2, S2, R2, E2, IOOutcome<B>>> = T => f => as =>
  parTraverseOutcome_(T, as, f);

export const parSequenceOutcome =
  <T extends URIS>(T: Traversable<T>) =>
  <C2, S2, R2, E2, A>(
    iot: Kind<T, C2, S2, R2, E2, IO<A>>,
  ): IO<Kind<T, C2, S2, R2, E2, IOOutcome<A>>> =>
    parTraverseOutcome_(T, iot, id);

export const parTraverseOutcomeN: <T extends URIS>(
  T: Traversable<T>,
  maxConcurrent: number,
) => <A, B>(
  f: (a: A) => IO<B>,
) => <C2, S2, R2, E2>(
  ts: Kind<T, C2, S2, R2, E2, A>,
) => IO<Kind<T, C2, S2, R2, E2, IOOutcome<B>>> =
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
  pipe(
    race_(sleep(ms), ioa),
    flatMap(ea => ea.fold(() => fallback, pure)),
  );

export const executeOn_ = <A>(ioa: IO<A>, ec: ExecutionContext): IO<A> =>
  new ExecuteOn(ioa, ec);

export const race_ = <A, B>(ioa: IO<A>, iob: IO<B>): IO<Either<A, B>> => {
  const cont = <X, Y>(
    poll: Poll<[URI<IoURI>]>,
    oc: IOOutcome<X>,
    f: IOFiber<Y>,
  ): IO<Either<X, Y>> =>
    oc.fold(
      (): IO<Either<X, Y>> =>
        pipe(
          poll(f.join),
          onCancel(f.cancel),
          flatMap(oc =>
            oc.fold(
              () => flatMap_(poll(canceled), () => never),
              ey => throwError(ey),
              fy => map_(fy, Right),
            ),
          ),
        ),
      ex => flatMap_(f.cancel, () => throwError(ex)),
      fx =>
        pipe(
          f.cancel,
          flatMap(() => f.join),
          flatMap(oc =>
            oc.fold(
              () => map_(fx, Left),
              ey => throwError(ey),
              () => map_(fx, Left),
            ),
          ),
        ),
    );

  return uncancelable(poll =>
    pipe(
      poll(racePair_(ioa, iob)),
      flatMap(ea =>
        ea.fold(
          ([oc, f]: [IOOutcome<A>, IOFiber<B>]) => cont(poll, oc, f),
          ([f, oc]: [IOFiber<A>, IOOutcome<B>]) =>
            pipe(
              cont(poll, oc, f),
              map(ea => ea.swapped),
            ),
        ),
      ),
    ),
  );
};

export const raceOutcome_ = <A, B>(
  ioa: IO<A>,
  iob: IO<B>,
): IO<Either<IOOutcome<A>, IOOutcome<B>>> =>
  uncancelable(() =>
    pipe(
      racePair_(ioa, iob),
      flatMap(ea =>
        ea.fold(
          ([oc, f]: [IOOutcome<A>, IOFiber<B>]) =>
            pipe(
              f.cancel,
              map(() => Left(oc) as Either<IOOutcome<A>, IOOutcome<B>>),
            ),
          ([f, oc]: [IOFiber<A>, IOOutcome<B>]) =>
            pipe(
              f.cancel,
              map(() => Right(oc)),
            ),
        ),
      ),
    ),
  );

export const racePair_ = <A, B>(
  ioa: IO<A>,
  iob: IO<B>,
): IO<Either<[IOOutcome<A>, IOFiber<B>], [IOFiber<A>, IOOutcome<B>]>> =>
  new RacePair(ioa, iob);

export const both_ = <A, B>(ioa: IO<A>, iob: IO<B>): IO<[A, B]> => {
  const cont = <X, Y>(
    poll: Poll<[URI<IoURI>]>,
    oc: IOOutcome<X>,
    f: IOFiber<Y>,
  ): IO<[X, Y]> =>
    oc.fold(
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
          flatMap(oc =>
            oc.fold(
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
      flatMap(ea =>
        ea.fold(
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
      flatMap(ea =>
        ea.fold(
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
      onCancel(finalizer(Outcome.canceled())),
      onError(e =>
        pipe(
          finalizer(Outcome.failure(e)),
          handleErrorWith(e2 =>
            flatMap_(readExecutionContext, ec => pure(ec.reportFailure(e2))),
          ),
        ),
      ),
      flatTap(a => finalizer(Outcome.success(pure(a)))),
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

export const traverse_ = <T extends URIS, C2, S2, R2, E2, A, B>(
  T: Traversable<T>,
  ts: Kind<T, C2, S2, R2, E2, A>,
  f: (a: A) => IO<B>,
): IO<Kind<T, C2, S2, R2, E2, B>> =>
  defer(() => T.traverse(ioSequentialApplicative())(f)(ts));

export const parSequenceN_: <T extends URIS, C2, S2, R2, E2, A>(
  T: Traversable<T>,
  ioas: Kind<T, C2, S2, R2, E2, IO<A>>,
  maxConcurrent: number,
) => IO<Kind<T, C2, S2, R2, E2, A>> = (T, ioas, maxConcurrent) =>
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
          flatMap(oc =>
            oc.fold(
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
          flatMap(oc =>
            oc.fold(
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
          flatMap(oc =>
            oc.fold(
              () =>
                flatMap_(fiberB.cancel, () =>
                  pipe(
                    fiberB.join,
                    flatMap(oc =>
                      oc.fold(
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
          flatMap(oc =>
            oc.fold(
              () =>
                pipe(
                  fiberA.join,
                  flatMap(oc =>
                    oc.fold(
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

export const parTraverse_ = <T extends URIS, C2, S2, R2, E2, A, B>(
  T: Traversable<T, C2>,
  ts: Kind<T, C2, S2, R2, E2, A>,
  f: (a: A) => IO<B>,
): IO<Kind<T, C2, S2, R2, E2, B>> =>
  defer(() => T.traverse(ioParallelApplicative())(f)(ts));

export const parTraverseN_ = <T extends URIS, C2, S2, R2, E2, A, B>(
  T: Traversable<T, C2>,
  ts: Kind<T, C2, S2, R2, E2, A>,
  f: (a: A) => IO<B>,
  maxConcurrent: number,
): IO<Kind<T, C2, S2, R2, E2, B>> =>
  pipe(
    Sem.of(ioAsync())(maxConcurrent),
    flatMap(sem => parTraverse_(T, ts, x => sem.withPermit(f(x)))),
  );

export const parTraverseOutcome_ = <T extends URIS, C2, S2, R2, E2, A, B>(
  T: Traversable<T, C2>,
  ts: Kind<T, C2, S2, R2, E2, A>,
  f: (a: A) => IO<B>,
): IO<Kind<T, C2, S2, R2, E2, IOOutcome<B>>> =>
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

export const parTraverseOutcomeN_ = <T extends URIS, C2, S2, R2, E2, A, B>(
  T: Traversable<T, C2>,
  ts: Kind<T, C2, S2, R2, E2, A>,
  f: (a: A) => IO<B>,
  maxConcurrent: number,
): IO<Kind<T, C2, S2, R2, E2, IOOutcome<B>>> =>
  pipe(
    Sem.of(ioAsync())(maxConcurrent),
    flatMap(sem => parTraverseOutcome_(T, ts, flow(f, Sem.withPermit(sem)))),
  );
