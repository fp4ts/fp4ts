import * as E from '../fp/either';
import { IO } from './io';
import * as O from './outcome';
import { IOFiber } from './io-fiber';
import { flow } from '../fp/core';

export const unsafeRunToPromise = <A>(ioa: IO<A>): Promise<A> =>
  new Promise((resolve, reject) =>
    unsafeRunAsync_(ioa, E.fold(reject, resolve)),
  );

export const unsafeRunAsync: <A>(
  cb: (ea: E.Either<Error, A>) => void,
) => (ioa: IO<A>) => void = cb => ioa => unsafeRunAsync_(ioa, cb);

export const unsafeRunAsyncOutcome: <A>(
  cb: (oc: O.Outcome<A>) => void,
) => (ioa: IO<A>) => void = cb => ioa => unsafeRunAsyncOutcome_(ioa, cb);

export const unsafeRunAsync_: <A>(
  ioa: IO<A>,
  cb: (ea: E.Either<Error, A>) => void,
) => void = (ioa, cb) =>
  unsafeRunAsyncOutcome_(ioa, flow(O.toEither as any, cb));

export const unsafeRunAsyncOutcome_: <A>(
  ioa: IO<A>,
  cb: (oc: O.Outcome<A>) => void,
) => void = (ioa, cb) => new IOFiber(ioa).unsafeRunAsync(cb);
