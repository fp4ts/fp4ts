/* eslint-disable @typescript-eslint/ban-types */
import * as E from '../fp/either';
import * as O from './outcome';
import { flow, id, pipe } from '../fp/core';
import { Fiber } from './fiber';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export abstract class IO<A> {
  // @ts-ignore
  private readonly __void: void;
}

export const IOEndFiber = new (class IOEnd extends IO<never> {
  public readonly tag = 'IOEndFiber';
})();
export type IOEndFiber = typeof IOEndFiber;

export const Suspend = new (class Suspend extends IO<never> {
  public readonly tag = 'suspend';
})();
export type Suspend = typeof Suspend;

// export const Canceled = new (class Canceled extends IO<never> {
//   public readonly tag = 'canceled';
// })();
// export type Canceled = typeof Canceled;

class Pure<A> extends IO<A> {
  public readonly tag = 'pure';
  public constructor(public readonly value: A) {
    super();
  }
}

class Fail extends IO<never> {
  public readonly tag = 'fail';
  public constructor(readonly error: Error) {
    super();
  }
}

class Delay<A> extends IO<A> {
  public readonly tag = 'delay';
  public constructor(public readonly thunk: () => A) {
    super();
  }
}

class Bind<A, B> extends IO<B> {
  public readonly tag = 'bind';
  public constructor(
    public readonly ioa: IO<A>,
    public readonly cont: (ea: E.Either<Error, A>) => IO<B>,
  ) {
    super();
  }
}

type Cont<K, R> = (cb: (ea: E.Either<Error, K>) => void) => IO<R>;
class Async<K, R> extends IO<R> {
  public readonly tag = 'async';
  public constructor(public readonly body: Cont<K, R>) {
    super();
  }
}

class Fork<A> extends IO<Fiber<A>> {
  public readonly tag = 'fork';
  public constructor(public readonly ioa: IO<A>) {
    super();
  }
}

class OnCancel<A> extends IO<A> {
  public readonly tag = 'onCancel';
  public constructor(
    public readonly ioa: IO<A>,
    public readonly fin: IO<void>,
  ) {
    super();
  }
}

class Uncancelable<A> extends IO<A> {
  public readonly tag = 'uncancelable';
  public constructor(
    public readonly body: (p: <B>(iob: IO<B>) => IO<B>) => IO<A>,
  ) {
    super();
  }
}

class RacePair<A, B> extends IO<
  E.Either<[O.Outcome<A>, Fiber<B>], [Fiber<B>, O.Outcome<B>]>
> {
  public readonly tag = 'racePair';
  public constructor(public readonly ioa: IO<A>, public readonly iob: IO<B>) {
    super();
  }
}

export type IOView<A> =
  | IOEndFiber
  | Pure<A>
  | Suspend
  // | Canceled
  | Delay<A>
  | Bind<any, A>
  | Async<any, A>
  | Fail
  | Fork<A>
  | OnCancel<A>
  | Uncancelable<A>
  | RacePair<unknown, unknown>;

export const view = <A>(_: IO<A>): IOView<A> => _ as any;

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

export const async: <A>(
  k: (cb: (ea: E.Either<Error, A>) => void) => IO<IO<void> | undefined>,
) => IO<A> = k =>
  new Async(resume =>
    uncancelable(p =>
      pipe(
        k(resume),
        flatMap(fin => (fin ? onCancel_(p(Suspend), fin) : p(Suspend))),
      ),
    ),
  );

export const fork: <A>(ioa: IO<A>) => IO<Fiber<A>> = ioa => new Fork(ioa);

export const uncancelable: <A>(
  ioa: (p: <B>(iob: IO<B>) => IO<B>) => IO<A>,
) => IO<A> = ioa => new Uncancelable(ioa);

// -- Point-free operators

export const onCancel: (fin: IO<void>) => <A>(ioa: IO<A>) => IO<A> =
  fin => ioa =>
    onCancel_(ioa, fin);

export const sleep = (ms: number): IO<void> =>
  async(resume =>
    delay(() => {
      const ref = setTimeout(() => resume(E.rightUnit), ms);
      return delay(() => clearTimeout(ref));
    }),
  );

export const delayBy: (ms: number) => <A>(ioa: IO<A>) => IO<A> = ms => ioa =>
  delayBy_(ioa, ms);

// export const timeout: (ms: number) => <A>(ioa: IO<A>) => IO<A> = ms => ioa =>
//   timeout_(ioa, ms);

export const race: <B>(iob: IO<B>) => <A>(ioa: IO<A>) => IO<E.Either<A, B>> =
  iob => ioa =>
    race_(ioa, iob);

export const racePair: <B>(
  iob: IO<B>,
) => <A>(ioa: IO<A>) => IO<E.Either<[A, Fiber<B>], [Fiber<A>, B]>> =
  iob => ioa =>
    racePair_(ioa, iob);

export const map: <A, B>(f: (a: A) => B) => (ioa: IO<A>) => IO<B> = f => ioa =>
  map_(ioa, f);

export const flatMap: <A, B>(f: (a: A) => IO<B>) => (ioa: IO<A>) => IO<B> =
  f => ioa =>
    flatMap_(ioa, f);

