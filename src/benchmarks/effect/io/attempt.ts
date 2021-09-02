import '../../../benchmarking';
import { pipe } from '../../../fp/core';
import { IO } from '../../../effect/io';

const size = 100_000;

pipe(
  benchmark.group('attempt')(
    benchmark('happy path', async () => {
      const loop = (i: number): IO<number> =>
        i < size
          ? IO.pure(i + 1).attempt.flatMap(ea => ea.fold(IO.throwError, loop))
          : IO.pure(i);

      await loop(0).unsafeRunToPromise();
    }),

    benchmark('error thrown', async () => {
      const error = new Error('test error');

      const loop = (i: number): IO<number> =>
        i < size
          ? IO.throwError(error)
              .flatMap(x => IO.pure(x + 1))
              .attempt.flatMap(ea => ea.fold(() => loop(i + 1), IO.pure))
          : IO.pure(i);

      await loop(0).unsafeRunToPromise();
    }),
  ),
  runBenchmark(),
);
