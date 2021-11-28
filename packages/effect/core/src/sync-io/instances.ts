// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Lazy, lazyVal } from '@fp4ts/core';
import {
  Applicative,
  Apply,
  Defer,
  FlatMap,
  Functor,
  Monad,
  MonadError,
} from '@fp4ts/cats';
import { Clock, Sync, MonadCancel } from '@fp4ts/effect-kernel';

import { SyncIO, SyncIoK } from './sync-io';
import { defer, delay, pure, throwError } from './constructors';
import { flatMap_, handleErrorWith_, map_, tailRecM_ } from './operators';

export const syncIoDefer: Lazy<Defer<SyncIoK>> = lazyVal(() =>
  Defer.of({ defer }),
);

export const syncIoFunctor: Lazy<Functor<SyncIoK>> = lazyVal(() =>
  Functor.of({ map_: map_ }),
);

export const syncIoApply: Lazy<Apply<SyncIoK>> = lazyVal(() =>
  Apply.of({
    ...syncIoFunctor(),
    ap_: (ff, fa) => flatMap_(ff, f => map_(fa, a => f(a))),
  }),
);

export const syncIoApplicative: Lazy<Applicative<SyncIoK>> = lazyVal(() =>
  Applicative.of({
    ...syncIoFunctor(),
    ...syncIoApply(),
    pure: pure,
  }),
);

export const syncIoFlatMap: Lazy<FlatMap<SyncIoK>> = lazyVal(() =>
  FlatMap.of({
    ...syncIoApply(),
    flatMap_: flatMap_,
    tailRecM_: tailRecM_,
  }),
);

export const syncIoMonad: Lazy<Monad<SyncIoK>> = lazyVal(() =>
  Monad.of({ ...syncIoApplicative(), ...syncIoFlatMap() }),
);

export const syncIoMonadError: Lazy<MonadError<SyncIoK, Error>> = lazyVal(() =>
  MonadError.of({
    ...syncIoMonad(),
    throwError: throwError,
    handleErrorWith_: handleErrorWith_,
  }),
);

export const syncIoSync: Lazy<Sync<SyncIoK>> = lazyVal(() =>
  Sync.of({
    ...MonadCancel.Uncancelable(syncIoMonadError()),
    ...Clock.of({
      applicative: syncIoApplicative(),
      monotonic: SyncIO(() => process.hrtime()[0]),
      realTime: SyncIO(() => Date.now()),
    }),
    ...syncIoDefer(),
    delay: delay,
  }),
);
