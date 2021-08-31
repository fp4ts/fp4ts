import '../benchmarking';
import { pipe } from '../fp/core';
import { Either } from '../cats/data';
import { IO } from '../effect/io';
import { arrayTraversable } from '../cats/data/array/instances';

const size = 1000;
const ticks = 1000;

const consumeTicks = (n: number): IO<void> =>
  IO.async(cb =>
    IO(() => {
      let canceled = false;
      const onCancel = IO(() => (canceled = false));

      const tick = () =>
        n-- > 0 && !canceled ? process.nextTick(tick) : cb(Either.rightUnit);
      tick();

      return onCancel.void;
    }),
  );

pipe(
  benchmark('parTraverse', async () => {
    const arr = [...new Array(size).keys()];

    await IO.parTraverse_(arrayTraversable(), arr, () =>
      consumeTicks(ticks),
    ).unsafeRunToPromise();
  }),
  runBenchmark(),
);
