import { flow } from '../../fp/core';
import * as E from '../../fp/either';

import { IO } from './io';
import { IOFiber } from '../io-fiber';
import * as O from '../kernel/outcome';

import { IORuntime } from '../unsafe/io-runtime';

// Point-free definitions

export const unsafeRunToPromise: (
  runtime?: IORuntime,
) => <A>(ioa: IO<A>) => Promise<A> = runtime => ioa =>
  unsafeRunToPromise_(ioa, runtime);

export const unsafeRunAsync: <A>(
  cb: (ea: E.Either<Error, A>) => void,
  runtime?: IORuntime,
) => (ioa: IO<A>) => void = (cb, runtime) => ioa =>
  unsafeRunAsync_(ioa, cb, runtime);

export const unsafeRunAsyncOutcome: <A>(
  cb: (oc: O.Outcome<A>) => void,
  runtime?: IORuntime,
) => (ioa: IO<A>) => void = (cb, runtime) => ioa =>
  unsafeRunAsyncOutcome_(ioa, cb, runtime);

// -- Point-ful definitions

export const unsafeRunToPromise_: <A>(
  ioa: IO<A>,
  runtime?: IORuntime,
) => Promise<A> = (ioa, runtime) =>
  new Promise((resolve, reject) =>
    unsafeRunAsync_(ioa, flow(E.fold(reject, resolve)), runtime),
  );

export const unsafeRunAsync_: <A>(
  ioa: IO<A>,
  cb: (ea: E.Either<Error, A>) => void,
  runtime?: IORuntime,
) => void = (ioa, cb, runtime) =>
  unsafeRunAsyncOutcome_(ioa, flow(O.toEither, cb), runtime);

export const unsafeRunAsyncOutcome_: <A>(
  ioa: IO<A>,
  cb: (oc: O.Outcome<A>) => void,
  runtime?: IORuntime,
) => void = (ioa, cb, runtime = IORuntime.global) => {
  const fiber = new IOFiber(ioa, runtime.executionContext, runtime);
  fiber.onComplete(cb);
  runtime.executionContext.executeAsync(() => fiber.run());
};
