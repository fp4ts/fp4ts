import { Lazy } from '@cats4ts/core';
import {
  Applicative,
  Apply,
  Defer,
  FlatMap,
  Functor,
  Monad,
  MonadError,
} from '@cats4ts/cats-core';
import { Sync } from '@cats4ts/effect-kernel';

import { SyncIoK } from './sync-io';
import { defer, delay, pure, throwError } from './constructors';
import { flatMap_, handleErrorWith_, map_ } from './operators';

export const syncIoDefer: Lazy<Defer<SyncIoK>> = () => Defer.of({ defer });

export const syncIoFunctor: Lazy<Functor<SyncIoK>> = () =>
  Functor.of({ map_: map_ });

export const syncIoApply: Lazy<Apply<SyncIoK>> = () =>
  Apply.of({
    ...syncIoFunctor(),
    ap_: (ff, fa) => flatMap_(ff, f => map_(fa, a => f(a))),
  });

export const syncIoApplicative: Lazy<Applicative<SyncIoK>> = () =>
  Applicative.of({
    ...syncIoFunctor(),
    ...syncIoApply(),
    pure: pure,
  });

export const syncIoFlatMap: Lazy<FlatMap<SyncIoK>> = () =>
  FlatMap.of({
    ...syncIoApply(),
    flatMap_: flatMap_,
    tailRecM_: null as any,
  });

export const syncIoMonad: Lazy<Monad<SyncIoK>> = () =>
  Monad.of({ ...syncIoApplicative(), ...syncIoFlatMap() });

export const syncIoMonadError: Lazy<MonadError<SyncIoK, Error>> = () =>
  MonadError.of({
    ...syncIoMonad(),
    throwError: throwError,
    handleErrorWith_: handleErrorWith_,
  });

export const syncIoSync: Lazy<Sync<SyncIoK>> = () => ({
  ...syncIoMonadError(),
  ...syncIoDefer(),
  delay: delay,
});
