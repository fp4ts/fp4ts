// Copyright (c) 2021-2022 Peter Matta
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
          ? IO.pure(i + 1)
              .handleErrorWith(IO.throwError)
              .flatMap(loop)
          : IO.pure(i);

      await loop(0).unsafeRunToPromise();
    }),

    add(`error thrown (${size})`, async () => {
      const dummy = new Error('Sample error');
      const loop = (i: number): IO<number> =>
        i < size
          ? IO.throwError(dummy)
              .flatMap(x => IO.delay(() => x + 1))
              .flatMap(x => IO.delay(() => x + 1))
              .handleErrorWith(() => loop(i + 1))
          : IO.pure(i);

      await loop(0).unsafeRunToPromise();
    }),

    add(`Promise error thrown (${size})`, async () => {
      const dummy = new Error('Sample error');
      const loop = (i: number): Promise<number> =>
        i < size
          ? Promise.reject(dummy)
              .then(x => Promise.resolve(x + 1))
              .then(x => Promise.resolve(x + 1))
              .catch(() => loop(i + 1))
          : Promise.resolve(i);

      await loop(0);
    }),
  ];
}

suite(
  'Handle Error',
  ...[1_000].flatMap(makeTests),
  cycle(),
  configure({ cases: { minSamples: 20, maxTime: 1 } }),
);
