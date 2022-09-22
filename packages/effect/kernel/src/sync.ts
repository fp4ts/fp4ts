// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Kind, id } from '@fp4ts/core';
import { Defer, KleisliF, Kleisli, OptionTF, OptionT } from '@fp4ts/cats';
import { MonadCancel, MonadCancelRequirements } from './monad-cancel';
import { Clock, ClockRequirements } from './clock';
import { UniqueToken, Unique } from './unique';

export interface Sync<F, E = Error>
  extends Clock<F>,
    MonadCancel<F, E>,
    Defer<F>,
    Unique<F> {
  readonly delay: <A>(a: () => A) => Kind<F, [A]>;
}

export type SyncRequirements<F, E = Error> = Pick<
  Omit<Sync<F, E>, 'unique'>,
  'delay'
> &
  MonadCancelRequirements<F, E> &
  ClockRequirements<F> &
  Partial<Sync<F, E>>;
export const Sync = Object.freeze({
  of: <F, E = Error>(F: SyncRequirements<F, E>): Sync<F, E> => {
    const self: Sync<F, E> = {
      unique: F.delay(() => new UniqueToken()),
      ...Clock.of(F),
      ...MonadCancel.of<F, E>(F),
      ...Defer.of({
        defer: F.defer ?? (thunk => self.flatMap_(self.delay(thunk), id)),
      }),
      ...F,
    };
    return self;
  },

  syncForKleisli: <F, R, E>(F: Sync<F, E>): Sync<$<KleisliF, [F, R]>, E> =>
    Sync.of<$<KleisliF, [F, R]>, E>({
      ...MonadCancel.forKleisli<F, R, E>(F),

      ...Clock.forKleisli(F),

      ...Kleisli.Defer(F),

      delay:
        <A>(thunk: () => A) =>
        () =>
          F.delay(thunk),
    }),

  syncForOptionT: <F, E>(F: Sync<F, E>): Sync<$<OptionTF, [F]>, E> =>
    Sync.of<$<OptionTF, [F]>, E>({
      ...MonadCancel.forOptionT<F, E>(F),

      ...Clock.forOptionT(F),

      ...OptionT.Defer(F),

      delay: <A>(thunk: () => A) => OptionT.liftF(F)(F.delay(thunk)),
    }),
});
