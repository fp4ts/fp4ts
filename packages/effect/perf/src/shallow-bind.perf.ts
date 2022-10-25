// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { IO } from '@fp4ts/effect-core';
import { add, configure, cycle, suite } from 'benny';

function makeTests(size: number) {
  return [
    add('pure', async () => {
      const loop = (i: number): IO<number> =>
        i < size ? IO.pure(i + 1).flatMap(loop) : IO.pure(i);

      await IO.pure(0).flatMap(loop).unsafeRunToPromise();
    }),

    add('delay', async () => {
      const loop = (i: number): IO<number> =>
        i < size ? IO.delay(() => i + 1).flatMap(loop) : IO.pure(i);

      await IO.delay(() => 0)
        .flatMap(loop)
        .unsafeRunToPromise();
    }),

    add('async', async () => {
      const loop = (i: number): IO<number> =>
        i < size
          ? IO.suspend.flatMap(() => IO.pure(i + 1)).flatMap(loop)
          : IO.pure(i);

      await IO.suspend
        .flatMap(() => IO.pure(0))
        .flatMap(loop)
        .unsafeRunToPromise();
    }),

    add('Promise.resolve', async () => {
      const loop = (i: number): Promise<number> =>
        i < size ? Promise.resolve(i + 1).then(loop) : Promise.resolve(i);

      await loop(0);
    }),

    add('new Promise', async () => {
      const loop = (i: number): Promise<number> =>
        i < size
          ? new Promise<number>(resolve => resolve(i + 1)).then(loop)
          : Promise.resolve(i);

      await loop(0);
    }),
  ];
}

suite(
  'Shallow Bind',
  ...[10_000].flatMap(makeTests),
  cycle(),
  configure({ cases: { minSamples: 20, maxTime: 1 } }),
);
