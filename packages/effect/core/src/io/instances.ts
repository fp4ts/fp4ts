import { Lazy, lazyVal } from '@cats4ts/core';
import {
  Functor,
  Apply,
  Monad,
  FlatMap,
  Applicative,
  MonadError,
  Defer,
  Parallel,
} from '@cats4ts/cats';
import {
  Async,
  Concurrent,
  MonadCancel,
  Spawn,
  Sync,
  Temporal,
  Clock,
} from '@cats4ts/effect-kernel';
import { Ref } from '@cats4ts/effect-kernel/lib/ref';
import { Deferred } from '@cats4ts/effect-kernel/lib/deferred';

import {
  async,
  async_,
  canceled,
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
  map2_,
  map_,
  onCancel,
  onCancel_,
  onError_,
  parSequence,
  parSequenceN,
  parSequenceN_,
  parTraverse,
  parTraverseN,
  parTraverseN_,
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

export const ioParallelApply: Lazy<Apply<IoK>> = lazyVal(() =>
  Apply.of({
    ...ioFunctor(),
    ap_: (ff, fa) => map2_(ff, fa, (f, a) => f(a)),
    map2_:
      <A, B>(fa: IO<A>, fb: IO<B>) =>
      <C>(f: (a: A, b: B) => C) =>
        map2_(fa, fb, f),
  }),
);

export const ioParallelApplicative: Lazy<Applicative<IoK>> = lazyVal(() =>
  Applicative.of({
    ...ioParallelApply(),
    pure: pure,
    unit,
  }),
);

export const ioSequentialApply: Lazy<Apply<IoK>> = lazyVal(() =>
  Apply.of({
    ...ioFunctor(),
    ap_: (ff, fa) => flatMap_(ff, f => map_(fa, a => f(a))),
  }),
);

export const ioSequentialApplicative: Lazy<Applicative<IoK>> = lazyVal(() =>
  Applicative.of({
    ...ioSequentialApply(),
    pure: pure,
    unit,
  }),
);

export const ioFlatMap: Lazy<FlatMap<IoK>> = lazyVal(() =>
  FlatMap.of({
    ...ioSequentialApply(),
    flatMap_: flatMap_,
    flatTap_: flatTap_,
    flatten: flatten,
    tailRecM_: tailRecM_,
  }),
);

export const ioMonad: Lazy<Monad<IoK>> = lazyVal(() =>
  Monad.of({
    ...ioSequentialApplicative(),
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
      applicative: ioSequentialApplicative(),
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

export const ioTemporal: Lazy<Temporal<IoK, Error>> = lazyVal(() => ({
  ...ioConcurrent(),
  ...Clock.of({
    applicative: ioSequentialApplicative(),
    monotonic: delay(() => process.hrtime()[0]),
    realTime: delay(() => Date.now()),
  }),
  sleep: sleep,
  delayBy: delayBy_,
  timeoutTo: timeoutTo_,
  timeout: timeout_,
}));

export const ioAsync: Lazy<Async<IoK>> = lazyVal(() => ({
  ...ioSync(),
  ...ioTemporal(),
  async: async,
  async_: async_,
  never: never,
  readExecutionContext: readExecutionContext,
  executeOn: executeOn_,
  fromPromise: fromPromise,
}));
