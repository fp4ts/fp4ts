/* eslint-disable @typescript-eslint/ban-types */
import { flow, id, pipe } from '../fp/core';
import * as E from '../fp/either';
import * as O from './outcome';
import * as F from './fiber';
import * as Ref from './ref';
import * as D from './deferred';
import * as Sem from './semaphore';
import { Poll } from './poll';

import {
  IO,
  Pure,
  Fail,
  Delay,
  Canceled,
  Map,
  FlatMap,
  HandleErrorWith,
  CurrentTimeMillis,
  Sleep,
  Async,
  RacePair,
  Uncancelable,
  OnCancel,
  Fork,
} from './algebra';

// Public exports

export { IO };

// -- Constructors

export const pure: <A>(a: A) => IO<A> = value => new Pure(value);

export const unit: IO<void> = pure(undefined);

export const delay: <A>(thunk: () => A) => IO<A> = thunk => new Delay(thunk);

export const defer: <A>(thunk: () => IO<A>) => IO<A> = thunk =>
  pipe(thunk, delay, flatten);

export const deferPromise = <A>(thunk: () => Promise<A>): IO<A> =>
  async(resume =>
    delay(() => {
      const onSuccess: (x: A) => void = flow(E.right, resume);
      const onFailure: (e: Error) => void = flow(E.left, resume);
      thunk().then(onSuccess, onFailure);
    }),
  );

export const throwError: (error: Error) => IO<never> = error => new Fail(error);

export const currentTimeMillis: IO<number> = CurrentTimeMillis;

export const async = <A>(
  k: (cb: (ea: E.Either<Error, A>) => void) => IO<IO<void> | undefined>,
): IO<A> => new Async(k);

export const fork: <A>(ioa: IO<A>) => IO<F.Fiber<A>> = ioa => new Fork(ioa);

export const never: IO<never> = async(() => pure(undefined));

export const canceled: IO<void> = Canceled;

export const uncancelable: <A>(
  ioa: (p: <B>(iob: IO<B>) => IO<B>) => IO<A>,
) => IO<A> = ioa => new Uncancelable(ioa);

// -- Point-free operators

export const deferred: <A>(a?: A) => IO<D.Deferred<A>> = D.of;

export const ref: <A>(a: A) => IO<Ref.Ref<A>> = Ref.of;

export const onCancel: (fin: IO<void>) => <A>(ioa: IO<A>) => IO<A> =
  fin => ioa =>
    onCancel_(ioa, fin);

export const sleep = (ms: number): IO<void> => new Sleep(ms);

export const delayBy: (ms: number) => <A>(ioa: IO<A>) => IO<A> = ms => ioa =>
  delayBy_(ioa, ms);

export const timeout: (ms: number) => <A>(ioa: IO<A>) => IO<A> = ms => ioa =>
  timeout_(ioa, ms);

export const timeoutTo: <B>(
  ms: number,
  fallback: IO<B>,
) => <A>(ioa: IO<A | B>) => IO<A | B> = (ms, fallback) => ioa =>
  timeoutTo_(ioa, ms, fallback);

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

export const handleErrorWith: <B>(
  f: (e: Error) => IO<B>,
) => <A>(ioa: IO<A | B>) => IO<A | B> = f => ioa => handleErrorWith_(ioa, f);

export const traverse: <A, B>(f: (a: A) => IO<B>) => (as: A[]) => IO<B[]> =
  f => as =>
    traverse_(as, f);

export const sequence = <A>(ioas: IO<A>[]): IO<A[]> => traverse_(ioas, id);

export const parTraverse: <A, B>(f: (a: A) => IO<B>) => (as: A[]) => IO<B[]> =
  f => as =>
    parTraverse_(as, f);

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
      x => map_(f.cancel, () => E.left(x)),
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
      handleErrorWith(e =>
        flatMap_(finalizer(O.failure(e)), () => throwError(e)),
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
        defer(() =>
          pipe(
            poll(use(a)),
            finalize(oc => release(a, oc)),
          ),
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

export const handleErrorWith_: <A>(
  ioa: IO<A>,
  f: (e: Error) => IO<A>,
) => IO<A> = (ioa, f) => new HandleErrorWith(ioa, f);

export const traverse_ = <A, B>(as: A[], f: (a: A) => IO<B>): IO<B[]> =>
  defer(() =>
    as.reduce(
      (ioAcc: IO<B[]>, ioa) =>
        pipe(
          Do,
          bindTo('acc', () => ioAcc),
          bindTo('b', () => f(ioa)),
          map(({ acc, b }) => [...acc, b]),
        ),
      pure([]),
    ),
  );

export const parTraverse_ = <A, B>(as: A[], f: (a: A) => IO<B>): IO<B[]> =>
  defer(() =>
    as.map(f).reduceRight<IO<B[]>>(
      (iobs, b) =>
        pipe(
          both_(iobs, b),
          map(([bs, b]) => [...bs, b]),
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
    flatMap(sem => parTraverse_(as, flow(f, Sem.withPermit(sem)))),
  );

export const parTraverseOutcome_ = <A, B>(
  as: A[],
  f: (a: A) => IO<B>,
): IO<O.Outcome<B>[]> =>
  defer(() => {
    const iobFibers = as.map(flow(f, fork));

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

// -- Do notation

export const Do: IO<{}> = pure({});

export const bindTo: <N extends string, S extends {}, B>(
  name: N,
  iob: (s: S) => IO<B>,
) => (
  ios: IO<S>,
) => IO<{ readonly [K in keyof S | N]: K extends keyof S ? S[K] : B }> =
  (name, iob) => ios =>
    bindTo_(ios, name, iob);

export const bind: <S extends {}, B>(
  iob: (s: S) => IO<B>,
) => (ios: IO<S>) => IO<S> = iob => ios => bind_(ios, iob);

export const bindTo_ = <N extends string, S extends {}, B>(
  ios: IO<S>,
  name: N,
  iob: (s: S) => IO<B>,
): IO<{ readonly [K in keyof S | N]: K extends keyof S ? S[K] : B }> =>
  flatMap_(ios, s => map_(iob(s), b => ({ ...s, [name as N]: b } as any)));

export const bind_ = <S extends {}, B>(
  ios: IO<S>,
  iob: (s: S) => IO<B>,
): IO<S> => flatMap_(ios, s => map_(iob(s), () => s));
