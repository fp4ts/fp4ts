// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, F1, instance } from '@fp4ts/core';
import {
  EitherT,
  EitherTF,
  Kleisli,
  KleisliF,
  Monad,
  MonadRequirements,
  OptionT,
  OptionTF,
  Right,
  Some,
} from '@fp4ts/cats';
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

  Kleisli: <F, R, W>(
    F: MonadWriter<F, W>,
  ): MonadWriter<$<KleisliF, [F, R]>, W> =>
    MonadWriter.of<$<KleisliF, [F, R]>, W>({
      monoid: F.monoid,
      ...Kleisli.Monad<F, R>(F),
      censor_: (fa, f) => F1.andThen(fa, F.censor(f)),
      listen: fa => F1.andThen(fa, F.listen),
      tell: w => Kleisli(() => F.tell(w)),
    }),

  EitherT: <F, E, W>(
    F: MonadWriter<F, W>,
  ): MonadWriter<$<EitherTF, [F, E]>, W> =>
    MonadWriter.of<$<EitherTF, [F, E]>, W>({
      monoid: F.monoid,
      ...EitherT.Monad<F, E>(F),
      censor_: F.censor_,
      listen: fa => F.map_(F.listen(fa), ([ea, w]) => ea.map(a => [a, w])),
      tell: w => F.map_(F.tell(w), Right),
    }),

  OptionT: <F, W>(F: MonadWriter<F, W>): MonadWriter<$<OptionTF, [F]>, W> =>
    MonadWriter.of<$<OptionTF, [F]>, W>({
      monoid: F.monoid,
      ...OptionT.Monad<F>(F),
      censor_: F.censor_,
      listen: fa => F.map_(F.listen(fa), ([opt, w]) => opt.map(a => [a, w])),
      tell: w => F.map_(F.tell(w), Some),
    }),
});
