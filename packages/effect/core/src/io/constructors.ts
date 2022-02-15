// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { flow, Kind } from '@fp4ts/core';
import { Either, Left, None, Option, Right, FunctionK } from '@fp4ts/cats';
import {
  ExecutionContext,
  Poll,
  MonadCancel,
  Cont,
} from '@fp4ts/effect-kernel';

import {
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
  IOCont,
  Suspend,
  CurrentTimeMicros,
} from './algebra';
import { flatMap_, map_ } from './operators';
import type { IOF } from './io';
import { Tracing } from '../tracing';

export const pure: <A>(a: A) => IO<A> = value =>
  new Pure(value, Tracing.buildEvent());

export const unit: IO<void> = pure(undefined);

export function delay<A>(thunk: () => A): IO<A> {
  return new Delay(thunk, Tracing.buildEvent());
}

export const defer: <A>(thunk: () => IO<A>) => IO<A> = thunk =>
  new Defer(thunk, Tracing.buildEvent());

export const throwError: (error: Error) => IO<never> = error => new Fail(error);

export const currentTimeMicros: IO<number> = CurrentTimeMicros;

export const currentTimeMillis: IO<number> = CurrentTimeMillis;

export const readExecutionContext: IO<ExecutionContext> = ReadEC;

export const async = <A>(
  k: (cb: (ea: Either<Error, A>) => void) => IO<Option<IO<void>>>,
): IO<A> =>
  new IOCont(
    <G>(G: MonadCancel<G, Error>) =>
      (resume, get: Kind<G, [A]>, lift: FunctionK<IOF, G>) =>
        G.uncancelable(poll =>
          G.flatMap_(lift(k(resume)), opt =>
            opt.fold(
              () => poll(get),
              fin => G.onCancel_(poll(get), lift(fin)),
            ),
          ),
        ),
    Tracing.buildEvent(),
  );

export const async_ = <A>(
  k: (cb: (ea: Either<Error, A>) => void) => void,
): IO<A> =>
  async<A>(cb =>
    map_(
      delay(() => k(cb)),
      () => None,
    ),
  );

export const never: IO<never> = async(() => pure(None));

export const canceled: IO<void> = Canceled;

export const suspend: IO<void> = Suspend;

export const uncancelable: <A>(ioa: (p: Poll<IOF>) => IO<A>) => IO<A> = ioa =>
  new Uncancelable(ioa, Tracing.buildEvent());

export const sleep = (ms: number): IO<void> => new Sleep(ms);

export const deferPromise = <A>(thunk: () => Promise<A>): IO<A> =>
  fromPromise(defer(() => pure(thunk())));

export const fromEither = <A>(ea: Either<Error, A>): IO<A> =>
  ea.fold(throwError, pure);

export const fromPromise = <A>(iop: IO<Promise<A>>): IO<A> =>
  flatMap_(iop, p =>
    async(resume =>
      delay(() => {
        const onSuccess: (x: A) => void = flow(Right, resume);
        const onFailure: (e: Error) => void = flow(Left, resume);
        p.then(onSuccess, onFailure);
        return None;
      }),
    ),
  );

export const cont = <K, R>(body: Cont<IOF, K, R>): IO<R> => new IOCont(body);
