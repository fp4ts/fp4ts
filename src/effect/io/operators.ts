import { flow, id, pipe } from '../../fp/core';
import * as E from '../../fp/either';
import * as O from '../outcome';
import * as F from '../fiber';
import * as Sem from '../semaphore';
import { ExecutionContext } from '../execution-context';
import { Poll } from '../poll';
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
} from './index';
import { bind, bindTo, Do } from './do';

export const fork: <A>(ioa: IO<A>) => IO<F.Fiber<A>> = ioa => new Fork(ioa);

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
) => <A>(ioa: IO<A | B>) => IO<A | B> = (ms, fallback) => ioa =>
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
) => IO<E.Either<[O.Outcome<A>, F.Fiber<B>], [F.Fiber<A>, O.Outcome<B>]>> =
  iob => ioa =>
    racePair_(ioa, iob);

export const both: <B>(iob: IO<B>) => <A>(ioa: IO<A>) => IO<[A, B]> =
  iob => ioa =>
    both_(ioa, iob);

export const finalize: <A>(
  finalizer: (oc: O.Outcome<A>) => IO<void>,
) => (ioa: IO<A>) => IO<A> = finalizer => ioa => finalize_(ioa, finalizer);

export const bracket: <A, B>(
  use: (a: A) => IO<B>,
) => (release: (a: A) => IO<void>) => (ioa: IO<A>) => IO<B> =
  use => release => ioa =>
    bracket_(ioa, use, release);

export const bracketOutcome: <A, B>(
  use: (a: A) => IO<B>,
) => (release: (a: A, oc: O.Outcome<B>) => IO<void>) => (ioa: IO<A>) => IO<B> =
  use => release => ioa =>
    bracketOutcome_(ioa, use, release);

export const bracketFull: <A>(
  acquire: (poll: Poll) => IO<A>,
) => <B>(
  release: (a: A, oc: O.Outcome<B>) => IO<void>,
) => (use: (a: A) => IO<B>) => IO<B> = acquire => release => use =>
  bracketFull_(acquire, use, release);

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
) => <A>(ioa: IO<A | B>) => IO<A | B> = f => ioa => handleError_(ioa, f);

export const handleErrorWith: <B>(
  f: (e: Error) => IO<B>,
) => <A>(ioa: IO<A | B>) => IO<A | B> = f => ioa => handleErrorWith_(ioa, f);

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

export const traverse: <A, B>(f: (a: A) => IO<B>) => (as: A[]) => IO<B[]> =
  f => as =>
    traverse_(as, f);

export const sequence = <A>(ioas: IO<A>[]): IO<A[]> => traverse_(ioas, id);

export const parTraverse: <A, B>(f: (a: A) => IO<B>) => (as: A[]) => IO<B[]> =
  f => as =>
    parTraverse_(as, f);

export const parSequenceN: (
  maxConcurrent: number,
) => <A>(ioas: IO<A>[]) => IO<A[]> = maxConcurrent => ioas =>
  parSequenceN_(ioas, maxConcurrent);

export const parTraverseN: <A, B>(
  f: (a: A) => IO<B>,
  maxConcurrent: number,
) => (as: A[]) => IO<B[]> = (f, ms) => as => parTraverseN_(as, f, ms);

export const parSequence = <A>(ioas: IO<A>[]): IO<A[]> =>
  parTraverse_(ioas, id);

export const parTraverseOutcome: <A, B>(
  f: (a: A) => IO<B>,
) => (as: A[]) => IO<O.Outcome<B>[]> = f => as => parTraverseOutcome_(as, f);

export const parSequenceOutcome = <A>(ioas: IO<A>[]): IO<O.Outcome<A>[]> =>
  parTraverseOutcome_(ioas, id);

export const parTraverseOutcomeN: <A, B>(
  f: (a: A) => IO<B>,
  maxConcurrent: number,
) => (as: A[]) => IO<O.Outcome<B>[]> = (f, maxConcurrent) => as =>
  parTraverseOutcomeN_(as, f, maxConcurrent);

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
    poll: Poll,
    oc: O.Outcome<X>,
    f: F.Fiber<Y>,
  ): IO<E.Either<X, Y>> =>
    O.fold_<X, IO<E.Either<X, Y>>>(
      oc,
      () =>
        pipe(
          poll(f.join),
          onCancel(f.cancel),
          flatMap(
            O.fold(
              () => flatMap_(poll(canceled), () => never),
              ey => throwError(ey),
              y => pure(E.right(y)),
            ),
          ),
        ),
      ex => flatMap_(f.cancel, () => throwError(ex)),
      x =>
        pipe(
          f.cancel,
          flatMap(() => f.join),
          flatMap(
            O.fold(
              () => pure(E.left(x)),
              ey => throwError(ey),
              () => pure(E.left(x)),
            ),
          ),
        ),
    );

  return uncancelable(poll =>
    pipe(
      poll(racePair_(ioa, iob)),
      flatMap(
        E.fold(
          ([oc, f]: [O.Outcome<A>, F.Fiber<B>]) => cont(poll, oc, f),
          ([f, oc]: [F.Fiber<A>, O.Outcome<B>]) =>
            pipe(cont(poll, oc, f), map(E.swapped)),
        ),
      ),
    ),
  );
};

