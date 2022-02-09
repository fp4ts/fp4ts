// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { add, configure, cycle, suite } from 'benny';
import { IO } from '@fp4ts/effect-core';

function makeTest([iterations, batch]: [number, number]) {
  const f = (x: number): number => x + 1;

  return add(`${iterations} iterations ${batch} batch`, async () => {
    let io = IO(() => 0);
    for (let j = 0; j < batch; j++) {
      io = io.map(f);
    }

    for (let i = 0; i < iterations; i++) {
      await io.unsafeRunToPromise();
    }
  });
}

suite(
  'Map',
  ...[
    [120_000, 1] as [number, number],
    [120_000 / 30, 30] as [number, number],
    [120_000 / 120, 120] as [number, number],
  ].map(makeTest),
  cycle(),
  configure({ cases: { minSamples: 20, maxTime: 1 } }),
);
