import fc from 'fast-check';
import { throwError } from '@fp4ts/core';
import { List } from '@fp4ts/cats';
import { IO, IoK, Ref } from '@fp4ts/effect';
import { Stream } from '@fp4ts/stream-core';
import * as A from '@fp4ts/stream-test-kit/lib/arbitraries';
import { Counter } from './counter';

describe('Bracket', () => {
  class TestError extends Error {}

  const Acquired = { tag: 'acquired' };
  type Acquired = typeof Acquired;
  const Released = { tag: 'acquired' };
  type Released = typeof Released;
  type BracketEvent = Acquired | Released;

  const recordBracketEvents = (
    events: Ref<IoK, List<BracketEvent>>,
  ): Stream<IoK, void> =>
    Stream.bracket(
      events.update(es => es['::+'](Acquired)),
      () => events.update(es => es['::+'](Released)),
    );

  const eraseTestError = (err: Error): IO<void> =>
    err instanceof TestError ? IO.unit : IO.throwError(err);

  describe('single bracket', () => {
    const singleBracketTest = <A>(use: Stream<IoK, A>): IO<void> =>
      IO.ref<List<BracketEvent>>(List.empty).flatMap(events =>
        recordBracketEvents(events)
          .evalMap(() =>
            events
              .get()
              .flatMap(es => IO(() => expect(es).toEqual(List(Acquired)))),
          )
          .flatMap(() => use)
          .compileConcurrent()
          .drain.handleErrorWith(eraseTestError)
          ['>>>'](
            events
              .get()
              .flatMap(es =>
                IO(() => expect(es).toEqual(List(Acquired, Released))),
              ),
          ),
      );

    test('normal termination', () =>
      singleBracketTest(Stream.empty()).unsafeRunToPromise());

    test('failure', () =>
      singleBracketTest(
        Stream.throwError(new TestError()),
      ).unsafeRunToPromise());

    test('throw from append', () =>
      singleBracketTest(
        Stream(1, 2, 3)['+++'](Stream.defer(() => throwError(new TestError()))),
      ).unsafeRunToPromise());
  });

  describe('bracket concat with bracket', () => {
    const concatBracketTest = <A>(
      use1: Stream<IoK, A>,
      use2: Stream<IoK, A>,
    ): IO<void> =>
      IO.ref<List<BracketEvent>>(List.empty).flatMap(events =>
        recordBracketEvents(events)
          .flatMap(() => use1)
          .concat(recordBracketEvents(events).flatMap(() => use2))
          .compileConcurrent()
          .drain.handleError(eraseTestError)
          .flatMap(() =>
            events
              .get()
              .flatMap(es =>
                IO(() =>
                  expect(es).toEqual(
                    List(Acquired, Released, Acquired, Released),
                  ),
                ),
              ),
          ),
      );

    test('normal termination', () =>
      concatBracketTest(Stream.empty(), Stream.empty()).unsafeRunToPromise());
    test('failure', () =>
      concatBracketTest(
        Stream.empty(),
        Stream.throwError(new TestError()),
      ).unsafeRunToPromise());
  });

  test('nested', () =>
    fc.assert(
      fc.asyncProperty(
        A.fp4tsList(fc.integer()),
        fc.boolean(),
        (s0, failOnFinalize) =>
          Counter.of(IO.Sync)
            .flatMap<boolean>(counter => {
              const interMost: Stream<IoK, number> = failOnFinalize
                ? Stream.bracket<IoK, void>(counter.increment, () =>
                    counter.decrement['>>>'](IO.throwError(new TestError())),
                  ).drain
                : Stream.throwError(new TestError());

              const nested = s0.foldRight(interMost, (i, inner) =>
                Stream.bracket<IoK, void>(
                  counter.increment,
                  () => counter.decrement,
                ).flatMap(() => Stream(i)['+++'](inner)),
              );
              return nested
                .compileConcurrent()
                .drain.handleErrorWith(eraseTestError)
                .flatMap(() => counter.get.map(count => count === 0));
            })
            .unsafeRunToPromise(),
      ),
    ));

  test('early termination', () =>
    fc.assert(
      fc.asyncProperty(
        A.fp4tsPureStreamGenerator(fc.integer()),
        fc.integer(-10, 10),
        fc.integer(-10, 10),
        fc.integer(-10, 10),
        (s, i, j, k) =>
          Counter.of(IO.Sync)
            .flatMap(counter => {
              const bracketed = Stream.bracket<IoK, void>(
                counter.increment,
                () => counter.decrement.void,
              ).flatMap(() => s);
              const earlyTermination = bracketed.take(i);
              const twoLevels = bracketed.take(i).take(j);
              const twoLevels2 = bracketed.take(i).take(i);
              const threeLevels = bracketed.take(i).take(j).take(k);
              const fiveLevels = bracketed
                .take(i)
                .take(j)
                .take(k)
                .take(j)
                .take(i);

              const all = earlyTermination['+++'](twoLevels)
                ['+++'](twoLevels2)
                ['+++'](threeLevels)
                ['+++'](fiveLevels);

              return all
                .compileConcurrent()
                .drain['>>>'](counter.get.map(count => count === 0));
            })
            .unsafeRunToPromise(),
      ),
    ));

  it('should not call finalizer until necessary', () =>
    IO.defer(() => {
      const buffer: string[] = [];

      return Stream.bracket<IoK, void>(
        IO(() => buffer.push('Acquired')).void,
        () => IO(() => buffer.push('Released')).void,
      )
        .flatMap(() => {
          buffer.push('Used');
          return Stream.pure(undefined as void);
        })
        .flatMap(s => {
          buffer.push('FlatMapped');
          return Stream(s);
        })
        .compileConcurrent()
        .drain.flatMap(() =>
          IO(() =>
            expect(buffer).toEqual([
              'Acquired',
              'Used',
              'FlatMapped',
              'Released',
            ]),
          ),
        );
    }).unsafeRunToPromise());

  const bracketsInSequence = 20_000;
  it(`should apply ${bracketsInSequence} brackets in sequence`, () =>
    Counter.of(IO.Sync)
      .flatMap(counter =>
        Stream.range(0, bracketsInSequence)
          .covary<IoK>()
          .flatMap(() =>
            Stream.bracket<IoK, void>(
              counter.increment,
              () => counter.decrement,
            ).flatMap(() => Stream(1)),
          )
          .compileConcurrent()
          .drain.flatMap(() =>
            counter.get.flatMap(cnt => IO(() => expect(cnt).toBe(0))),
          ),
      )
      .unsafeRunToPromise());

  it('should evaluates bracketed stream twice', () => {
    const s = Stream.bracket<IoK, void>(
      IO.unit,
      () => IO.unit,
    ).compileConcurrent().drain;
    return s.flatMap(() => s).unsafeRunToPromise();
  });

  describe('LIFO finalizers ordering', () => {
    test('explicit release', () =>
      IO.ref<List<number>>(List.empty)
        .flatMap(track =>
          [...new Array(10).keys()]
            .reduce(
              (acc, i) =>
                Stream.bracket<IoK, number>(
                  IO(() => i),
                  () => track.update(xs => xs['::+'](i)),
                ).flatMap(() => acc),
              Stream(0).covary<IoK>(),
            )
            .compileConcurrent()
            .drain.flatMap(() =>
              track
                .get()
                .flatMap(xs =>
                  IO(() =>
                    expect(xs).toEqual(List(0, 1, 2, 3, 4, 5, 6, 7, 8, 9)),
                  ),
                ),
            ),
        )
        .unsafeRunToPromise());

    test('scope closure', () =>
      IO.ref<List<number>>(List.empty)
        .flatMap(track =>
          [...new Array(10).keys()]
            .reduce(
              (acc, i) =>
                Stream.bracket<IoK, number>(
                  IO(() => i),
                  () => track.update(xs => xs['::+'](i)),
                ).flatMap(() => acc),
              Stream(1)
                .covary<IoK>()
                .map(() => throwError(new TestError())),
            )
            .compileConcurrent()
            .drain.handleErrorWith(eraseTestError)
            .flatMap(() =>
              track
                .get()
                .flatMap(xs =>
                  IO(() =>
                    expect(xs).toEqual(List(0, 1, 2, 3, 4, 5, 6, 7, 8, 9)),
                  ),
                ),
            ),
        )
        .unsafeRunToPromise());
  });
});
