import '../../../benchmarking';
import { pipe } from '../../../fp/core';
import { Either, List, Some } from '../../../cats/data';
import { IO } from '../../../effect/io';
import { listTraversable } from '../../../cats/data/list/instances';

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

      return Some(onCancel.void);
    }),
  );

pipe(
  benchmark('parTraverse', async () => {
    const arr = List.fromArray([...new Array(size).keys()]);

    await IO.parTraverse_(listTraversable(), arr, () =>
      consumeTicks(ticks),
    ).unsafeRunToPromise();
  }),
  runBenchmark(),
);
