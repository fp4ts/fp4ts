// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Clock } from '@fp4ts/effect-kernel';

export const ClockLaws = <F>(F: Clock<F>): ClockLaws<F> => ({
  monotonicity: () =>
    F.applicative.map2_(F.monotonic, F.monotonic)((l, r) => l <= r),
});

export interface ClockLaws<F> {
  monotonicity: () => Kind<F, [boolean]>;
}
