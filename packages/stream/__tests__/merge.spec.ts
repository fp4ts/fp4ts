import fc from 'fast-check';
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

  it(
    'should not emit ahead',
    () =>
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
      ),
    15_000,
  );
});
