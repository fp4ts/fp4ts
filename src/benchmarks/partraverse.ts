import '../benchmarking';
import { pipe } from '../fp/core';
import * as E from '../fp/either';
import { IO } from '../effect/io';

const size = 1000;
const ticks = 1000;

const consumeTicks = (n: number): IO<void> =>
  IO.async(cb =>
    IO(() => {
      let canceled = false;
      const onCancel = IO(() => (canceled = false));

      const tick = () =>
        n-- > 0 && !canceled ? process.nextTick(tick) : cb(E.rightUnit);
      tick();

      return onCancel.void;
    }),
  );

pipe(
  benchmark('parTraverse', async () => {
    const arr = [...new Array(size).keys()];

    await IO.parTraverse_(arr, () => consumeTicks(ticks)).unsafeRunToPromise();
  }),
  runBenchmark(),
);
