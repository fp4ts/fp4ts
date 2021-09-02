import '../../../benchmarking';
import { id, pipe } from '../../../fp/core';
import { IO } from '../../../effect/io';

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
