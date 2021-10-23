import { $ } from '@cats4ts/core';
import { Async } from '../async';
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
  map_,
  onCancel_,
  executeOn_,
  fork,
  finalize_,
  both_,
} from './operators';
import { ResourceK } from './resource';

export const resourceMonadCancel: <F>(
  F: MonadCancel<F, Error>,
) => MonadCancel<$<ResourceK, [F]>, Error> = F =>
  MonadCancel.of({
    ap_: (ff, fa) => flatMap_(ff, f => map_(fa, a => f(a))),
    pure: pure,
    flatMap_: flatMap_,
    tailRecM_: tailRecM_,
    throwError: throwError(F),
    handleError_: handleError_(F),
    handleErrorWith_: handleErrorWith_(F),
    canceled: canceled(F),
    onCancel_: onCancel_(F),
    uncancelable: uncancelable(F),
    finalize_: finalize_(F),
  });

export const resourceAsync: <F>(F: Async<F>) => Async<$<ResourceK, [F]>> =
  F => {
    const monadCancel = resourceMonadCancel(F);
    return Async.of({
      ...monadCancel,
      applicative: monadCancel,
      delay: delay(F),
      defer: defer(F),
      suspend: suspend(F),
      never: never(F),
      ref: ref(F),
      deferred: deferred(F),
      monotonic: monotonic(F),
      realTime: realTime(F),
      sleep: sleep(F),
      cont: cont(F),
      readExecutionContext: readExecutionContext(F),
      executeOn_: executeOn_(F),
      fork: fork(F),
      both_: both_(F),
    });
  };
