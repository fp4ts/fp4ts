import { Kind, id } from '@cats4ts/core';
import { Defer } from '@cats4ts/cats-core';
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
});
