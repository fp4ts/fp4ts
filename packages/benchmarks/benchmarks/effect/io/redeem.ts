// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '../../../benchmarking';
import { id, pipe } from '@fp4ts/core';
import { IO } from '@fp4ts/effect-core';

const size = 100_000;

pipe(
  benchmark.group('redeem')(
    benchmark('happy path', async () => {
      const loop = (i: number): IO<number> =>
        i < size
          ? IO.pure(i + 1)
              .redeem(() => 0, id)
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
              .redeem(() => i + 1, id)
              .flatMap(loop)
          : IO.pure(i);

      await loop(0).unsafeRunToPromise();
    }),
  ),
  runBenchmark(),
);
