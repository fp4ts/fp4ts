// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Kind, id } from '@fp4ts/core';
import { Defer, KleisliF, Kleisli, OptionTF, OptionT } from '@fp4ts/cats';
import { MonadCancel, MonadCancelRequirements } from './monad-cancel';
import { Clock, ClockRequirements } from './clock';
import { UniqueToken, Unique } from './unique';

export interface Sync<F>
  extends Clock<F>,
    MonadCancel<F, Error>,
    Defer<F>,
    Unique<F> {
  readonly delay: <A>(a: () => A) => Kind<F, [A]>;
}

export type SyncRequirements<F> = Pick<Omit<Sync<F>, 'unique'>, 'delay'> &
  MonadCancelRequirements<F, Error> &
  ClockRequirements<F> &
  Partial<Sync<F>>;
export const Sync = Object.freeze({
  of: <F>(F: SyncRequirements<F>): Sync<F> => {
    const self: Sync<F> = {
      unique: F.delay(() => new UniqueToken()),
      ...Clock.of(F),
      ...MonadCancel.of(F),
      ...Defer.of({
        defer: F.defer ?? (thunk => self.flatMap_(self.delay(thunk), id)),
      }),
      ...F,
    };
    return self;
  },

  syncForKleisli: <F, R>(F: Sync<F>): Sync<$<KleisliF, [F, R]>> =>
    Sync.of({
      ...MonadCancel.forKleisli(F),

      ...Clock.forKleisli(F),

      ...Kleisli.Defer(F),

      delay: <A>(thunk: () => A) => Kleisli.liftF(F.delay(thunk)),
    }),

  syncForOptionT: <F>(F: Sync<F>): Sync<$<OptionTF, [F]>> =>
    Sync.of({
      ...MonadCancel.forOptionT(F),

      ...Clock.forOptionT(F),

      ...OptionT.Defer(F),

      delay: <A>(thunk: () => A) => OptionT.liftF(F)(F.delay(thunk)),
    }),
});
