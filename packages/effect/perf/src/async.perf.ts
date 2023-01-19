// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { add, configure, cycle, suite } from 'benny';
import { Right, Some } from '@fp4ts/cats';
import { IO } from '@fp4ts/effect-core';

const evalAsync = (n: number): IO<number> => IO.async_(cb => cb(Right(n)));
const evalCancelable = (n: number): IO<number> =>
  IO.async(cb =>
    IO(() => {
      cb(Right(n));
      return Some(IO.unit);
    }),
  );

function makeTests(size: number) {
  return [
    add('async', async () => {
      const loop = (i: number): IO<number> =>
        i < size ? evalAsync(i + 1).flatMap(loop) : evalAsync(i);

      await IO(() => 0)
        .flatMap(loop)
        .unsafeRunToPromise();
    }),

    add('cancelable', async () => {
      const loop = (i: number): IO<number> =>
        i < size ? evalCancelable(i + 1).flatMap(loop) : evalCancelable(i);

      await IO(() => 0)
        .flatMap(loop)
        .unsafeRunToPromise();
    }),

    add('race', async () => {
      let task = IO.never as IO<number>;
      for (let i = 0; i < size; i++) {
        task = IO.race(
          task,
          IO(() => 1),
        ).map(ea =>
          ea.fold(
            x => x,
            x => x,
          ),
        );
      }

      await task.unsafeRunToPromise();
    }),

    add('fork', async () => {
      const loop = (i: number): IO<number> =>
        i < size
          ? IO(() => i + 1)
              .fork.flatMap(f => f.joinWithNever())
              .flatMap(loop)
          : IO.pure(i);

      await IO(() => 0)
        .flatMap(loop)
        .unsafeRunToPromise();
    }),

    add('uncancelable', async () => {
      const loop = (i: number): IO<number> =>
        i < size ? IO(() => i + 1).uncancelable.flatMap(loop) : IO.pure(i);

      await IO(() => 0)
        .flatMap(loop)
        .unsafeRunToPromise();
    }),

    add('bracket', async () => {
      const loop = (i: number): IO<number> =>
        i < size
          ? IO(() => i)
              .bracket(
                i => IO(() => i + 1),
                () => IO.unit,
              )
              .flatMap(loop)
          : IO.pure(i);

      await IO(() => 0)
        .flatMap(loop)
        .unsafeRunToPromise();
    }),
  ];
}

suite(
  'Async',
  ...[100].flatMap(makeTests),
  cycle(),
  configure({ cases: { minSamples: 20, maxTime: 1 } }),
);
