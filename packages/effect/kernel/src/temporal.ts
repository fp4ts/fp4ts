import { $, Kind } from '@fp4ts/core';
import { KleisliK, Kleisli, OptionTK, OptionT } from '@fp4ts/cats';
import { Concurrent, ConcurrentRequirements } from './concurrent';
import { Clock, ClockRequirements } from './clock';

export interface Temporal<F, E> extends Concurrent<F, E>, Clock<F> {
  readonly sleep: (ms: number) => Kind<F, [void]>;

  readonly delayBy: (ms: number) => <A>(fa: Kind<F, [A]>) => Kind<F, [A]>;
  readonly delayBy_: <A>(fa: Kind<F, [A]>, ms: number) => Kind<F, [A]>;

  readonly andWait: (ms: number) => <A>(fa: Kind<F, [A]>) => Kind<F, [A]>;
  readonly andWait_: <A>(fa: Kind<F, [A]>, ms: number) => Kind<F, [A]>;

  readonly timeoutTo: <A>(
    ms: number,
    fallback: Kind<F, [A]>,
  ) => (fa: Kind<F, [A]>) => Kind<F, [A]>;
  readonly timeoutTo_: <A>(
    fa: Kind<F, [A]>,
    ms: number,
    fallback: Kind<F, [A]>,
  ) => Kind<F, [A]>;

  timeout(
    this: Temporal<F, Error>,
    ms: number,
  ): <A>(fa: Kind<F, [A]>) => Kind<F, [A]>;
  timeout_<A>(
    this: Temporal<F, Error>,
    fa: Kind<F, [A]>,
    ms: number,
  ): Kind<F, [A]>;
}

export type TemporalRequirements<F, E> = Pick<Temporal<F, E>, 'sleep'> &
  ConcurrentRequirements<F, E> &
  ClockRequirements<F> &
  Partial<Temporal<F, E>>;
export const Temporal = Object.freeze({
  of: <F, E>(F: TemporalRequirements<F, E>): Temporal<F, E> => {
    const self: Temporal<F, E> = {
      delayBy: ms => fa => self.delayBy_(fa, ms),
      delayBy_: (fa, ms) => self.productR_(self.sleep(ms), fa),

      andWait: ms => fa => self.andWait_(fa, ms),
      andWait_: (fa, ms) => self.productL_(fa, self.sleep(ms)),

      timeoutTo: (ms, fallback) => fa => self.timeoutTo_(fa, ms, fallback),
      timeoutTo_: (fa, ms, fallback) =>
        self.flatMap_(self.race_(fa, self.sleep(ms)), ea =>
          ea.fold(
            a => self.pure(a),
            () => fallback,
          ),
        ),

      timeout: ms => fa => (self as any as Temporal<F, Error>).timeout_(fa, ms),
      timeout_: (fa, ms) =>
        self.flatMap_(self.race_(fa, self.sleep(ms)), ea =>
          ea.fold(
            a => self.pure(a),
            () => self.throwError(new Error('Timeout Error') as any as E),
          ),
        ),

      ...Concurrent.of(F),
      ...Clock.of(F),
      ...F,
    };
    return self;
  },

  temporalForKleisli: <F, E, R>(
    F: Temporal<F, E>,
  ): Temporal<$<KleisliK, [F, R]>, E> =>
    Temporal.of<$<KleisliK, [F, R]>, E>({
      ...Concurrent.concurrentForKleisli(F),
      ...Clock.clockForKleisli(F),

      sleep: ms => Kleisli.liftF(F.sleep(ms)),
    }),

  temporalForOptionT: <F, E>(
    F: Temporal<F, E>,
  ): Temporal<$<OptionTK, [F]>, E> =>
    Temporal.of<$<OptionTK, [F]>, E>({
      ...Concurrent.concurrentForOptionT(F),
      ...Clock.clockForOptionT(F),

      sleep: ms => OptionT.liftF(F)(F.sleep(ms)),
    }),
});
