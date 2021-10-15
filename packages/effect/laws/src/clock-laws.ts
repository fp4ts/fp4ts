import { Kind } from '@cats4ts/core';
import { Clock } from '@cats4ts/effect-kernel';

export const ClockLaws = <F>(F: Clock<F>): ClockLaws<F> => ({
  monotonicity: () =>
    F.applicative.map2_(F.monotonic, F.monotonic)((l, r) => l <= r),
});

export interface ClockLaws<F> {
  monotonicity: () => Kind<F, [boolean]>;
}
