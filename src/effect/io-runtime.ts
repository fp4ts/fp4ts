import * as E from '../fp/either';
import * as IO from './io';
import * as O from './outcome';
import { IOFiber } from './io-fiber';
import { flow, pipe } from '../fp/core';

import { GlobalExecutionContext } from './execution-context';

export const unsafeRunToPromise = <A>(ioa: IO.IO<A>): Promise<A> =>
  new Promise((resolve, reject) =>
    unsafeRunAsync_(ioa, E.fold(reject, resolve)),
  );

export const unsafeRunAsync: <A>(
  cb: (ea: E.Either<Error, A>) => void,
) => (ioa: IO.IO<A>) => void = cb => ioa => unsafeRunAsync_(ioa, cb);

export const unsafeRunAsyncOutcome: <A>(
  cb: (oc: O.Outcome<A>) => void,
) => (ioa: IO.IO<A>) => void = cb => ioa => unsafeRunAsyncOutcome_(ioa, cb);

export const unsafeRunAsync_: <A>(
  ioa: IO.IO<A>,
  cb: (ea: E.Either<Error, A>) => void,
) => void = (ioa, cb) =>
  unsafeRunAsyncOutcome_(ioa, flow(O.toEither as any, cb));

export const unsafeRunAsyncOutcome_: <A>(
  ioa: IO.IO<A>,
  cb: (oc: O.Outcome<A>) => void,
) => void = (ioa, cb) => {
  const fiber = new IOFiber(ioa, GlobalExecutionContext);
  fiber.onComplete(cb);
  GlobalExecutionContext.executeFiber(fiber);
};

export const listenForSignal = (s: string): IO.IO<void> =>
  IO.async(resume =>
    IO.delay(() => {
      const listener = () => resume(E.rightUnit);
      process.on(s, listener);
      return IO.delay(() => process.removeListener(s, listener));
    }),
  );

export const Signal = Object.freeze({
  SIGTERM: listenForSignal('SIGTERM'),
  SIGINT: listenForSignal('SIGINT'),
});

export const unsafeRunMain = (ioa: IO.IO<unknown>): void => {
  const onCancel = () => IO.delay(() => process.exit(2));
  const onFailure = (e: Error) =>
    IO.delay(() => {
      console.error(e);
      process.exit(1);
    });
  const onSuccess = () => IO.delay(() => process.exit(0));

  return pipe(
    ioa,
    IO.race(IO.race_(Signal.SIGTERM, Signal.SIGINT)),
    IO.finalize(O.fold(onCancel, onFailure, E.fold(onSuccess, onCancel))),
    unsafeRunAsync(() => {}),
  );
};
