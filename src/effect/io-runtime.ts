import { IO } from './io';
import * as E from '../fp/either';
import { IOFiber } from './io-fiber';

export const unsafeRunToPromise = <A>(ioa: IO<A>): Promise<A> =>
  new Promise((resolve, reject) =>
    unsafeRunAsync_(ioa, E.fold(reject, resolve)),
  );

export const unsafeRunAsync: <A>(
  cb: (ea: E.Either<Error, A>) => void,
) => (ioa: IO<A>) => void = cb => ioa => unsafeRunAsync_(ioa, cb);

export function unsafeRunAsync_<A>(
  ioa: IO<A>,
  cb: (ea: E.Either<Error, A>) => void,
): void {
  new IOFiber(ioa).unsafeRunAsync(cb);
}
