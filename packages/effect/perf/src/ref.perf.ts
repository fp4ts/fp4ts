// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { IO } from '@fp4ts/effect-core';
import { Ref } from '@fp4ts/effect-kernel';
import { add, configure, cycle, suite } from 'benny';

function makeTests(iterations: number) {
  return [
    add('modify', async () => {
      await Ref.of(IO.Sync)(0)
        .flatMap(ref => {
          const loop = (remaining: number, acc: number): IO<number> =>
            remaining === 0
              ? IO(() => acc)
              : ref
                  .modify(n => [n + 1, n])
                  .flatMap(prev => loop(remaining - 1, acc + prev));

          return loop(iterations, 0);
        })
        .void.unsafeRunToPromise();
    }),
    add('getAndUpdate', async () => {
      await Ref.of(IO.Sync)(0)
        .flatMap(ref => {
          const loop = (remaining: number, acc: number): IO<number> =>
            remaining === 0
              ? IO(() => acc)
              : ref
                  .updateAndGet(n => n + 1)
                  .flatMap(prev => loop(remaining - 1, acc + prev));

          return loop(iterations, 0);
        })
        .void.unsafeRunToPromise();
    }),
  ];
}

suite(
  'Ref',
  ...[10_000].flatMap(makeTests),
  cycle(),
  configure({ cases: { minSamples: 20, maxTime: 1 } }),
);
