// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit/lib/jest-extension';
import fc from 'fast-check';
import { pipe } from '@fp4ts/core';
import { Eq, List, Either, Left, Right, Some, None } from '@fp4ts/cats';
import { IO, IoK } from '@fp4ts/effect';
import { Stream } from '@fp4ts/stream-core';
import * as A from '@fp4ts/stream-test-kit/lib/arbitraries';
import { TestError } from './test-error';

describe('Stream merge', () => {
  test('basic', () =>
    fc.assert(
      fc.asyncProperty(
        A.fp4tsPureStreamGenerator(fc.integer()),
        A.fp4tsPureStreamGenerator(fc.integer()),
        (s1, s2) => {
          const expected = new Set([...s1.toList['+++'](s2.toList)]);

          return s1
            .merge(IO.Concurrent)(s2)
            .compileConcurrent()
            .toList.map(xs => new Set([...xs]))
            .flatMap(received => IO(() => expect(received).toEqual(expected)))
            .unsafeRunToPromise();
        },
      ),
    ));

  describe('left/right identity', () => {
    test('left identity', () =>
      fc.assert(
        fc.asyncProperty(A.fp4tsPureStreamGenerator(fc.integer()), s =>
          s
            .merge(IO.Concurrent)(Stream.empty())
            .compileConcurrent()
            .toList.flatMap(received =>
              IO(() => expect(received).toEqual(s.toList)),
            )
            .unsafeRunToPromise(),
        ),
      ));

    test('right identity', () =>
      fc.assert(
        fc.asyncProperty(A.fp4tsPureStreamGenerator(fc.integer()), s =>
          Stream.empty()
            .covaryOutput<number>()
            .merge(IO.Concurrent)(s)
            .compileConcurrent()
            .toList.flatMap(received =>
              IO(() => expect(received).toEqual(s.toList)),
            )
            .unsafeRunToPromise(),
        ),
      ));
  });

  describe('left/right failures', () => {
    it('should fail overall stream when right fails', () =>
      fc.assert(
        fc.asyncProperty(A.fp4tsPureStreamGenerator(fc.integer()), s =>
          s
            .merge(IO.Concurrent)(Stream.throwError(new TestError()))
            .compileConcurrent()
            .toList.attempt.flatMap(received =>
              IO(() => expect(received).toEqual(Left(new TestError()))),
            )
            .unsafeRunToPromise(),
        ),
      ));

    it('should fail overall stream when left fails', () =>
      fc.assert(
        fc.asyncProperty(A.fp4tsPureStreamGenerator(fc.integer()), s =>
          Stream.throwError(new TestError())
            .covaryOutput<number>()
            .merge(IO.Concurrent)(s)
            .compileConcurrent()
            .toList.attempt.flatMap(received =>
              IO(() => expect(received).toEqual(Left(new TestError()))),
            )
            .unsafeRunToPromise(),
        ),
      ));

    it('should fail overall stream when left side fails and evalMap hangs', () =>
      fc.assert(
        fc.asyncProperty(A.fp4tsPureStreamGenerator(fc.integer()), s =>
          Stream.throwError(new TestError())
            .covaryOutput<number>()
            .merge(IO.Concurrent)(s)
            .evalMap(() => IO.never)
            .compileConcurrent()
            .toList.attempt.flatMap(received =>
              IO(() => expect(received).toEqual(Left(new TestError()))),
            )
            .unsafeRunToPromise(),
        ),
      ));
  });

  it.ticked('should interleave the elements of the merged streams', ticker => {
    const s1 = Stream(1, 3, 5, 7).spaced(IO.Temporal)(250);
    const s2 = Stream(2, 4, 6, 8).spaced(IO.Temporal)(250);

    const io = s1
      .merge(IO.Concurrent)(s2.delayBy(IO.Temporal)(250))
      .compileConcurrent().toList;

    expect(io).toCompleteWith(List(1, 2, 3, 4, 5, 6, 7, 8), ticker);
  });

  it('should execute inner finalizers before the outer one', () =>
    fc.assert(
      fc.asyncProperty(
        A.fp4tsPureStreamGenerator(fc.integer()),
        fc.boolean(),
        (s, leftBias) =>
          pipe(
            IO.Do,
            IO.bindTo('finalizerRef', IO.ref<List<string>>(List.empty)),
            IO.bindTo('sideRunRef', IO.ref<[boolean, boolean]>([false, false])),
            IO.bindTo('halt', IO.deferred<void>()),
          )
            .flatMap(({ finalizerRef, sideRunRef, halt }) => {
              const bracketed = Stream.bracket<IoK, void>(IO.unit, () =>
                finalizerRef.update(xs => xs['::+']('Outer')),
              );

              const register = (side: string): IO<void> =>
                sideRunRef.update(([left, right]) =>
                  side === 'L' ? [true, right] : [left, true],
                );

              const finalizer = (side: string): IO<void> => {
                if (leftBias && side === 'L')
                  return IO.sleep(50)
                    ['>>>'](finalizerRef.update(s => s['::+'](`Inner ${side}`)))
                    ['>>>'](IO.throwError(new TestError()));
                else if (!leftBias && side === 'R')
                  return IO.sleep(50)
                    ['>>>'](finalizerRef.update(s => s['::+'](`Inner ${side}`)))
                    ['>>>'](IO.throwError(new TestError()));
                else
                  return IO.sleep(25)['>>>'](
                    finalizerRef.update(s => s['::+'](`Inner ${side}`)),
                  );
              };

              const prg = bracketed
                .flatMap(() =>
                  Stream.bracket<IoK, void>(register('L'), () => finalizer('L'))
                    .flatMap(() => s.map(() => {}))
                    .merge(IO.Concurrent)(
                      Stream.bracket(register('R'), () => finalizer('R')),
                    )
                    .flatMap(() => Stream.evalF<IoK, void>(halt.complete())),
                )
                .interruptWhen(halt.get().attempt);

              return prg.compileConcurrent().drain.attempt.flatMap(r =>
                finalizerRef.get().map(finalizers => {
                  return (
                    List('Inner L', 'Inner R', 'Outer').all(x =>
                      [...finalizers].includes(x),
                    ) &&
                    finalizers.lastOption.equals(Some('Outer')) &&
                    r.isLeft &&
                    r.getLeft instanceof TestError
                  );
                }),
              );
            })
            .unsafeRunToPromise(),
      ),
      { numRuns: 50 },
    ));

  describe('hangs', () => {
    const full = Stream.repeat(42);
    const hang = Stream.repeatEval<IoK, number>(IO.never);
    const hang2: Stream<IoK, number> = full.drain;
    const hang3: Stream<IoK, number> = Stream.repeatEval<IoK, void>(
      IO.async_<void>(cb => cb(Either.rightUnit))['>>>'](IO.suspend),
    ).drain;

    const doTest = (s1: Stream<IoK, number>, s2: Stream<IoK, number>) =>
      s1
        .merge(IO.Concurrent)(s2)
        .take(1)
        .compileConcurrent()
        .last.attempt.flatMap(r => IO(() => expect(r).toEqual(Right(42))))
        .unsafeRunToPromise();

    test('1', () => doTest(full, hang));
    test('2', () => doTest(full, hang2));
    test('3', () => doTest(full, hang3));
    test('4', () => doTest(hang, full));
    test('5', () => doTest(hang2, full));
    test('6', () => doTest(hang3, full));
  });

  test('mergeHaltBoth', () =>
    fc.assert(
      fc.asyncProperty(
        A.fp4tsPureStreamGenerator(fc.integer()),
        A.fp4tsPureStreamGenerator(fc.integer()),
        (s1, s2) => {
          const s1List = s1.toList;
          const s2List = s2.toList;

          return s1
            .map(Left)
            .covaryOutput<Either<number, number>>()
            .mergeHaltBoth(IO.Concurrent)(s2.map(Right))
            .compileConcurrent()
            .toList.map(
              eas =>
                eas
                  .collect(ea => ea.fold(Some, () => None))
                  .equals(Eq.primitive, s1List) ||
                eas
                  .collect(ea => ea.fold(() => None, Some))
                  .equals(Eq.primitive, s2List),
            )
            .unsafeRunToPromise();
        },
      ),
    ));

  test('mergeHaltL', () =>
    fc.assert(
      fc.asyncProperty(
        A.fp4tsPureStreamGenerator(fc.integer()),
        A.fp4tsPureStreamGenerator(fc.integer()),
        (s1, s2) =>
          s1
            .map(Left)
            .covaryOutput<Either<number, number>>()
            .mergeHaltL(IO.Concurrent)(s2.map(Right))
            .compileConcurrent()
            .toList.map(eas =>
              eas
                .collect(ea => ea.fold(Some, () => None))
                .equals(Eq.primitive, s1.toList),
            )
            .unsafeRunToPromise(),
      ),
    ));

  test('mergeHaltR', () =>
    fc.assert(
      fc.asyncProperty(
        A.fp4tsPureStreamGenerator(fc.integer()),
        A.fp4tsPureStreamGenerator(fc.integer()),
        (s1, s2) =>
          s1
            .map(Left)
            .covaryOutput<Either<number, number>>()
            .mergeHaltR(IO.Concurrent)(s2.map(Right))
            .compileConcurrent()
            .toList.map(eas =>
              eas
                .collect(ea => ea.fold(() => None, Some))
                .equals(Eq.primitive, s2.toList),
            )
            .unsafeRunToPromise(),
      ),
    ));

  it('should not emit ahead', () =>
    fc.assert(
      fc.asyncProperty(fc.integer(), v =>
        IO.ref(v)
          .flatMap(ref =>
            Stream.repeatEval<IoK, number>(ref.get())
              .merge(IO.Concurrent)(Stream.never(IO.Spawn))
              .evalMap(value =>
                IO.sleep(50)
                  ['>>>'](ref.set(value + 1))
                  ['>>>'](IO(() => value)),
              )
              .take(2)
              .compileConcurrent()
              .toList.map(xs => xs.equals(Eq.primitive, List(v, v + 1))),
          )
          .unsafeRunToPromise(),
      ),
      { numRuns: 30 },
    ));
});
