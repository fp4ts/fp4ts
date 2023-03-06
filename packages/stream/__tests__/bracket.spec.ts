// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit/lib/jest-extension';
import fc from 'fast-check';
import { throwError } from '@fp4ts/core';
import { List } from '@fp4ts/collections';
import { IO, IOF, ExitCase, Ref } from '@fp4ts/effect';
import { Stream } from '@fp4ts/stream-core';
import * as A from '@fp4ts/stream-test-kit/lib/arbitraries';
import { Counter } from './counter';
import { TestError } from './test-error';

describe('Stream Bracket', () => {
  const Acquired = { tag: 'acquired' };
  type Acquired = typeof Acquired;
  const Released = { tag: 'acquired' };
  type Released = typeof Released;
  type BracketEvent = Acquired | Released;

  const recordBracketEvents = (
    events: Ref<IOF, List<BracketEvent>>,
  ): Stream<IOF, void> =>
    Stream.bracket(
      events.update(es => es.append(Acquired)),
      () => events.update(es => es.append(Released)),
    );

  const eraseTestError = (err: Error): IO<void> =>
    err instanceof TestError ? IO.unit : IO.throwError(err);

  describe('single bracket', () => {
    const singleBracketTest = <A>(use: Stream<IOF, A>): IO<void> =>
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
      use1: Stream<IOF, A>,
      use2: Stream<IOF, A>,
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
              const interMost: Stream<IOF, number> = failOnFinalize
                ? Stream.bracket<IOF, void>(counter.increment, () =>
                    counter.decrement['>>>'](IO.throwError(new TestError())),
                  ).drain
                : Stream.throwError(new TestError());

              const nested = s0.foldRight_(interMost, (i, inner) =>
                Stream.bracket<IOF, void>(
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
        fc.integer({ min: -10, max: 10 }),
        fc.integer({ min: -10, max: 10 }),
        fc.integer({ min: -10, max: 10 }),
        (s, i, j, k) =>
          Counter.of(IO.Sync)
            .flatMap(counter => {
              const bracketed = Stream.bracket<IOF, void>(
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

      return Stream.bracket<IOF, void>(
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
          .covary<IOF>()
          .flatMap(() =>
            Stream.bracket<IOF, void>(
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
    const s = Stream.bracket<IOF, void>(
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
                Stream.bracket<IOF, number>(
                  IO(() => i),
                  () => track.update(xs => xs.append(i)),
                ).flatMap(() => acc),
              Stream(0).covary<IOF>(),
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
                Stream.bracket<IOF, number>(
                  IO(() => i),
                  () => track.update(xs => xs.append(i)),
                ).flatMap(() => acc),
              Stream(1)
                .covary<IOF>()
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

  describe('error handling', () => {
    it.ticked(
      'should propagate failed error closing scope on right',
      ticker => {
        const s1 = Stream.bracket<IOF, number>(
          IO(() => 1),
          () => IO.unit,
        );
        const s2 = Stream.bracket<IOF, string>(
          IO(() => 'a'),
          () => IO.throwError(new TestError()),
        );

        expect(s1.zip(s2).compileConcurrent().drain).toFailWith(
          new TestError(),
          ticker,
        );
      },
    );

    it.ticked('should propagate failed error closing scope on left', ticker => {
      const s1 = Stream.bracket<IOF, number>(
        IO(() => 1),
        () => IO.throwError(new TestError()),
      );
      const s2 = Stream.bracket<IOF, string>(
        IO(() => 'a'),
        () => IO.unit,
      );

      expect(s1.zip(s2).compileConcurrent().drain).toFailWith(
        new TestError(),
        ticker,
      );
    });

    test('handleErrorWith closes closes', () =>
      Ref.of(IO.Sync)<List<BracketEvent>>(List.empty)
        .flatMap(events =>
          recordBracketEvents(events)
            .flatMap(() => Stream.throwError(new TestError()))
            .handleErrorWith(() => Stream.empty())
            .concat(recordBracketEvents(events))
            .compileConcurrent()
            .drain.flatMap(() =>
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
        )
        .unsafeRunToPromise());
  });

  it.ticked('should call finalizer on bracket full when success', ticker => {
    let ec: ExitCase | undefined;
    const s = Stream.bracketFull(IO.MonadCancel)(
      () => IO.pure(42),
      (_, ec_) => IO(() => (ec = ec_)).void,
    );

    const io = s.compileConcurrent().last;
    expect(io).toCompleteWith(42, ticker);
    expect(ec).toEqual(ExitCase.Succeeded);
  });

  it.ticked('should call finalizer on bracket full when failed', ticker => {
    let ec: ExitCase | undefined;
    const s = Stream.bracketFull(IO.MonadCancel)(
      () => IO.unit,
      (_, ec_) => IO(() => (ec = ec_)).void,
    ).evalMap(() => IO.throwError(new Error('test error')));

    const io = s.compileConcurrent().drain;
    expect(io).toFailWith(new Error('test error'), ticker);
    expect(ec).toEqual(ExitCase.Errored(new Error('test error')));
  });

  it.ticked('should call finalizer on bracket full when finalized', ticker => {
    let ec: ExitCase | undefined;
    let canceled = false;
    const s = Stream.bracketFull(IO.MonadCancel)(
      () => IO.unit,
      (_, ec_) => IO(() => (ec = ec_)).void,
    )
      .evalMap(() => IO.never.onCancel(IO(() => (canceled = true)).void))
      .interruptWhen(IO.sleep(2_000).attempt);

    const io = s.compileConcurrent().drain;
    io.unsafeRunToPromise({
      config: { autoSuspendThreshold: Infinity, traceBufferSize: 16 },
      executionContext: ticker.ctx,
      shutdown: () => {},
    });

    ticker.ctx.tick();
    ticker.ctx.tick(1_000);
    expect(ec).toBeUndefined();
    expect(canceled).toBe(false);

    ticker.ctx.tick(1_000);
    expect(ec).toEqual(ExitCase.Canceled);
    expect(canceled).toBe(true);
  });
});
