import { $, lazyVal } from '@fp4ts/core';
import { Applicative, Monad } from '@fp4ts/cats';
import { Async } from '../async';
import { Clock } from '../clock';
import { Temporal } from '../temporal';
import { Concurrent } from '../concurrent';
import { Sync } from '../sync';
import { MonadCancel } from '../monad-cancel';
import {
  canceled,
  cont,
  defer,
  deferred,
  delay,
  monotonic,
  never,
  pure,
  readExecutionContext,
  realTime,
  ref,
  sleep,
  suspend,
  tailRecM_,
  throwError,
  uncancelable,
} from './constructors';
import {
  flatMap_,
  handleError_,
  handleErrorWith_,
  onCancel_,
  executeOn_,
  fork,
  finalize_,
  both_,
} from './operators';
import { ResourceK } from './resource';

export const resourceApplicative: <F>() => Applicative<$<ResourceK, [F]>> =
  lazyVal(() => Monad.deriveApplicative(resourceMonad()));

export const resourceMonad: <F>() => Monad<$<ResourceK, [F]>> = lazyVal(() =>
  Monad.of({ pure: pure, flatMap_: flatMap_, tailRecM_: tailRecM_ }),
);

export const resourceMonadCancel: <F>(
  F: MonadCancel<F, Error>,
) => MonadCancel<$<ResourceK, [F]>, Error> = F =>
  MonadCancel.of({
    ...resourceMonad(),
    throwError: throwError(F),
    handleError_: handleError_(F),
    handleErrorWith_: handleErrorWith_(F),
    canceled: canceled(F),
    onCancel_: onCancel_(F),
    uncancelable: uncancelable(F),
    finalize_: finalize_(F),
  });

export const resourceClock: <F>(F: Clock<F>) => Clock<$<ResourceK, [F]>> = F =>
  Clock.of({
    monotonic: monotonic(F),
    realTime: realTime(F),
    applicative: resourceApplicative(),
  });

export const resourceConcurrent: <F>(
  F: Concurrent<F, Error>,
) => Concurrent<$<ResourceK, [F]>, Error> = F =>
  Concurrent.of({
    ...resourceMonadCancel(F),
    ref: ref(F),
    deferred: deferred(F),
    fork: fork(F),
    never: never(F),
    suspend: suspend(F),
    both_: both_(F),
  });

export const resourceTemporal: <F>(
  F: Temporal<F, Error>,
) => Temporal<$<ResourceK, [F]>, Error> = F =>
  Temporal.of({
    ...resourceClock(F),
    ...resourceConcurrent(F),
    sleep: sleep(F),
  });

export const resourceSync: <F>(F: Sync<F>) => Sync<$<ResourceK, [F]>> = F =>
  Sync.of({
    ...resourceClock(F),
    ...resourceMonadCancel(F),
    delay: delay(F),
    defer: defer(F),
  });

export const resourceAsync: <F>(F: Async<F>) => Async<$<ResourceK, [F]>> =
  F => {
    return Async.of({
      ...resourceSync(F),
      ...resourceTemporal(F),
      never: never(F),
      cont: cont(F),
      readExecutionContext: readExecutionContext(F),
      executeOn_: executeOn_(F),
    });
  };
