// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, instance, Kind, pipe } from '@fp4ts/core';
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

export interface MonadState<F, S> extends Monad<F> {
  get: Kind<F, [S]>;
  set(s: S): Kind<F, [void]>;

  modify(f: (s: S) => S): Kind<F, [void]>;
  inspect<A>(f: (s: S) => A): Kind<F, [A]>;
}

export type MonadStateRequirements<F, S> = Pick<
  MonadState<F, S>,
  'get' | 'set'
> &
  MonadRequirements<F> &
  Partial<MonadState<F, S>>;
export const MonadState = Object.freeze({
  of: <F, S>(F: MonadStateRequirements<F, S>): MonadState<F, S> => {
    const self: MonadState<F, S> = instance<MonadState<F, S>>({
      modify: f => pipe(self.get, self.map(f), self.flatMap(self.set)),
      inspect: f => pipe(self.get, self.map(f)),

      ...Monad.of(F),
      ...F,
    });
    return self;
  },

  Kleisli: <F, R, S>(F: MonadState<F, S>): MonadState<$<KleisliF, [F, R]>, S> =>
    MonadState.of<$<KleisliF, [F, R]>, S>({
      ...Kleisli.Monad<F, R>(F),
      get: Kleisli(() => F.get),
      set: s => Kleisli(() => F.set(s)),
    }),

  EitherT: <F, E, S>(F: MonadState<F, S>): MonadState<$<EitherTF, [F, E]>, S> =>
    MonadState.of<$<EitherTF, [F, E]>, S>({
      ...EitherT.Monad<F, E>(F),
      get: EitherT(F.map_(F.get, Right)),
      set: s => EitherT(F.map_(F.set(s), Right)),
    }),

  OptionT: <F, S>(F: MonadState<F, S>): MonadState<$<OptionTF, [F]>, S> =>
    MonadState.of<$<OptionTF, [F]>, S>({
      ...OptionT.Monad<F>(F),
      get: OptionT(F.map_(F.get, Some)),
      set: s => OptionT(F.map_(F.set(s), Some)),
    }),
});
