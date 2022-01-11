// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $ } from '@fp4ts/core';
import { EitherT, EitherTK, Monad, ReaderT } from '@fp4ts/cats';
import { MessageFailure, Request } from '@fp4ts/http-core';

export type DelayedCheck<F, A> = ReaderT<
  $<EitherTK, [F, MessageFailure]>,
  Request<F>,
  A
>;

export const DelayedCheck = Object.freeze({
  withRequest: <F>(
    F: Monad<F>,
  ): (<A>(
    f: (req: Request<F>) => EitherT<F, MessageFailure, A>,
  ) => DelayedCheck<F, A>) => {
    const RF = EitherT.Monad<F, MessageFailure>(F);
    return <A>(
      f: (req: Request<F>) => EitherT<F, MessageFailure, A>,
    ): DelayedCheck<F, A> =>
      ReaderT.ask<$<EitherTK, [F, MessageFailure]>, Request<F>>(RF).flatMapF(
        RF,
      )(x => f(x));
  },
});