export const racePair_ = <A, B>(
  ioa: IO<A>,
  iob: IO<B>,
): IO<E.Either<[O.Outcome<A>, F.Fiber<B>], [F.Fiber<B>, O.Outcome<B>]>> =>
  new RacePair(ioa, iob);

export const both_ = <A, B>(ioa: IO<A>, iob: IO<B>): IO<[A, B]> => {
  const cont = <X, Y>(
    poll: Poll,
    oc: O.Outcome<X>,
    f: F.Fiber<Y>,
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
      x =>
        pipe(
          poll(f.join),
          onCancel(f.cancel),
          flatMap(
            O.fold(
              () => flatMap_(poll(canceled), () => never),
              ey => throwError(ey),
              y => pure([x, y]),
            ),
          ),
        ),
    );

  return uncancelable(poll =>
    pipe(
      poll(racePair_(ioa, iob)),
      flatMap(
        E.fold(
          ([oc, f]: [O.Outcome<A>, F.Fiber<B>]) => cont(poll, oc, f),
          ([f, oc]: [F.Fiber<A>, O.Outcome<B>]) =>
            pipe(
              cont(poll, oc, f),
              map(([b, a]) => [a, b]),
            ),
        ),
      ),
    ),
  );
};

export const finalize_ = <A>(
  ioa: IO<A>,
  finalizer: (oc: O.Outcome<A>) => IO<void>,
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
      flatTap(a => finalizer(O.success(a))),
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
  release: (a: A, oc: O.Outcome<B>) => IO<void>,
): IO<B> => bracketFull_(() => ioa, use, release);

export const bracketFull_ = <A, B>(
  acquire: (poll: Poll) => IO<A>,
  use: (a: A) => IO<B>,
  release: (a: A, oc: O.Outcome<B>) => IO<void>,
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

export const traverse_ = <A, B>(as: A[], f: (a: A) => IO<B>): IO<B[]> =>
  defer(() =>
    as.reduce(
      (ioAcc: IO<B[]>, ioa) =>
        pipe(
          Do,
          bindTo('acc', () => ioAcc),
          bindTo('b', () => defer(() => f(ioa))),
          map(({ acc, b }) => [...acc, b]),
        ),
      pure([]),
    ),
  );

export const parSequenceN_: <A>(
  ioas: IO<A>[],
  maxConcurrent: number,
) => IO<A[]> = (ioas, maxConcurrent) => parTraverseN_(ioas, id, maxConcurrent);

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
              a => pure(a),
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
              b => pure(b),
            ),
          ),
        ),
      ),

      map(({ a, b }) => f(a, b)),
    ),
  );

export const parTraverse_ = <A, B>(as: A[], f: (a: A) => IO<B>): IO<B[]> =>
  defer(() =>
    as.reduceRight(
      (iobs, a) =>
        map2_(
          // Order very important
          iobs,
          defer(() => f(a)),
          (bs, b) => [...bs, b],
        ),
      pure([] as B[]),
    ),
  );

export const parTraverseN_ = <A, B>(
  as: A[],
  f: (a: A) => IO<B>,
  maxConcurrent: number,
): IO<B[]> =>
  pipe(
    Sem.of(maxConcurrent),
    flatMap(sem => parTraverse_(as, x => sem.withPermit(f(x)))),
  );

export const parTraverseOutcome_ = <A, B>(
  as: A[],
  f: (a: A) => IO<B>,
): IO<O.Outcome<B>[]> =>
  defer(() => {
    const iobFibers = as.map(flow(x => defer(() => f(x)), fork));

    return pipe(
      sequence(iobFibers),
      flatMap(fibers => {
        const results = traverse_(fibers, F.join);
        const fiberCancels = traverse_(
          fibers,
          flow(flow(F.cancel, fork), flatMap(F.join)),
        );
        return onCancel_(
          results,
          map_(fiberCancels, () => undefined),
        );
      }),
    );
  });

export const parTraverseOutcomeN_ = <A, B>(
  as: A[],
  f: (a: A) => IO<B>,
  maxConcurrent: number,
): IO<O.Outcome<B>[]> =>
  pipe(
    Sem.of(maxConcurrent),
    flatMap(sem => parTraverseOutcome_(as, flow(f, Sem.withPermit(sem)))),
  );
