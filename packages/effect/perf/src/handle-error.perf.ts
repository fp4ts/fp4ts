import { IO } from '@fp4ts/effect-core';
import { add, configure, cycle, suite } from 'benny';

function makeTests(size: number) {
  return [
    add(`happyPath (${size})`, async () => {
      const loop = (i: number): IO<number> =>
        i < size
          ? IO.pure(i + 1)
              .handleErrorWith(IO.throwError)
              .flatMap(loop)
          : IO.pure(i);

      await loop(0).unsafeRunToPromise();
    }),

    add(`error thrown (${size})`, async () => {
      const dummy = new Error('Sample error');
      const loop = (i: number): IO<number> =>
        i < size
          ? IO.throwError(dummy)
              .flatMap(x => IO.delay(() => x + 1))
              .flatMap(x => IO.delay(() => x + 1))
              .handleErrorWith(() => loop(i + 1))
          : IO.pure(i);

      await loop(0).unsafeRunToPromise();
    }),
  ];
}

suite(
  'Handle Error',
  ...[1_000, 10_000].flatMap(makeTests),
  cycle(),
  configure({ cases: { minSamples: 20, maxTime: 1 } }),
);
