import { Kind, id } from '@cats4ts/core';
import { Defer } from '@cats4ts/cats-core';
import { MonadCancel, MonadCancelRequirements } from './monad-cancel';
import { Clock, ClockRequirements } from './clock';

export interface Sync<F> extends Clock<F>, MonadCancel<F, Error>, Defer<F> {
  readonly delay: <A>(a: () => A) => Kind<F, [A]>;
}

export type SyncRequirements<F> = Pick<Sync<F>, 'delay'> &
  MonadCancelRequirements<F, Error> &
  ClockRequirements<F> &
  Partial<Sync<F>>;
export const Sync = Object.freeze({
  of: <F>(F: SyncRequirements<F>): Sync<F> => {
    const self: Sync<F> = {
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
