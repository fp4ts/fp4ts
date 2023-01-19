// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit';
import { List, Monad } from '@fp4ts/cats';
import { IO } from '@fp4ts/effect-core';
import { Resource } from '@fp4ts/effect-kernel';
import { Dispatcher } from '@fp4ts/effect-std';

describe('Dispatcher', () => {
  it.real('should run a sync action', () => {
    const ioa = IO.pure(42).map(x => x + 2);
    const rec = Dispatcher(IO.Async).flatMap(runner =>
      Resource.evalF(IO.fromPromise(IO(() => runner.unsafeToPromise(ioa)))),
    );

    return rec.use(IO.MonadCancel)(x => IO(() => expect(x).toBe(44)));
  });

  it.real('should run an async action', () => {
    const ioa = IO.pure(42)
      ['<<<'](IO.suspend)
      .map(x => x + 2);
    const rec = Dispatcher(IO.Async).flatMap(runner =>
      Resource.evalF(IO.fromPromise(IO(() => runner.unsafeToPromise(ioa)))),
    );

    return rec.use(IO.MonadCancel)(x => IO(() => expect(x).toBe(44)));
  });

  it.real('should run several IOs back to back', () => {
    let counter = 0;
    const increment = IO(() => (counter += 1)).void;
    const rec = Dispatcher(IO.Async).flatMap(runner =>
      Resource.evalF(
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

    return rec.use(IO.MonadCancel)(() => IO(() => expect(counter).toBe(5)));
  });

  it.real('should run multiple IOs in parallel', () => {
    const num = 10;

    return Monad.Do(IO.Monad)(function* (_) {
      const latches = yield* _(
        List.range(0, num).traverse(IO.Applicative, () => IO.deferred<void>()),
      );
      const awaitAll = yield* _(
        IO.pure(IO.parTraverse_(List.TraversableFilter)(latches, l => l.get())),
      );
      // engineer a deadlock: all subjects must be run in parallel or this will hang
      const subjects = yield* _(
        IO.pure(latches.map(l => l.complete()['>>>'](awaitAll))),
      );

      const rec = Dispatcher(IO.Async).flatMap(runner =>
        Resource.evalF(
          IO.parTraverse_(List.TraversableFilter)(subjects, act =>
            IO(() => runner.unsafeRunAndForget(act)),
          ),
        ),
      );
      yield* _(rec.use(IO.MonadCancel)(() => IO.unit));
    });
  });

  it.real('should forward cancelation onto the inner action', () => {
    let canceled = false;

    const rec = Dispatcher(IO.Async).flatMap(runner => {
      const run = IO(
        () =>
          runner.unsafeToPromiseCancelable(
            IO.never.onCancel(IO(() => (canceled = true)).void),
          )[1],
      );

      return Resource.evalF(
        run.flatMap(ct => IO.sleep(500)['>>>'](IO.fromPromise(IO(() => ct())))),
      );
    });

    return rec.use(IO.MonadCancel)(() => IO(() => expect(canceled).toBe(true)));
  });

  it.real('should throw an error on on a leaked runner', () => {
    return Dispatcher(IO.Async)
      .use(IO.MonadCancel)(IO.pure)
      .flatMap(runner =>
        IO(() => expect(() => runner.unsafeRunAndForget(IO.unit)).toThrow()),
      ).void;
  });
});
