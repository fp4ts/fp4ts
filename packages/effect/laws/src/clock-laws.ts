import { AnyK, Kind } from '@cats4ts/core';
import { Clock } from '@cats4ts/effect-kernel';

export const ClockLaws = <F extends AnyK>(F: Clock<F>): ClockLaws<F> => ({
  monotonicity: () =>
    F.applicative.map2_(F.monotonic, F.monotonic)((l, r) => l <= r),
});

export interface ClockLaws<F extends AnyK> {
  monotonicity: () => Kind<F, [boolean]>;
}
