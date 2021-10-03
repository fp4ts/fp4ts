import { AnyK } from '@cats4ts/core';
import { Temporal } from '@cats4ts/effect-kernel';

import { ClockLaws } from './clock-laws';
import { SpawnLaws } from './spawn-laws';

export const TemporalLaws = <F extends AnyK, E>(
  F: Temporal<F, E>,
): TemporalLaws<F, E> => ({
  ...ClockLaws(F),
  ...SpawnLaws(F),
});

export interface TemporalLaws<F extends AnyK, E>
  extends SpawnLaws<F, E>,
    ClockLaws<F> {}
