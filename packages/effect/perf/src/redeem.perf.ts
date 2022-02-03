import { IO } from '@fp4ts/effect-core';
import { add, configure, cycle, suite } from 'benny';

function makeTests(size: number) {
  return [
    add(`happyPath (${size})`, async () => {
      const loop = (i: number): IO<number> =>
        i < size
          ? IO.pure(i + 1)
              .redeem(
                () => 0,
                x => x,
              )
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
              .redeem(
                () => i + 1,
                x => x,
              )
              .flatMap(loop)
          : IO.pure(i);

      await loop(0).unsafeRunToPromise();
    }),
  ];
}

suite(
  'Redeem',
  ...[1_000, 10_000].flatMap(makeTests),
  cycle(),
  configure({ cases: { minSamples: 20, maxTime: 1 } }),
);
