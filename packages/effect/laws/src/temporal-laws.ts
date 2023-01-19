// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Temporal } from '@fp4ts/effect-kernel';

import { ClockLaws } from './clock-laws';
import { SpawnLaws } from './spawn-laws';

export const TemporalLaws = <F, E>(F: Temporal<F, E>): TemporalLaws<F, E> => ({
  ...ClockLaws(F),
  ...SpawnLaws(F),
});

export interface TemporalLaws<F, E> extends SpawnLaws<F, E>, ClockLaws<F> {}
