// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '../../../benchmarking';
import { id, pipe } from '@fp4ts/core';
import { IO } from '@fp4ts/effect-core';

const size = 10_000;

pipe(
  benchmark('race', async () => {
    const loop = (i: number): IO<number> =>
      i < size
        ? IO.race(IO.pure(i + 1), IO.pure(i + 1))
            .map(ea => ea.fold(id, id))
            .flatMap(x => loop(x))
        : IO.pure(i);

    await loop(0).unsafeRunToPromise();
  }),
  runBenchmark(),
);
