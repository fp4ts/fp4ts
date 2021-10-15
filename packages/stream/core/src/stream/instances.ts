import { $ } from '@cats4ts/core';
import {
  Align,
  Defer,
  Functor,
  FunctorFilter,
  Monad,
  MonadError,
  MonoidK,
} from '@cats4ts/cats';

import { StreamK } from './stream';
import {
  align_,
  attempt,
  collect_,
  concat_,
  flatMap_,
  flatten,
  handleErrorWith_,
  map_,
  redeemWith_,
  rethrow,
} from './operators';
import { defer, empty, pure, tailRecM_, throwError } from './constructors';

export const streamMonoidK: <F>() => MonoidK<$<StreamK, [F]>> = () =>
  MonoidK.of({ combineK_: (xs, ys) => concat_(xs, ys()), emptyK: empty });

export const streamDefer: <F>() => Defer<$<StreamK, [F]>> = () =>
  Defer.of({ defer: defer });

export const streamFunctor: <F>() => Functor<$<StreamK, [F]>> = () =>
  Functor.of({ map_: map_ });

export const streamAlign: <F>() => Align<$<StreamK, [F]>> = () =>
  Align.of({ functor: streamFunctor(), align_: align_ });

export const streamFunctorFilter: <F>() => FunctorFilter<$<StreamK, [F]>> =
  () =>
    FunctorFilter.of({
      ...streamFunctor(),
      mapFilter_: collect_,
      collect_: collect_,
    });

export const streamMonad: <F>() => Monad<$<StreamK, [F]>> = () =>
  Monad.of({
    ...streamFunctor(),
    pure: pure,
    flatMap_: flatMap_,
    flatten: flatten,
    tailRecM_: tailRecM_,
  });

export const streamMonadError: <F>() => MonadError<$<StreamK, [F]>, Error> =
  () =>
    MonadError.of({
      ...streamMonad(),
      throwError: throwError,
      handleErrorWith_: handleErrorWith_,
      attempt: attempt,
      redeemWith_: redeemWith_,
      rethrow: rethrow,
    });
