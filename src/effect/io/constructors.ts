import { flow } from '../../fp/core';
import * as E from '../../fp/either';

import { ExecutionContext } from '../execution-context';
import { Poll } from '../kernel/poll';
import {
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

export const pure: <A>(a: A) => IO<A> = value => new Pure(value);

export const unit: IO<void> = pure(undefined);

export const delay: <A>(thunk: () => A) => IO<A> = thunk => new Delay(thunk);

export const defer: <A>(thunk: () => IO<A>) => IO<A> = thunk =>
  new Defer(thunk);

export const deferPromise = <A>(thunk: () => Promise<A>): IO<A> =>
  async(resume =>
    delay(() => {
      const onSuccess: (x: A) => void = flow(E.right, resume);
      const onFailure: (e: Error) => void = flow(E.left, resume);
      thunk().then(onSuccess, onFailure);
      return undefined;
    }),
  );

export const throwError: (error: Error) => IO<never> = error => new Fail(error);

export const currentTimeMillis: IO<number> = CurrentTimeMillis;

export const readExecutionContext: IO<ExecutionContext> = ReadEC;

export const async = <A>(
  k: (cb: (ea: E.Either<Error, A>) => void) => IO<IO<void> | undefined | void>,
): IO<A> => new Async(k);

export const never: IO<never> = async(() => pure(undefined));

export const canceled: IO<void> = Canceled;

export const uncancelable: <A>(ioa: (p: Poll) => IO<A>) => IO<A> = ioa =>
  new Uncancelable(ioa);

export const sleep = (ms: number): IO<void> => new Sleep(ms);
