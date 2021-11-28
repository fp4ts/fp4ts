// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit/lib/jest-extension';
import { pipe } from '@fp4ts/core';
import { List } from '@fp4ts/cats';
import { IO, IoK } from '@fp4ts/effect-core';
import { Resource } from '@fp4ts/effect-kernel';
import { Dispatcher } from '@fp4ts/effect-std';

describe('Dispatcher', () => {
  it('should run a sync action', () => {
    const ioa = IO.pure(42).map(x => x + 2);
    const rec = Dispatcher(IO.Async).flatMap(runner =>
      Resource.evalF<IoK, number>(
        IO.fromPromise(IO(() => runner.unsafeToPromise(ioa))),
      ),
    );

    return rec
      .use(IO.MonadCancel)(x => IO(() => expect(x).toBe(44)))
      .unsafeRunToPromise();
  });

  it('should run an async action', () => {
    const ioa = IO.pure(42)
      ['<<<'](IO.suspend)
      .map(x => x + 2);
    const rec = Dispatcher(IO.Async).flatMap(runner =>
      Resource.evalF<IoK, number>(
        IO.fromPromise(IO(() => runner.unsafeToPromise(ioa))),
      ),
    );

    return rec
      .use(IO.MonadCancel)(x => IO(() => expect(x).toBe(44)))
      .unsafeRunToPromise();
  });

  it('should run several IOs back to back', () => {
    let counter = 0;
    const increment = IO(() => (counter += 1)).void;
    const rec = Dispatcher(IO.Async).flatMap(runner =>
      Resource.evalF<IoK, void>(
        IO.fromPromise(
          IO(() =>
            runner.unsafeToPromise(
              increment['>>>'](increment)
                ['>>>'](increment)
                ['>>>'](increment)
                ['>>>'](increment),
            ),
          ),
        ),
      ),
    );

    return rec
      .use(IO.MonadCancel)(() => IO(() => expect(counter).toBe(5)))
      .unsafeRunToPromise();
  });

  it('should run multiple IOs in parallel', () => {
    const num = 10;

    return pipe(
      IO.Do,
      IO.bindTo(
        'latches',
        List.range(0, num).traverse(IO.Applicative)(() => IO.deferred<void>()),
      ),
      IO.bindTo('awaitAll', ({ latches }) =>
        IO.pure(IO.parTraverse_(List.Traversable)(latches, l => l.get())),
      ),
      // engineer a deadlock: all subjects must be run in parallel or this will hang
      IO.bindTo('subjects', ({ latches, awaitAll }) =>
        IO.pure(latches.map(l => l.complete()['>>>'](awaitAll))),
      ),

      IO.bind(({ subjects }) => {
        const rec = Dispatcher(IO.Async).flatMap(runner =>
          Resource.evalF(
            IO.parTraverse_(List.Traversable)(subjects, act =>
              IO(() => runner.unsafeRunAndForget(act)),
            ),
          ),
        );

        return rec.use(IO.MonadCancel)(() => IO.unit);
      }),
    ).void.unsafeRunToPromise();
  });

  it('should forward cancelation onto the inner action', () => {
    let canceled = false;

    const rec = Dispatcher(IO.Async).flatMap(runner => {
      const run = IO(
        () =>
          runner.unsafeToPromiseCancelable(
            IO.never.onCancel(IO(() => (canceled = true)).void),
          )[1],
      );

      return Resource.evalF<IoK, void>(
        run.flatMap(ct => IO.sleep(500)['>>>'](IO.fromPromise(IO(() => ct())))),
      );
    });

    return rec
      .use(IO.MonadCancel)(() => IO(() => expect(canceled).toBe(true)))
      .unsafeRunToPromise();
  });

  it('should throw an error on on a leaked runner', () => {
    return Dispatcher(IO.Async)
      .use(IO.MonadCancel)(IO.pure)
      .flatMap(runner =>
        IO(() => expect(() => runner.unsafeRunAndForget(IO.unit)).toThrow()),
      )
      .void.unsafeRunToPromise();
  });
});
