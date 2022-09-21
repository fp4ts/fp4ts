// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit/lib/jest-extension';
import fc from 'fast-check';
import { Eq, List, Left } from '@fp4ts/cats';
import { IO, IOF } from '@fp4ts/effect';
import { Stream } from '@fp4ts/stream-core';
import * as A from '@fp4ts/stream-test-kit/lib/arbitraries';
import { TestError } from './test-error';

describe('Stream concurrently', () => {
  it.ticked(
    'should continue overall stream when the background one terminates (stepped)',
    ticker => {
      let backgroundStarted = false;
      let backgroundTerminated = false;
      const s1 = Stream(1, 2, 3, 4, 5).delayBy(IO.Temporal)(3_000);
      const s2 = Stream.bracket<IOF, void>(
        IO.sleep(1_000)['>>>'](IO(() => (backgroundStarted = true)).void),
        () =>
          IO.sleep(1_000)['>>>'](IO(() => (backgroundTerminated = true))).void,
      );

      let result: List<number> | undefined;
      const io = s1
        .concurrently(IO.Concurrent)(s2)
        .compileConcurrent()
        .toList.flatMap(xs => IO(() => (result = xs))).void;

      io.unsafeRunToPromise({
        config: { autoSuspendThreshold: Infinity, traceBufferSize: 16 },
        executionContext: ticker.ctx,
        shutdown: () => {},
      });

      // after 1 second:
      //  background stream should start, the overall stream should not be finished
      ticker.ctx.tick();
      ticker.ctx.tick(1_000);
      expect(backgroundStarted).toBe(true);
      expect(backgroundTerminated).toBe(false);
      expect(result).toBeUndefined();

      // after 2 seconds:
      //  background stream should finish, the overall stream should not be finished
      ticker.ctx.tick();
      ticker.ctx.tick(1_000);
      expect(backgroundStarted).toBe(true);
      expect(backgroundTerminated).toBe(true);
      expect(result).toBeUndefined();

      // after 3 seconds:
      //  the overall stream should finish
      ticker.ctx.tick();
      ticker.ctx.tick(1_000);
      expect(backgroundStarted).toBe(true);
      expect(backgroundTerminated).toBe(true);
      expect(result).toEqual(List(1, 2, 3, 4, 5));
    },
  );

  it('should continue overall stream when the background one terminates (real)', () =>
    fc.assert(
      fc.asyncProperty(
        A.fp4tsPureStreamGenerator(fc.integer()),
        A.fp4tsPureStreamGenerator(fc.integer()),
        (s1, s2) => {
          const expected = s1.toList;
          return s1
            .delayBy(IO.Temporal)(20)
            .concurrently(IO.Concurrent)(s2)
            .compileConcurrent()
            .toList.map(xs => xs.equals(Eq.fromUniversalEquals(), expected))
            .unsafeRunToPromise();
        },
      ),
    ));

  it('should fail when concurrent stream fails', () =>
    fc.assert(
      fc.asyncProperty(A.fp4tsPureStreamGenerator(fc.integer()), s =>
        s
          .concurrently(IO.Concurrent)(Stream.throwError(new TestError()))
          .compileConcurrent()
          .drain.attempt.map(
            ea => ea.isEmpty && ea.getLeft instanceof TestError,
          )
          .unsafeRunToPromise(),
      ),
    ));

  it('should fail the overall stream, when the main one fail, while terminating the background one', () => {
    const bg = Stream.repeatEval<IOF, void>(IO.pure(42)['>>>'](IO.sleep(50)));
    const fg = Stream.throwError(new TestError()).delayBy(IO.Temporal)(25);
    return fg
      .concurrently(IO.Concurrent)(bg)
      .compileConcurrent()
      .drain.attempt.map(ea => expect(ea).toEqual(Left(new TestError())))
      .unsafeRunToPromise();
  });

  it.ticked(
    'should terminate the background stream when the primary one finishes (stepped)',
    ticker => {
      let backgroundStarted = false;
      let backgroundTerminated = false;
      const s1 = Stream(1, 2, 3, 4, 5).delayBy(IO.Temporal)(2_000);
      const s2 = Stream.bracket<IOF, void>(
        IO.sleep(1_000)['>>>'](IO(() => (backgroundStarted = true)).void),
        () => IO(() => (backgroundTerminated = true)).void,
      ).evalMap(() => IO.never);

      let result: List<number> | undefined;
      const io = s1
        .concurrently(IO.Concurrent)(s2)
        .compileConcurrent()
        .toList.flatMap(xs => IO(() => (result = xs))).void;

      io.unsafeRunToPromise({
        config: { autoSuspendThreshold: Infinity, traceBufferSize: 16 },
        executionContext: ticker.ctx,
        shutdown: () => {},
      });

      // after 1 second:
      //  background stream should start, the overall stream should not be finished
      ticker.ctx.tick();
      ticker.ctx.tick(1_000);
      expect(backgroundStarted).toBe(true);
      expect(backgroundTerminated).toBe(false);
      expect(result).toBeUndefined();

      // after 2 seconds:
      //  background stream should finish, the overall stream should be finished
      ticker.ctx.tick();
      ticker.ctx.tick(1_000);
      expect(backgroundStarted).toBe(true);
      expect(backgroundTerminated).toBe(true);
      expect(result).toEqual(List(1, 2, 3, 4, 5));
    },
  );

  it('should terminate the background stream when the primary one finishes', () =>
    fc.assert(
      fc.asyncProperty(A.fp4tsPureStreamGenerator(fc.integer()), s => {
        const bg = Stream.repeatEval<IOF, void>(
          IO.pure(42)['>>>'](IO.sleep(50)),
        );
        const fg = s.delayBy(IO.Temporal)(20);
        return fg
          .concurrently(IO.Concurrent)(bg)
          .compileConcurrent()
          .drain.unsafeRunToPromise();
      }),
    ));

  it('should fail the overall stream, when the background one fails while primary one hangs', () =>
    fc.assert(
      fc.asyncProperty(A.fp4tsPureStreamGenerator(fc.integer()), s => {
        const bg = Stream.throwError(new TestError());
        const fg = Stream(1)
          .delayBy(IO.Temporal)(20)
          .concat(s)
          .evalTap(IO.Functor)(() => IO.never);

        return fg
          .concurrently(IO.Concurrent)(bg)
          .compileConcurrent()
          .drain.attempt.map(ea => expect(ea).toEqual(Left(new TestError())))
          .unsafeRunToPromise();
      }),
    ));
});
