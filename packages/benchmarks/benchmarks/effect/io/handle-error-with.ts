// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '../../../benchmarking';
import { pipe } from '@fp4ts/core';
import { IO } from '@fp4ts/effect-core';

const size = 100_000;

pipe(
  benchmark.group('handleErrorWith')(
    benchmark('happy path', async () => {
      const loop = (i: number): IO<number> =>
        i < size
          ? IO.pure(i + 1)
              .handleErrorWith(IO.throwError)
              .flatMap(loop)
          : IO.pure(i);

      await loop(0).unsafeRunToPromise();
    }),

    benchmark('error thrown', async () => {
      const error = new Error('test error');

      const loop = (i: number): IO<number> =>
        i < size
          ? IO.throwError(error)
              .flatMap(x => IO.pure(x + 1))
              .flatMap(x => IO.pure(x + 1))
              .handleErrorWith(() => loop(i + 1))
          : IO.pure(i);

      await loop(0).unsafeRunToPromise();
    }),
  ),
  runBenchmark(),
);
