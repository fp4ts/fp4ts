import { IO } from '@fp4ts/effect-core';
import { add, configure, cycle, suite } from 'benny';

function makeTests(size: number) {
  return [
    add('pure', async () => {
      const loop = (i: number): IO<number> =>
        i < size ? IO.pure(i + 1).flatMap(loop) : IO.pure(i);

      await IO.pure(0).flatMap(loop).unsafeRunToPromise();
    }),

    add('delay', async () => {
      const loop = (i: number): IO<number> =>
        i < size ? IO.delay(() => i + 1).flatMap(loop) : IO.pure(i);

      await IO.delay(() => 0)
        .flatMap(loop)
        .unsafeRunToPromise();
    }),

    add('async', async () => {
      const loop = (i: number): IO<number> =>
        i < size
          ? IO.suspend.flatMap(() => IO.pure(i + 1)).flatMap(loop)
          : IO.pure(i);

      await IO.suspend
        .flatMap(() => IO.pure(0))
        .flatMap(loop)
        .unsafeRunToPromise();
    }),
  ];
}

suite(
  'Shallow Bind',
  ...[10_000].flatMap(makeTests),
  cycle(),
  configure({ cases: { minSamples: 20, maxTime: 1 } }),
);
