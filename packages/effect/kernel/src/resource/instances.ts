// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

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
  evalF,
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
import { ResourceF } from './resource';

export const resourceApplicative: <F>() => Applicative<$<ResourceF, [F]>> =
  lazyVal(() => Monad.deriveApplicative(resourceMonad()));

export const resourceMonad: <F>() => Monad<$<ResourceF, [F]>> = lazyVal(<F>() =>
  Monad.of<$<ResourceF, [F]>>({
    pure: pure,
    flatMap_: flatMap_,
    tailRecM_: tailRecM_,
  }),
) as <F>() => Monad<$<ResourceF, [F]>>;

export const resourceMonadCancel: <F>(
  F: MonadCancel<F, Error>,
) => MonadCancel<$<ResourceF, [F]>, Error> = F =>
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

export const resourceClock: <F>(F: Clock<F>) => Clock<$<ResourceF, [F]>> = F =>
  Clock.of({
    monotonic: monotonic(F),
    realTime: realTime(F),
    applicative: resourceApplicative(),
  });

export const resourceConcurrent: <F>(
  F: Concurrent<F, Error>,
) => Concurrent<$<ResourceF, [F]>, Error> = F =>
  Concurrent.of({
    ...resourceMonadCancel(F),
    unique: evalF(F.unique),
    ref: ref(F),
    deferred: deferred(F),
    fork: fork(F),
    never: never(F),
    suspend: suspend(F),
    both_: both_(F),
  });

export const resourceTemporal: <F>(
  F: Temporal<F, Error>,
) => Temporal<$<ResourceF, [F]>, Error> = F =>
  Temporal.of({
    ...resourceClock(F),
    ...resourceConcurrent(F),
    sleep: sleep(F),
  });

export const resourceSync: <F>(F: Sync<F>) => Sync<$<ResourceF, [F]>> = (() => {
  const cache = new Map<any, Sync<any>>();
  return <F>(F: Sync<F>) => {
    if (cache.has(F)) {
      return cache.get(F)!;
    }
    const instance = Sync.of({
      ...resourceClock(F),
      ...resourceMonadCancel(F),
      delay: delay(F),
      defer: defer(F),
    });
    cache.set(F, instance);
    return instance;
  };
})();

export const resourceAsync: <F>(F: Async<F>) => Async<$<ResourceF, [F]>> =
  (() => {
    const cache = new Map<any, Async<any>>();
    return <F>(F: Async<F>) => {
      if (cache.has(F)) {
        return cache.get(F)!;
      }
      const instance = Async.of({
        ...resourceSync(F),
        ...resourceTemporal(F),
        never: never(F),
        cont: cont(F),
        readExecutionContext: readExecutionContext(F),
        executeOn_: executeOn_(F),
      });
      cache.set(F, instance);
      return instance;
    };
  })();
