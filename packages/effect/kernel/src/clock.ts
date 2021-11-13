import { $, Kind } from '@fp4ts/core';
import {
  Applicative,
  Monad,
  KleisliK,
  Kleisli,
  OptionTK,
  OptionT,
} from '@fp4ts/cats';

export interface Clock<F> {
  readonly applicative: Applicative<F>;

  readonly monotonic: Kind<F, [number]>;

  readonly realTime: Kind<F, [number]>;

  readonly timed: <A>(fa: Kind<F, [A]>) => Kind<F, [[number, A]]>;
}

export type ClockRequirements<F> = Pick<
  Clock<F>,
  'applicative' | 'monotonic' | 'realTime'
> &
  Partial<Clock<F>>;
export const Clock = Object.freeze({
  of: <F>(F: ClockRequirements<F>): Clock<F> => {
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

  clockForKleisli: <F, R>(
    F: Clock<F> & Applicative<F>,
  ): Clock<$<KleisliK, [F, R]>> =>
    Clock.of({
      applicative: Kleisli.Applicative(F),

      monotonic: Kleisli.liftF(F.monotonic),

      realTime: Kleisli.liftF(F.realTime),
    }),

  clockForOptionT: <F>(F: Clock<F> & Monad<F>): Clock<$<OptionTK, [F]>> =>
    Clock.of({
      applicative: OptionT.Applicative(F),

      monotonic: OptionT.liftF(F)(F.monotonic),

      realTime: OptionT.liftF(F)(F.realTime),
    }),
});
