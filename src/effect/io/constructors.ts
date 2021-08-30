import { flow } from '../../fp/core';
import * as E from '../../fp/either';

import { ExecutionContext } from '../execution-context';
import { Poll } from '../kernel/poll';
import {
  URI,
  Async,
  Canceled,
  CurrentTimeMillis,
  Defer,
  Delay,
  Fail,
  IO,
  Pure,
  ReadEC,
  Sleep,
  Uncancelable,
} from './algebra';
import { flatMap_, map_ } from './operators';

export const pure: <A>(a: A) => IO<A> = value => new Pure(value);

export const unit: IO<void> = pure(undefined);

export const delay: <A>(thunk: () => A) => IO<A> = thunk => new Delay(thunk);

export const defer: <A>(thunk: () => IO<A>) => IO<A> = thunk =>
  new Defer(thunk);

export const throwError: (error: Error) => IO<never> = error => new Fail(error);

export const currentTimeMillis: IO<number> = CurrentTimeMillis;

export const readExecutionContext: IO<ExecutionContext> = ReadEC;

export const async = <A>(
  k: (cb: (ea: E.Either<Error, A>) => void) => IO<IO<void> | undefined>,
): IO<A> => new Async(k);

export const async_ = <A>(
  k: (cb: (ea: E.Either<Error, A>) => void) => IO<void>,
): IO<A> => new Async(resume => defer(() => map_(k(resume), () => undefined)));

export const never: IO<never> = async(() => pure(undefined));

export const canceled: IO<void> = Canceled;

export const uncancelable: <A>(ioa: (p: Poll<URI>) => IO<A>) => IO<A> = ioa =>
  new Uncancelable(ioa);

export const sleep = (ms: number): IO<void> => new Sleep(ms);

export const deferPromise = <A>(thunk: () => Promise<A>): IO<A> =>
  async_(resume =>
    delay(() => {
      const onSuccess: (x: A) => void = flow(E.right, resume);
      const onFailure: (e: Error) => void = flow(E.left, resume);
      thunk().then(onSuccess, onFailure);
    }),
  );

export const fromPromise = <A>(iop: IO<Promise<A>>): IO<A> =>
  flatMap_(iop, p =>
    async_(resume =>
      delay(() => {
        const onSuccess: (x: A) => void = flow(E.right, resume);
        const onFailure: (e: Error) => void = flow(E.left, resume);
        p.then(onSuccess, onFailure);
      }),
    ),
  );
