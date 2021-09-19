import '../../../benchmarking';
import { id, pipe } from '@cats4ts/core';
import { Right } from '@cats4ts/cats-core/lib/data';
import { IO } from '@cats4ts/effect-core';

const size = 1000;

const evalAsync = (n: number): IO<number> =>
  IO.async_(cb => IO(() => cb(Right(n))));

pipe(
  benchmark.group('async')(
    benchmark('async', async () => {
      const loop = (i: number): IO<number> =>
        i < size ? evalAsync(i + 1).flatMap(loop) : evalAsync(i);

      await IO(() => 0)
        .flatMap(loop)
        .unsafeRunToPromise();
    }),

    benchmark('race', async () => {
      const task = [...new Array(size).keys()].reduce<IO<number>>(
        acc => IO.race(acc, IO.pure(1)).map(ea => ea.fold(id, id)),
        IO.never,
      );

      await task.unsafeRunToPromise();
    }),

    benchmark('uncancelable', async () => {
      const loop = (i: number): IO<number> =>
        i < size ? IO(() => i + 1).uncancelable.flatMap(loop) : IO.pure(i);

      await loop(0).unsafeRunToPromise();
    }),

    benchmark('bracket', async () => {
      const loop = (i: number): IO<number> =>
        i < size
          ? IO(() => i)
              .bracket(i => IO(() => i + 1))(() => IO.unit)
              .flatMap(loop)
          : IO.pure(1);

      await loop(0).unsafeRunToPromise();
    }),
  ),
  runBenchmark(),
);
