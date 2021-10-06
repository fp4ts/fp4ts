import { AnyK, Kind } from '@cats4ts/core';
import { Applicative } from '@cats4ts/cats-core';

export interface Clock<F extends AnyK> {
  readonly applicative: Applicative<F>;

  readonly monotonic: Kind<F, [number]>;

  readonly realTime: Kind<F, [number]>;

  readonly timed: <A>(fa: Kind<F, [A]>) => Kind<F, [[number, A]]>;
}

export type ClockRequirements<F extends AnyK> = Pick<
  Clock<F>,
  'applicative' | 'monotonic' | 'realTime'
> &
  Partial<Clock<F>>;
export const Clock = Object.freeze({
  of: <F extends AnyK>(F: ClockRequirements<F>): Clock<F> => {
    const self: Clock<F> = {
      timed: fa =>
        self.applicative.map3_(
          self.monotonic,
          fa,
          self.monotonic,
        )((start, a, end) => [end - start, a]),

      ...F,
    };
    return self;
  },
});