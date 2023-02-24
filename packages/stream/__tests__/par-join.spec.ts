// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { $, pipe } from '@fp4ts/core';
import {
  Eq,
  List,
  Left,
  Right,
  Some,
  OptionTF,
  KleisliF,
  Monad,
  OptionT,
} from '@fp4ts/cats';
import { IO, IOF, Concurrent } from '@fp4ts/effect';
import { Stream } from '@fp4ts/stream-core';
import * as A from '@fp4ts/stream-test-kit/lib/arbitraries';
import { TestError } from './test-error';

const setsEqual =
  <T>(expected: Set<T>) =>
  (actual: Set<T>): boolean =>
    actual.size === expected.size &&
    [...actual.values()].every(x => expected.has(x));

describe('Stream Parallel Join', () => {
  test('no concurrency', () => {
    fc.assert(
      fc.asyncProperty(A.fp4tsPureStreamGenerator(fc.integer()), s => {
        const expected = s.toList;
        return s
          .map(x => Stream.pure(x))
          .parJoin(IO.Concurrent)(1)
          .compileConcurrent()
          .toList.map(xs => xs.equals(expected))
          .unsafeRunToPromise();
      }),
    );
  });

  test('concurrency', () =>
    fc.assert(
      fc.asyncProperty(
        A.fp4tsPureStreamGenerator(fc.integer()),
        fc.nat(),
        (s, n0) => {
          const n = (n0 % 20) + 1;
          const expected = new Set([...s.toList]);
          return s
            .map(x => Stream.pure(x))
            .parJoin(IO.Concurrent)(n)
            .compileConcurrent()
            .toList.map(xs => new Set([...xs]))
            .map(setsEqual(expected))
            .unsafeRunToPromise();
        },
      ),
    ));

  test('concurrent flattening', () =>
    fc.assert(
      fc.asyncProperty(
        A.fp4tsPureStreamGenerator(A.fp4tsPureStreamGenerator(fc.integer())),
        fc.nat(),
        (ss, n0) => {
          const n = (n0 % 20) + 1;
          const expected = new Set([...ss.flatten.toList]);
          return ss
            .parJoin(IO.Concurrent)(n)
            .compileConcurrent()
            .toList.map(xs => new Set([...xs]))
            .map(setsEqual(expected))
            .unsafeRunToPromise();
        },
      ),
    ));

  test('merge consistency', () =>
    fc.assert(
      fc.asyncProperty(
        A.fp4tsPureStreamGenerator(fc.integer()),
        A.fp4tsPureStreamGenerator(fc.integer()),
        (s1, s2) => {
          const parJoined = Stream(s1, s2)
            .parJoin(IO.Concurrent)(2)
            .compileConcurrent()
            .toList.map(xs => new Set([...xs]));

          const merged = s1
            .merge(IO.Concurrent)(s2)
            .compileConcurrent()
            .toList.map(xs => new Set([...xs]));

          return Monad.Do(IO.Monad)(function* (_) {
            const pj = yield* _(parJoined);
            const merged_ = yield* _(merged);
            return setsEqual(pj)(merged_);
          }).unsafeRunToPromise();
        },
      ),
    ));

  it('should release resources acquired by the outer stream after the ones acquired by the inner streams are released', () => {
    const bracketed = Stream.bracket(IO.ref(true), ref => ref.set(false));

    const s = bracketed.map(b =>
      Stream.evalF(b.get())
        .flatMap(b => (b ? Stream({}) : Stream.throwError(new Error())))
        .repeat.take(10_000),
    );

    return s
      .parJoinUnbounded(IO.Concurrent)
      .compileConcurrent()
      .drain.unsafeRunToPromise();
  });

  it('should run finalizers of the inner stream first', () =>
    fc.assert(
      fc.asyncProperty(
        A.fp4tsPureStreamGenerator(fc.integer()),
        fc.boolean(),
        (s, bias) => {
          const err = new TestError();
          const biasIdx = bias ? 1 : 0;

          return Monad.Do(IO.Monad)(function* (_) {
            const finalizerRef = yield* _(IO.ref<List<string>>(List.empty));
            const runEvidenceRef = yield* _(IO.ref<List<number>>(List.empty));
            const halt = yield* _(IO.deferred<void>());

            const bracketed = Stream.bracket(IO.unit, () =>
              finalizerRef.update(xs => xs.append('Outer')),
            );

            const registerRun = (idx: number): IO<void> =>
              runEvidenceRef.update(xs => xs.append(idx));

            const finalizer = (idx: number): IO<void> =>
              idx === biasIdx
                ? IO.sleep(50)
                    ['>>>'](
                      finalizerRef.update(xs => xs.append(`Inner ${idx}`)),
                    )
                    ['>>>'](IO.throwError(err))
                : finalizerRef.update(xs => xs.append(`Inner ${idx}`));

            const prg0 = bracketed.flatMap(() =>
              Stream<IOF, Stream<IOF, number>>(
                Stream.bracket(registerRun(0), () => finalizer(0)).flatMap(
                  () => s,
                ),
                Stream.bracket(registerRun(1), () => finalizer(1)).flatMap(() =>
                  Stream.execF(halt.complete()),
                ),
              ),
            );

            return yield* _(
              prg0
                .parJoinUnbounded(IO.Concurrent)
                .compileConcurrent(IO.Concurrent)
                .drain.attempt.flatMap(result =>
                  Monad.Do(IO.Monad)(function* (_) {
                    const finalizers = yield* _(finalizerRef.get());
                    const streamExecuted = yield* _(runEvidenceRef.get());
                    const expectedFinalizers = streamExecuted
                      .map(idx => `Inner ${idx}`)
                      .append('Outer');

                    return (
                      setsEqual(new Set([...expectedFinalizers]))(
                        new Set([...finalizers]),
                      ) &&
                      finalizers.last === 'Outer' &&
                      ([...streamExecuted].includes(biasIdx)
                        ? result.isLeft() && result.getLeft instanceof TestError
                        : result.isRight())
                    );
                  }),
                ),
            );
          }).unsafeRunToPromise();
        },
      ),
      { numRuns: 40 },
    ));

  describe('hangs', () => {
    const full = Stream.repeat(42).chunks.evalTap(IO.Functor)(
      () => IO.suspend,
    ).unchunks;
    const hang = Stream.repeatEval<IOF, never>(IO.never);
    const hang2: Stream<IOF, never> = full.drain;
    const hang3: Stream<IOF, never> = Stream.repeatEval<IOF, void>(
      IO.async_<void>(cb => cb(Right(undefined)))['>>>'](IO.suspend),
    ).drain;

    test('1', () =>
      Stream(full, hang)
        .parJoin(IO.Concurrent)(10)
        .take(1)
        .compileConcurrent()
        .last.flatMap(x => IO(() => expect(x).toBe(42)))
        .unsafeRunToPromise());

    test('2', () =>
      Stream(full, hang2)
        .parJoin(IO.Concurrent)(10)
        .take(1)
        .compileConcurrent()
        .last.flatMap(x => IO(() => expect(x).toBe(42)))
        .unsafeRunToPromise());

    test('3', () =>
      Stream(full, hang3)
        .parJoin(IO.Concurrent)(10)
        .take(1)
        .compileConcurrent()
        .last.flatMap(x => IO(() => expect(x).toBe(42)))
        .unsafeRunToPromise());

    test('4', () =>
      Stream(hang3, hang2, full)
        .parJoin(IO.Concurrent)(10)
        .take(1)
        .compileConcurrent()
        .last.flatMap(x => IO(() => expect(x).toBe(42)))
        .unsafeRunToPromise());
  });

  it('should terminate when the inner fails', () =>
    Stream(Stream.sleep(IO.Temporal)(3600), Stream.throwError(new TestError()))
      .parJoinUnbounded(IO.Concurrent)
      .compileConcurrent()
      .drain.attempt.flatMap(ea =>
        IO(() => expect(ea).toEqual(Left(new TestError()))),
      )
      .unsafeRunToPromise());

  it('should propagate error from inner stream before +++', () =>
    Stream(Stream.throwError(new TestError()))
      .parJoinUnbounded(IO.Concurrent)
      ['+++'](Stream(1))
      .compileConcurrent()
      .toList.attempt.flatMap(ea =>
        IO(() => expect(ea).toEqual(Left(new TestError()))),
      )
      .unsafeRunToPromise());

  describe('short-circuiting', () => {
    it('should not block while evaluating stream of streams in IO in parallel', () => {
      const f = (n: number): Stream<IOF, string> => Stream(n).map(x => `${x}`);

      return Stream(1, 2, 3)
        .map(f)
        .parJoinUnbounded(IO.Concurrent)
        .compileConcurrent()
        .toList.map(xs => new Set([...xs]))
        .flatMap(xs => IO(() => expect(xs).toEqual(new Set(['1', '2', '3']))))
        .unsafeRunToPromise();
    });

    it('should not block while evaluating stream of streams in $<OptionTK, [IoK]> in parallel', () => {
      const F = Concurrent.forOptionT(IO.Concurrent);
      const f = (n: number): Stream<$<OptionTF, [IOF]>, string> =>
        Stream(n).map(x => `${x}`);

      return pipe(
        Stream(1, 2, 3).map(f).parJoinUnbounded(F).compileConcurrent(F).toList,
        F.map(xs => new Set([...xs])),
        F.flatMap(xs =>
          IO(() => Some(expect(xs).toEqual(new Set(['1', '2', '3'])))),
        ),
        OptionT.getOrElseF(IO.Monad)(() => IO(() => fail() as void)),
      ).unsafeRunToPromise();
    });

    it('should not block while evaluating stream of streams in $<KleisliK, [IoK, unknown]> in parallel', () => {
      const F = Concurrent.forKleisli(IO.Concurrent);
      const f = (n: number): Stream<$<KleisliF, [IOF, void]>, string> =>
        Stream(n).map(x => `${x}`);

      return Stream(1, 2, 3)
        .map(f)
        .parJoinUnbounded(F)
        .compileConcurrent(F)
        .toList(undefined)
        .map(xs => new Set([...xs]))
        .flatMap(xs => IO(() => expect(xs).toEqual(new Set(['1', '2', '3']))))
        .unsafeRunToPromise();
    });
  });
});
