// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { List } from '@fp4ts/cats';
import { IO } from '@fp4ts/effect-core';
import { add, configure, cycle, suite } from 'benny';

function makeTests(size: number) {
  const xs = List.range(0, size);
  const performWork = IO.defer(() => IO.sleep((Math.random() * 5) | 0));
  return [
    add(`parTraverse (${size})`, async () => {
      await IO.parTraverse_(List.Traversable)(
        xs,
        () => performWork,
      ).unsafeRunToPromise();
    }),
  ];
}

suite(
  'Parallel',
  ...[1_000].flatMap(makeTests),
  cycle(),
  configure({ cases: { minSamples: 20, maxTime: 10 } }),
);
