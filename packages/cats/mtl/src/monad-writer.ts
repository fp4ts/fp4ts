// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, instance } from '@fp4ts/core';
import { Monoid } from '@fp4ts/cats-kernel';
import { Monad, MonadRequirements } from '@fp4ts/cats-core';
import { Chain, XPure, XPureF } from '@fp4ts/cats-core/lib/data';
import { Censor, CensorRequirements } from './censor';

export interface MonadWriter<F, W> extends Monad<F>, Censor<F, W> {}

export type MonadWriterRequirements<F, W> = CensorRequirements<F, W> &
  MonadRequirements<F> &
  Partial<MonadWriter<F, W>>;
export const MonadWriter = Object.freeze({
  of: <F, W>(F: MonadWriterRequirements<F, W>): MonadWriter<F, W> => {
    const M = Monad.of(F);
    return instance<MonadWriter<F, W>>({
      ...Censor.of({ ...M, ...F }),
      ...M,
      ...F,
    });
  },

  XPure: <W, S, R, E>(
    W: Monoid<W>,
  ): MonadWriter<$<XPureF, [W, S, S, R, E]>, W> =>
    MonadWriter.of({
      monoid: W,
      ...XPure.Monad<W, S, R, E>(),

      censor_: (fa, f) =>
        fa.mapWritten(chain =>
          Chain(f(chain.foldLeft(W.empty, (b, a) => W.combine_(a, () => b)))),
        ),
      listen: fa => fa.listen(W),
      tell: w => XPure.tell(w),
    }),
});
