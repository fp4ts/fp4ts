import { Lazy, lazyVal } from '@fp4ts/core';
import {
  Functor,
  Apply,
  Monad,
  FlatMap,
  Applicative,
  MonadError,
  Defer,
  Parallel,
} from '@fp4ts/cats';
import {
  Async,
  Concurrent,
  MonadCancel,
  Spawn,
  Sync,
  Temporal,
  Clock,
} from '@fp4ts/effect-kernel';
import { Ref } from '@fp4ts/effect-kernel/lib/ref';
import { Deferred } from '@fp4ts/effect-kernel/lib/deferred';

import {
  async,
  async_,
  canceled,
  cont,
  currentTimeMicros,
  currentTimeMillis,
  defer,
  delay,
  fromPromise,
  never,
  pure,
  readExecutionContext,
  sleep,
  suspend,
  throwError,
  uncancelable,
  unit,
} from './constructors';
import {
  attempt,
  bracket,
  bracketFull,
  bracketOutcome,
  bracketOutcome_,
  bracket_,
  delayBy_,
  executeOn_,
  finalize,
  finalize_,
  flatMap_,
  flatTap_,
  flatten,
  fork,
  handleErrorWith_,
  handleError_,
  map_,
  onCancel,
  onCancel_,
  onError_,
  racePair_,
  redeemWith_,
  redeem_,
  tailRecM_,
  tap_,
  timeoutTo_,
  timeout_,
} from './operators';
import type { IO, IoK } from './io';

export const ioDefer: Lazy<Defer<IoK>> = lazyVal(() => Defer.of({ defer }));

export const ioFunctor: Lazy<Functor<IoK>> = lazyVal(() =>
  Functor.of({ map_, tap_ }),
);

export const ioApply: Lazy<Apply<IoK>> = lazyVal(() =>
  Apply.of({
    ...ioFunctor(),
    ap_: (ff, fa) => flatMap_(ff, f => map_(fa, a => f(a))),
  }),
);

export const ioApplicative: Lazy<Applicative<IoK>> = lazyVal(() =>
  Applicative.of({
    ...ioApply(),
    pure: pure,
    unit,
  }),
);

export const ioFlatMap: Lazy<FlatMap<IoK>> = lazyVal(() =>
  FlatMap.of({
    ...ioApply(),
    flatMap_: flatMap_,
    flatTap_: flatTap_,
    flatten: flatten,
    tailRecM_: tailRecM_,
  }),
);

export const ioMonad: Lazy<Monad<IoK>> = lazyVal(() =>
  Monad.of({
    ...ioApplicative(),
    ...ioFlatMap(),
  }),
);

export const ioMonadError: Lazy<MonadError<IoK, Error>> = lazyVal(() =>
  MonadError.of({
    ...ioMonad(),
    throwError: throwError,
    handleError_: handleError_,
    handleErrorWith_: handleErrorWith_,
    attempt: attempt,
    onError_: onError_,
    redeem_: redeem_,
    redeemWith_: redeemWith_,
  }),
);

export const ioMonadCancel: Lazy<MonadCancel<IoK, Error>> = lazyVal(() =>
  MonadCancel.of({
    ...ioMonadError(),
    canceled: canceled,
    uncancelable: uncancelable,
    onCancel: onCancel,
    onCancel_: onCancel_,
    finalize: finalize,
    finalize_: finalize_,
    bracket: bracket,
    bracket_: bracket_,
    bracketOutcome: bracketOutcome,
    bracketOutcome_: bracketOutcome_,
    bracketFull: bracketFull,
  }),
);

export const ioSync: Lazy<Sync<IoK>> = lazyVal(() =>
  Sync.of({
    ...ioMonadCancel(),
    ...Clock.of({
      applicative: ioApplicative(),
      monotonic: delay(() => process.hrtime()[0]),
      realTime: delay(() => Date.now()),
    }),
    ...ioDefer(),
    delay: delay,
  }),
);

export const ioSpawn: Lazy<Spawn<IoK, Error>> = lazyVal(() =>
  Spawn.of({
    ...ioMonadCancel(),
    fork: fork,
    never: never,
    suspend: suspend,
    racePair_: racePair_,
  }),
);

export const ioParallel: Lazy<Parallel<IoK, IoK>> = lazyVal(() =>
  Spawn.parallelForSpawn(ioSpawn()),
);

export const ioConcurrent: Lazy<Concurrent<IoK, Error>> = lazyVal(() =>
  Concurrent.of({
    ...ioSpawn(),
    ref: a => Ref.of(ioAsync())(a),
    deferred: <A>() => Deferred.of(ioAsync())<A>(),
  }),
);

export const ioTemporal: Lazy<Temporal<IoK, Error>> = lazyVal(() =>
  Temporal.of({
    ...ioConcurrent(),
    ...Clock.of({
      applicative: ioApplicative(),
      monotonic: currentTimeMicros,
      realTime: currentTimeMillis,
    }),
    sleep: sleep,
    delayBy_: delayBy_,
    timeoutTo_: timeoutTo_,
    timeout_: timeout_,
  }),
);

export const ioAsync: Lazy<Async<IoK>> = lazyVal(() =>
  Async.of({
    ...ioSync(),
    ...ioTemporal(),
    async,
    async_,
    never,
    readExecutionContext,
    executeOn_,
    fromPromise,
    cont: cont,
  }),
);
