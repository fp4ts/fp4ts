import { Lazy } from '@cats4ts/core';
import { MonadError } from '@cats4ts/cats-core';
import { Sync } from '@cats4ts/effect-kernel';

import { SyncIoK } from './sync-io';
import { defer, delay, pure, throwError } from './constructors';
import { flatMap_, handleErrorWith_, map_ } from './operators';

export const syncIoMonadError: Lazy<MonadError<SyncIoK, Error>> = () =>
  MonadError.of({
    ap_: (ff, fa) => flatMap_(ff, f => map_(fa, a => f(a))),
    pure: pure,
    throwError: throwError,
    flatMap_: flatMap_,
    handleErrorWith_: handleErrorWith_,
    tailRecM_: null as any,
  });

export const syncIoSync: Lazy<Sync<SyncIoK>> = () => ({
  ...syncIoMonadError(),
  delay: delay,
  defer: defer,
});
