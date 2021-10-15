import { Temporal } from '@cats4ts/effect-kernel';

import { ClockLaws } from './clock-laws';
import { SpawnLaws } from './spawn-laws';

export const TemporalLaws = <F, E>(F: Temporal<F, E>): TemporalLaws<F, E> => ({
  ...ClockLaws(F),
  ...SpawnLaws(F),
});

export interface TemporalLaws<F, E> extends SpawnLaws<F, E>, ClockLaws<F> {}
