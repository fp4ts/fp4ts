import '../benchmarking';
import { id, pipe } from '../fp/core';
import { IO } from '../effect/io';

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
