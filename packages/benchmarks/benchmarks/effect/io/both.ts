import '../../../benchmarking';
import { pipe } from '@cats4ts/core';
import { IO } from '@cats4ts/effect-core';

const size = 10_000;

pipe(
  benchmark('both', async () => {
    const loop = (i: number): IO<number> =>
      i < size
        ? IO.both(IO.pure(i + 1), IO.pure(i + 1)).flatMap(([x]) => loop(x))
        : IO.pure(i);

    await loop(0).unsafeRunToPromise();
  }),
  runBenchmark(),
);
