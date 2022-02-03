import { IO } from '@fp4ts/effect-core';
import { add, configure, cycle, suite } from 'benny';

function makeTests(size: number) {
  return [
    add('pure', async () => {
      const loop = (i: number): IO<number> =>
        IO.pure(i).flatMap(j => (j <= size ? loop(j + 1) : IO.pure(j)));

      await loop(0).unsafeRunToPromise();
    }),

    add('delay', async () => {
      const loop = (i: number): IO<number> =>
        IO.delay(() => i).flatMap(j => (j <= size ? loop(j + 1) : IO.pure(j)));

      await loop(0).unsafeRunToPromise();
    }),

    add('async', async () => {
      const loop = (i: number): IO<number> =>
        IO.pure(i).flatMap(j =>
          IO.suspend.flatMap(() => (j <= size ? loop(j + 1) : IO.pure(j))),
        );

      await loop(0).unsafeRunToPromise();
    }),
  ];
}

suite(
  'Shallow Bind',
  ...[10_000].flatMap(makeTests),
  cycle(),
  configure({ cases: { minSamples: 20, maxTime: 1 } }),
);
