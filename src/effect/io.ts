/* eslint-disable @typescript-eslint/ban-types */
import * as E from '../fp/either';
import { flow, pipe } from '../fp/core';
import { Fiber } from './fiber';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export abstract class IO<A> {}

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

class Defer<A> extends IO<A> {
  public readonly tag = 'defer';
  public constructor(public readonly thunk: () => A) {
    super();
  }
}

class Suspend<A> extends IO<A> {
  public readonly tag = 'suspend';
  public constructor(public readonly thunk: () => IO<A>) {
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

class Async<K, R> extends IO<R> {
  public readonly tag = 'async';
  public constructor(
    public readonly body: (k: (ea: E.Either<Error, R>) => void) => void,
  ) {
    super();
  }
}

class Fork<A> extends IO<Fiber<A>> {
  public readonly tag = 'fork';
  public constructor(public readonly ioa: IO<A>) {
    super();
  }
}

export type IOView<A> =
  | Pure<A>
  | Suspend<A>
  | Defer<A>
  | Bind<any, A>
  | Async<any, A>
  | Fail
  | Fork<A>;

export const view = <A>(_: IO<A>): IOView<A> => _ as any;

// -- Constructors

export const pure: <A>(a: A) => IO<A> = value => new Pure(value);

export const unit: IO<void> = pure(undefined);

export const defer: <A>(thunk: () => A) => IO<A> = thunk => new Defer(thunk);

export const suspend: <A>(thunk: () => IO<A>) => IO<A> = thunk =>
  new Suspend(thunk);

export const suspendPromise = <A>(thunk: () => Promise<A>): IO<A> =>
  async(resume => {
    const onSuccess: (x: A) => void = flow(E.right, resume);
    const onFailure: (e: Error) => void = flow(E.left, resume);
    thunk().then(onSuccess, onFailure);
  });

export const throwError: (error: Error) => IO<never> = error => new Fail(error);

export const async: <A>(
  cb: (k: (ea: E.Either<Error, A>) => void) => void,
) => IO<A> = cont => new Async(cont);

export const sleep = (ms: number): IO<void> =>
  async(resume => {
    // potentially return cancelation action?
    setTimeout(() => resume(E.rightUnit), ms);
  });

// -- Point-free operators

export const fork: <A>(ioa: IO<A>) => IO<Fiber<A>> = ioa => new Fork(ioa);

export const delayBy: (ms: number) => <A>(ioa: IO<A>) => IO<A> = ms => ioa =>
  delayBy_(ioa, ms);

export const map: <A, B>(f: (a: A) => B) => (ioa: IO<A>) => IO<B> = f => ioa =>
  map_(ioa, f);

export const flatMap: <A, B>(f: (a: A) => IO<B>) => (ioa: IO<A>) => IO<B> =
  f => ioa =>
    flatMap_(ioa, f);

export const handleErrorWith: <B>(
  f: (e: Error) => IO<B>,
) => <A>(ioa: IO<A>) => IO<A | B> = f => ioa => handleErrorWith_(ioa, f);

export const sequence = <A>(ioas: IO<A>[]): IO<A[]> =>
  ioas.reduce(
    (acc: IO<A[]>, ioa) => flatMap_(acc, xs => map_(ioa, x => [...xs, x])),
    pure([]),
  );

// -- Point-ful operators

export const delayBy_ = <A>(thunk: IO<A>, ms: number): IO<A> =>
  pipe(
    sleep(ms),
    flatMap(() => thunk),
  );

export const map_: <A, B>(ioa: IO<A>, f: (a: A) => B) => IO<B> = (ioa, f) =>
  flatMap_(ioa, x => pure(f(x)));

export const flatMap_: <A, B>(ioa: IO<A>, f: (a: A) => IO<B>) => IO<B> = (
  ioa,
  f,
) => new Bind(ioa, E.fold(throwError, f));

export const handleErrorWith_: <A, B>(
  ioa: IO<A>,
  f: (e: Error) => IO<B>,
) => IO<A | B> = (ioa, f) => ({
  tag: 'bind',
  self: ioa,
  cont: E.fold(f, pure),
});

// -- Do notation

export const Do: IO<{}> = pure({});

export const bindTo: <N extends string, S extends {}, B>(
  name: N,
  iob: (s: S) => IO<B>,
) => (ios: IO<S>) => IO<S & { readonly [K in N]: B }> = (name, iob) => ios =>
  bindTo_(ios, name, iob);

export const bind: <S extends {}, B>(
  iob: (s: S) => IO<B>,
) => (ios: IO<S>) => IO<S> = iob => ios => bind_(ios, iob);

export const bindTo_ = <N extends string, S extends {}, B>(
  ios: IO<S>,
  name: N,
  iob: (s: S) => IO<B>,
): IO<S & { readonly [K in N]: B }> =>
  flatMap_(ios, s => map_(iob(s), b => ({ ...s, [name as N]: b } as any)));

export const bind_ = <S extends {}, B>(
  ios: IO<S>,
  iob: (s: S) => IO<B>,
): IO<S> => flatMap_(ios, s => map_(iob(s), () => s));