export const flatTap: <A>(f: (a: A) => IO<unknown>) => (ioa: IO<A>) => IO<A> =
  f => ioa =>
    flatTap_(ioa, f);

export const flatten: <A>(ioioa: IO<IO<A>>) => IO<A> = flatMap(id);

export const handleErrorWith: <B>(
  f: (e: Error) => IO<B>,
) => <A>(ioa: IO<A>) => IO<A | B> = f => ioa => handleErrorWith_(ioa, f);

export const traverse: <A, B>(f: (a: A) => IO<B>) => (as: A[]) => IO<B[]> =
  f => as =>
    traverse_(as, f);

export const sequence = <A>(ioas: IO<A>[]): IO<A[]> => traverse_(ioas, id);

export const parTraverseOutcome: <A, B>(
  f: (a: A) => IO<B>,
) => (as: A[]) => IO<O.Outcome<B>[]> = f => as => parTraverseOutcome_(as, f);

export const parSequenceOutcome = <A>(ioas: IO<A>[]): IO<O.Outcome<A>[]> =>
  parTraverseOutcome_(ioas, id);

// -- Point-ful operators

export const onCancel_: <A>(ioa: IO<A>, fin: IO<void>) => IO<A> = (ioa, fin) =>
  new OnCancel(ioa, fin);

export const delayBy_ = <A>(thunk: IO<A>, ms: number): IO<A> =>
  pipe(
    sleep(ms),
    flatMap(() => thunk),
  );

// export const timeout_ = <A>(ioa: IO<A>, ms: number): IO<A> =>
//   race_(ioa, pipe(throwError(new Error('Timeout exceeded')), delayBy(ms)));

export const race_ = <A, B>(ioa: IO<A>, iob: IO<B>): IO<E.Either<A, B>> =>
  flatMap_(
    racePair_(ioa, iob),
    E.fold(
      E.fold(throwError, flow(E.left, pure)),
      E.fold(throwError, flow(E.right, pure)),
    ),
  );

export const racePair_ = <A, B>(
  ioa: IO<A>,
  iob: IO<B>,
): IO<E.Either<E.Either<Error, A>, E.Either<Error, B>>> =>
  map_(
    racePairOutcome_(ioa, iob),
    E.fold(flow(O.toEither, E.left), flow(O.toEither, E.right)),
  );

export const racePairOutcome_ = <A, B>(
  ioa: IO<A>,
  iob: IO<B>,
): IO<E.Either<O.Outcome<A>, O.Outcome<B>>> =>
  flatMap_(
    new RacePair(ioa, iob),
    E.fold(
      ([oc, fb]: [O.Outcome<A>, Fiber<B>]) => map_(fb.cancel, () => E.left(oc)),
      ([fa, oc]: [Fiber<A>, O.Outcome<B>]) =>
        map_(fa.cancel, () => E.right(oc)),
    ),
  );

export const map_: <A, B>(ioa: IO<A>, f: (a: A) => B) => IO<B> = (ioa, f) =>
  flatMap_(ioa, x => pure(f(x)));

export const flatMap_: <A, B>(ioa: IO<A>, f: (a: A) => IO<B>) => IO<B> = (
  ioa,
  f,
) => new Bind(ioa, E.fold(throwError, f));

export const flatTap_: <A>(ioa: IO<A>, f: (a: A) => IO<unknown>) => IO<A> = (
  ioa,
  f,
) => flatMap_(ioa, x => map_(f(x), () => x));

export const handleErrorWith_: <A, B>(
  ioa: IO<A>,
  f: (e: Error) => IO<B>,
) => IO<A | B> = (ioa, f) => new Bind(ioa, E.fold(f, pure));

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

// export const traversePar_ = <A, B>(as: A[], f: (a: A) => IO<B>): IO<B[]> =>
//   defer(() => {
//     const iobFibers = as.map(flow(f, fork));

//     const fiberCancels = iobFibers.map(
//       flow(
//         flatMap(fiber => fork(fiber.cancel)),
//         flatMap(fiberCancel => fiberCancel.join),
//       ),
//     );

//     return pipe(
//       sequence(iobFibers),
//       flatMap(iobFibers => sequence(iobFibers.map(fiber => fiber.join))),
//       onCancel(sequence(fiberCancels)),
//     );
//   });

export const parTraverseOutcome_ = <A, B>(
  as: A[],
  f: (a: A) => IO<B>,
): IO<O.Outcome<B>[]> =>
  defer(() => {
    const iobFibers = as.map(flow(f, fork));
    const fiberCancels = iobFibers.map(
      flow(
        flatMap(fiber => {
          console.log('CANCELLING FIBER');
          return fork(fiber.cancel);
        }),
        flatMap(fiberCancel => fiberCancel.join),
      ),
    );

    return pipe(
      sequence(iobFibers),
      flatMap(iobFibers => sequence(iobFibers.map(fiber => fiber.join))),
      onCancel(sequence(fiberCancels)),
    );
  });

// export const traverseParN_ = <A, B>(
//   as: A[],
//   f: (a: A) => IO<B>,
//   maxConcurrent: number,
// ): IO<B[]> =>
//   async(resume =>
//     delay(() => {
//       const active = 0;
//       const iobFibers = as.map(a => fork(f(a)));
//     }),
//   );

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
