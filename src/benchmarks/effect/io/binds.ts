import '../../../benchmarking';

import { Right } from '../../../cats/data';
import { IO } from '../../../effect/io';
import { pipe } from '../../../fp/core';

const size = 100_000;

pipe(
  benchmark.group('bind')(
    benchmark('pure', async () => {
      const loop = (i: number): IO<number> =>
        IO.pure(i).flatMap(j => (j > size ? IO.pure(j) : loop(j + 1)));
      await loop(0).unsafeRunToPromise();
    }),

    benchmark('delay', async () => {
      const loop = (i: number): IO<number> =>
        IO.pure(i).flatMap(j => (j > size ? IO(() => j) : loop(j + 1)));
      await loop(0).unsafeRunToPromise();
    }),

    benchmark('map', async () => {
      let io = IO.pure(0);
      let i = 0;
      while (i++ < size) {
        io = io.map(() => i);
      }
      return io.unsafeRunToPromise();
    }),

    benchmark('async', async () => {
      const loop = (i: number): IO<number> =>
        IO.pure(i).flatMap(j =>
          j > size ? IO.async_(cb => IO(() => cb(Right(j)))) : loop(j + 1),
        );
      await loop(0).unsafeRunToPromise();
    }),
  ),

  runBenchmark(),
);
