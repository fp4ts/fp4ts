// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, lazyVal } from '@fp4ts/core';
import {
  Align,
  Defer,
  Functor,
  FunctorFilter,
  Monad,
  MonadError,
  MonoidK,
} from '@fp4ts/cats';

import { StreamF } from './stream';
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

export const streamMonoidK: <F>() => MonoidK<$<StreamF, [F]>> = lazyVal(() =>
  MonoidK.of({ combineK_: (xs, ys) => concat_(xs, ys), emptyK: empty }),
);

export const streamDefer: <F>() => Defer<$<StreamF, [F]>> = lazyVal(() =>
  Defer.of({ defer: defer }),
);

export const streamFunctor: <F>() => Functor<$<StreamF, [F]>> = lazyVal(() =>
  Functor.of({ map_: map_ }),
);

export const streamAlign: <F>() => Align<$<StreamF, [F]>> = lazyVal(() =>
  Align.of({ ...streamFunctor(), align_: align_ }),
);

export const streamFunctorFilter: <F>() => FunctorFilter<$<StreamF, [F]>> =
  lazyVal(() =>
    FunctorFilter.of({
      ...streamFunctor(),
      mapFilter_: collect_,
      collect_: collect_,
    }),
  );

export const streamMonad: <F>() => Monad<$<StreamF, [F]>> = lazyVal(() =>
  Monad.of({
    ...streamFunctor(),
    pure: pure,
    flatMap_: flatMap_,
    flatten: flatten,
    tailRecM_: tailRecM_,
  }),
);

export const streamMonadError: <F>() => MonadError<$<StreamF, [F]>, Error> =
  lazyVal(() =>
    MonadError.of({
      ...streamMonad(),
      throwError: throwError,
      handleErrorWith_: handleErrorWith_,
      attempt: attempt,
      redeemWith_: redeemWith_,
      rethrow: rethrow,
    }),
  );
