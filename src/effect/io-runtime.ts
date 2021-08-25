import * as E from '../fp/either';
import * as O from './outcome';
import { IO } from './io';
import { IOFiber } from './io-fiber';
import { flow, pipe } from '../fp/core';

import { ExecutionContext, GlobalExecutionContext } from './execution-context';

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

export const unsafeRunToPromise_ = <A>(
  ioa: IO<A>,
  ec?: ExecutionContext,
): Promise<A> =>
  new Promise((resolve, reject) =>
    unsafeRunAsync_(ioa, E.fold(reject, resolve), ec),
  );

export const unsafeRunOutcomeToPromise_ = <A>(
  ioa: IO<A>,
  ec?: ExecutionContext,
): Promise<O.Outcome<A>> =>
  new Promise(resolve => unsafeRunAsyncOutcome_(ioa, resolve, ec));

export const unsafeRunAsync_: <A>(
  ioa: IO<A>,
  cb: (ea: E.Either<Error, A>) => void,
  ec?: ExecutionContext,
) => void = (ioa, cb, ec) =>
  unsafeRunAsyncOutcome_(ioa, flow(O.toEither, cb), ec);

export const unsafeRunAsyncOutcome_: <A>(
  ioa: IO<A>,
  cb: (oc: O.Outcome<A>) => void,
  ec?: ExecutionContext,
) => void = (ioa, cb, ec = GlobalExecutionContext) => {
  const fiber = new IOFiber(ioa, ec);
  fiber.onComplete(cb);
  ec.executeAsync(() => fiber.run());
};

export const listenForSignal = (s: string): IO<void> =>
  IO.async(resume =>
    IO(() => {
      const listener = () => resume(E.rightUnit);
      const removeListener = () => {
        process.removeListener(s, listener);
      };

      process.on(s, listener);
      return IO(removeListener);
    }),
  );

export const Signal = Object.freeze({
  SIGTERM: listenForSignal('SIGTERM'),
  SIGINT: listenForSignal('SIGINT'),
});

export const unsafeRunMain = (ioa: IO<unknown>): void => {
  const onCancel = () => IO(() => process.exit(2));
  const onFailure = () => IO(() => process.exit(1));
  const onSuccess = () => IO(() => process.exit(0));

  return pipe(
    ioa
      .race(IO.race(Signal.SIGTERM, Signal.SIGINT))
      .finalize(O.fold(onCancel, onFailure, E.fold(onSuccess, onCancel))),
    unsafeRunAsync(() => {}),
  );
};
