// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { IO } from '@fp4ts/effect-core';
import { add, configure, cycle, suite } from 'benny';

function makeTests(size: number) {
  return [
    add(`happyPath (${size})`, async () => {
      const loop = (i: number): IO<number> =>
        i < size
          ? IO.both(IO.pure(i + 1), IO.pure(i + 1)).flatMap(rs => loop(rs[1]))
          : IO.pure(i);

      await loop(0).unsafeRunToPromise();
    }),
  ];
}

suite(
  'Both',
  ...[1_000, 10_000].flatMap(makeTests),
  cycle(),
  configure({ cases: { minSamples: 20, maxTime: 1 } }),
);
