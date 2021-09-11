import { flow, URI } from '../../core';
import { Either, Left, None, Option, Right } from '../../cats/data';

import { ExecutionContext } from '../execution-context';
import { Poll } from '../kernel';
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
import { flatMap_, map_ } from './operators';
import { IoURI } from '.';

export const pure: <A>(a: A) => IO<A> = value => new Pure(value);

export const unit: IO<void> = pure(undefined);

export const delay: <A>(thunk: () => A) => IO<A> = thunk => new Delay(thunk);

export const defer: <A>(thunk: () => IO<A>) => IO<A> = thunk =>
  new Defer(thunk);

export const throwError: (error: Error) => IO<never> = error => new Fail(error);

export const currentTimeMillis: IO<number> = CurrentTimeMillis;

export const readExecutionContext: IO<ExecutionContext> = ReadEC;

export const async = <A>(
  k: (cb: (ea: Either<Error, A>) => void) => IO<Option<IO<void>>>,
): IO<A> => new Async(k);

export const async_ = <A>(
  k: (cb: (ea: Either<Error, A>) => void) => IO<void>,
): IO<A> => new Async(resume => defer(() => map_(k(resume), () => None)));

export const never: IO<never> = async(() => pure(None));

export const canceled: IO<void> = Canceled;

export const uncancelable: <A>(ioa: (p: Poll<[URI<IoURI>]>) => IO<A>) => IO<A> =
  ioa => new Uncancelable(ioa);

export const sleep = (ms: number): IO<void> => new Sleep(ms);

export const deferPromise = <A>(thunk: () => Promise<A>): IO<A> =>
  async_(resume =>
    delay(() => {
      const onSuccess: (x: A) => void = flow(Right, resume);
      const onFailure: (e: Error) => void = flow(Left, resume);
      thunk().then(onSuccess, onFailure);
    }),
  );

export const fromPromise = <A>(iop: IO<Promise<A>>): IO<A> =>
  flatMap_(iop, p =>
    async_(resume =>
      delay(() => {
        const onSuccess: (x: A) => void = flow(Right, resume);
        const onFailure: (e: Error) => void = flow(Left, resume);
        p.then(onSuccess, onFailure);
      }),
    ),
  );
