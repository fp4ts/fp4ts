// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, compose, id } from '@fp4ts/core';
import { Monad, MonadRequirements } from '@fp4ts/cats-core';
import {
  EitherT,
  EitherTF,
  Function1,
  Function1F,
  IndexedReaderWriterStateT as RWST,
  IndexedReaderWriterStateTF as RWSTF,
  Kleisli,
  KleisliF,
  OptionT,
  OptionTF,
  ReaderF,
  XPure,
  XPureF,
} from '@fp4ts/cats-core/lib/data';
import { Local, LocalRequirements } from './local';

export interface MonadReader<F, R> extends Monad<F>, Local<F, R> {}

export type MonadReaderRequirements<F, R> = LocalRequirements<F, R> &
  MonadRequirements<F> &
  Partial<MonadReader<F, R>>;
export const MonadReader = Object.freeze({
  of: <F, R>(F: MonadReaderRequirements<F, R>): MonadReader<F, R> => ({
    ...Local.of(F),
    ...Monad.of(F),
    ...F,
  }),

  XPure: <W, S, R, E>(): MonadReader<$<XPureF, [W, S, S, R, E]>, R> =>
    MonadReader.of<$<XPureF, [W, S, S, R, E]>, R>({
      ...XPure.Monad<W, S, R, E>(),
      ask: (() => XPure.ask()) as MonadReader<
        $<XPureF, [W, S, S, R, E]>,
        R
      >['ask'],
      local_: (fa, f) => fa.local(f),
    }),

  RWST: <F, W, S, R>(F: Monad<F>): MonadReader<$<RWSTF, [F, W, S, S, R]>, R> =>
    MonadReader.of<$<RWSTF, [F, W, S, S, R]>, R>({
      ...RWST.Monad(F),
      ask: RWST.ask(F) as MonadReader<$<RWSTF, [F, W, S, S, R]>, R>['ask'],
      local_: (fa, f) => fa.local(F)(f),
    }),

  Function1: <R>(): MonadReader<$<Function1F, [R]>, R> =>
    MonadReader.of<$<Function1F, [R]>, R>({
      ...Function1.Monad<R>(),
      ask: (() => id) as MonadReader<$<Function1F, [R]>, R>['ask'],
      local_: compose,
    }),

  Kleisli: <F, R>(F: Monad<F>): MonadReader<$<KleisliF, [F, R]>, R> =>
    MonadReader.of<$<KleisliF, [F, R]>, R>({
      ...Kleisli.Monad(F),
      ask: (() => Kleisli.ask(F)) as MonadReader<$<KleisliF, [F, R]>, R>['ask'],
      local_: (fa, f) => fa.adapt(f),
    }),

  Reader: <R>(): MonadReader<ReaderF<R>, R> => MonadReader.XPure(),

  EitherT: <F, E, R>(
    F: MonadReader<F, R>,
  ): MonadReader<$<EitherTF, [F, E]>, R> =>
    MonadReader.of<$<EitherTF, [F, E]>, R>({
      ...EitherT.Monad<F, E>(F),
      ask: (() => EitherT.liftF(F)(F.ask())) as MonadReader<
        $<EitherTF, [F, E]>,
        R
      >['ask'],
      local_: (fa, f) => EitherT(F.local_(fa.value, f)),
    }),

  OptionT: <F, R>(F: MonadReader<F, R>): MonadReader<$<OptionTF, [F]>, R> =>
    MonadReader.of<$<OptionTF, [F]>, R>({
      ...OptionT.Monad<F>(F),
      ask: (() => OptionT.liftF(F)(F.ask())) as MonadReader<
        $<OptionTF, [F]>,
        R
      >['ask'],
      local_: (fa, f) => OptionT(F.local_(fa.value, f)),
    }),
});
