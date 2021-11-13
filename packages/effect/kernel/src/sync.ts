import { $, Kind, id } from '@fp4ts/core';
import { Defer, KleisliK, Kleisli, OptionTK, OptionT } from '@fp4ts/cats';
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

  syncForKleisli: <F, R>(F: Sync<F>): Sync<$<KleisliK, [F, R]>> =>
    Sync.of({
      ...MonadCancel.monadCancelForKleisli(F),

      ...Clock.clockForKleisli(F),

      ...Kleisli.Defer(F),

      delay: <A>(thunk: () => A) => Kleisli.liftF(F.delay(thunk)),
    }),

  syncForOptionT: <F>(F: Sync<F>): Sync<$<OptionTK, [F]>> =>
    Sync.of({
      ...MonadCancel.monadCancelForOptionT(F),

      ...Clock.clockForOptionT(F),

      ...OptionT.Defer(F),

      delay: <A>(thunk: () => A) => OptionT.liftF(F)(F.delay(thunk)),
    }),
});
