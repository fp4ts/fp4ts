// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, compose, id, instance, Kind } from '@fp4ts/core';
import { Monad, MonadRequirements } from '@fp4ts/cats-core';
import {
  EitherT,
  EitherTF,
  Function1,
  Function1F,
  Kleisli,
  KleisliF,
  OptionT,
  OptionTF,
} from '@fp4ts/cats-core/lib/data';
import { Local, LocalRequirements } from './local';

export interface MonadReader<F, R> extends Monad<F>, Local<F, R> {
  asks<A>(f: (r: R) => A): Kind<F, [A]>;
}

export type MonadReaderRequirements<F, R> = LocalRequirements<F, R> &
  MonadRequirements<F> &
  Partial<MonadReader<F, R>>;
export const MonadReader = Object.freeze({
  of: <F, R>(F: MonadReaderRequirements<F, R>): MonadReader<F, R> => {
    const self: MonadReader<F, R> = instance<MonadReader<F, R>>({
      asks: f => self.liftM(f)(self.ask()),

      ...Local.of(F),
      ...Monad.of(F),
      ...F,
    });
    return self;
  },

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
