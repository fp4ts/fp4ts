// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, instance } from '@fp4ts/core';
import { Monoid } from '@fp4ts/cats-kernel';
import { Monad, MonadRequirements } from '@fp4ts/cats-core';
import {
  Chain,
  EitherT,
  EitherTF,
  IndexedReaderWriterStateT as RWST,
  IndexedReaderWriterStateTF as RWSTF,
  Kleisli,
  KleisliF,
  Left,
  None,
  OptionT,
  OptionTF,
  Right,
  Some,
  WriterF,
  WriterT,
  WriterTF,
  XPure,
  XPureF,
} from '@fp4ts/cats-core/lib/data';
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

      censor_: (fa, f) => fa.censor(chain => Chain(f(chain.folding(W)))),
      listen: fa => fa.listen(W),
      tell: w => XPure.tell(w),
    }),

  RWST: <F, W, S, R>(
    F: Monad<F>,
    W: Monoid<W>,
  ): MonadWriter<$<RWSTF, [F, W, S, S, R]>, W> =>
    MonadWriter.of<$<RWSTF, [F, W, S, S, R]>, W>({
      monoid: W,
      ...RWST.Monad(F),
      censor_: (fa, f) => fa.censor(F)(chain => Chain(f(chain.folding(W)))),
      listen: fa => fa.listen(F, W),
      tell: RWST.tell(F),
    }),

  WriterT: <F, L>(
    F: Monad<F>,
    L: Monoid<L>,
  ): MonadWriter<$<WriterTF, [F, L]>, L> =>
    MonadWriter.of({
      monoid: L,
      ...WriterT.Monad(F, L),

      censor_: (fa, f) => fa.mapWritten(F)(f),
      listen: fa => fa.listen(F),
      tell: WriterT.tell(F),
    }),

  Writer: <L>(L: Monoid<L>): MonadWriter<WriterF<L>, L> => MonadWriter.XPure(L),

  Kleisli: <F, R, W>(
    F: MonadWriter<F, W>,
  ): MonadWriter<$<KleisliF, [F, R]>, W> =>
    MonadWriter.of<$<KleisliF, [F, R]>, W>({
      monoid: F.monoid,
      ...Kleisli.Monad<F, R>(F),
      censor_: (fa, f) => Kleisli(r => F.censor_(fa.run(r), f)),
      listen: fa => Kleisli(r => F.listen(fa.run(r))),
      tell: w => Kleisli(() => F.tell(w)),
    }),

  EitherT: <F, E, W>(
    F: MonadWriter<F, W>,
  ): MonadWriter<$<EitherTF, [F, E]>, W> =>
    MonadWriter.of<$<EitherTF, [F, E]>, W>({
      monoid: F.monoid,
      ...EitherT.Monad<F, E>(F),
      censor_: (fa, f) =>
        EitherT(
          F.flatMap_(fa.value, ea =>
            ea.fold(
              e => F.pure(Left(e)),
              a => F.map_(F.censor_(F.pure(a), f), Right),
            ),
          ),
        ),
      listen: fa =>
        EitherT(
          F.flatMap_(fa.value, ea =>
            ea.fold(
              e => F.pure(Left(e)),
              a => F.map_(F.listen(F.pure(a)), Right),
            ),
          ),
        ),
      tell: w => EitherT(F.map_(F.tell(w), Right)),
    }),

  OptionT: <F, W>(F: MonadWriter<F, W>): MonadWriter<$<OptionTF, [F]>, W> =>
    MonadWriter.of<$<OptionTF, [F]>, W>({
      monoid: F.monoid,
      ...OptionT.Monad<F>(F),
      censor_: (fa, f) =>
        OptionT(
          F.flatMap_(fa.value, opt =>
            opt.fold(
              () => F.pure(None),
              a => F.map_(F.censor_(F.pure(a), f), Some),
            ),
          ),
        ),
      listen: fa =>
        OptionT(
          F.flatMap_(fa.value, opt =>
            opt.fold(
              () => F.pure(None),
              a => F.map_(F.listen(F.pure(a)), Some),
            ),
          ),
        ),
      tell: w => OptionT(F.map_(F.tell(w), Some)),
    }),
});
