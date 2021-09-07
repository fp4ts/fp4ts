import {
  Functor,
  Apply,
  Monad,
  FlatMap,
  Applicative,
  MonadError,
  Defer,
} from '../../cats';
import { Lazy } from '../../fp/core';
import { Async } from '../kernel/async';
import { Concurrent } from '../kernel/concurrent';
import { MonadCancel } from '../kernel/monad-cancel';
import { Spawn } from '../kernel/spawn';
import { Sync } from '../kernel/sync';
import { Temporal } from '../kernel/temporal';

import { URI } from './algebra';
import {
  async,
  async_,
  defer,
  delay,
  fromPromise,
  never,
  pure,
  sleep,
  throwError,
  uncancelable,
  unit,
} from './constructors';
import {
  attempt,
  bothOutcome_,
  both_,
  bracketFull,
  bracketOutcome_,
  bracket_,
  delayBy_,
  executeOn_,
  finalize,
  flatMap,
  flatMap_,
  flatTap,
  flatten,
  fork,
  handleError,
  handleErrorWith,
  map,
  map2_,
  map_,
  onCancel,
  onError,
  parSequence,
  parSequenceN,
  parTraverse,
  parTraverseN,
  raceOutcome_,
  racePair_,
  race_,
  redeem,
  redeemWith,
  tap,
  timeoutTo_,
  timeout_,
} from './operators';

export const ioDefer: Lazy<Defer<URI>> = () => ({
  URI: URI,
  defer: defer,
});

export const ioFunctor: Lazy<Functor<URI>> = () => ({
  URI: URI,
  map: map,
  tap: tap,
});

export const ioParallelApply: Lazy<Apply<URI>> = () => ({
  ...ioFunctor(),
  ap: ff => fa => map2_(ff, fa, (f, a) => f(a)),
  map2: (fa, fb) => f => map2_(fa, fb, f),
  product: (fa, fb) => map2_(fa, fb, (a, b) => [a, b]),
  productL: (fa, fb) => map2_(fa, fb, a => a),
  productR: (fa, fb) => map2_(fa, fb, (_, b) => b),
});

export const ioParallelApplicative: Lazy<Applicative<URI>> = () => ({
  ...ioParallelApply(),
  pure: pure,
  unit: unit,
});

export const ioSequentialApply: Lazy<Apply<URI>> = () => ({
  ...ioFunctor(),
  ap: ff => fa => flatMap_(ff, f => map_(fa, a => f(a))),
  map2: (fa, fb) => f => flatMap_(fa, a => map_(fb, b => f(a, b))),
  product: (fa, fb) => flatMap_(fa, a => map_(fb, b => [a, b])),
  productL: (fa, fb) => flatMap_(fa, a => map_(fb, () => a)),
  productR: (fa, fb) => flatMap_(fa, () => fb),
});

export const ioSequentialApplicative: Lazy<Applicative<URI>> = () => ({
  ...ioSequentialApply(),
  pure: pure,
  unit: unit,
});

export const ioFlatMap: Lazy<FlatMap<URI>> = () => ({
  ...ioSequentialApply(),
  flatMap: flatMap,
  flatTap: flatTap,
  flatten: flatten,
});

export const ioMonad: Lazy<Monad<URI>> = () => ({
  ...ioSequentialApplicative(),
  ...ioFlatMap(),
});

export const ioMonadError: Lazy<MonadError<URI, Error>> = () => ({
  ...ioMonad(),
  throwError: throwError,
  handleError: handleError,
  handleErrorWith: handleErrorWith,
  attempt: attempt,
  onError: onError,
  redeem: redeem,
  redeemWith: redeemWith,
});

export const ioMonadCancel: Lazy<MonadCancel<URI, Error>> = () => ({
  ...ioMonadError(),
  uncancelable: uncancelable,
  onCancel: onCancel,
  finalize: finalize,
  bracket: fa => use => release => bracket_(fa, use, release),
  bracketOutcome: fa => use => release => bracketOutcome_(fa, use, release),
  bracketFull: acquire => use => release => bracketFull(acquire, use, release),
});

export const ioSync: Lazy<Sync<URI>> = () => ({
  ...ioMonadError(),
  ...ioDefer(),
  delay: delay,
});

export const ioSpawn: Lazy<Spawn<URI, Error>> = () => ({
  ...ioMonadCancel(),
  applicative: ioParallelApplicative(),
  fork: fork,
  never: never,
  suspend: null as any,
  racePair: racePair_,
  raceOutcome: raceOutcome_,
  race: race_,
  both: both_,
  bothOutcome: bothOutcome_,
});

export const ioConcurrent: Lazy<Concurrent<URI, Error>> = () => ({
  ...ioSpawn(),
  parTraverse: parTraverse,
  parSequence: parSequence,

  parTraverseN: parTraverseN,
  parSequenceN: parSequenceN,
});

export const ioTemporal: Lazy<Temporal<URI, Error>> = () => ({
  ...ioConcurrent(),
  sleep: sleep,
  delayBy: delayBy_,
  timeoutTo: timeoutTo_,
  timeout: timeout_,
});

export const ioAsync: Lazy<Async<URI>> = () => ({
  ...ioSync(),
  ...ioTemporal(),
  async: async,
  async_: async_,
  never: never,
  executeOn: executeOn_,
  fromPromise: fromPromise,
});
