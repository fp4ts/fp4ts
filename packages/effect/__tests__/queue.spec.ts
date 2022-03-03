// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id, Kind } from '@fp4ts/core';
import { Option, None, Queue as CatsQueue, Monad } from '@fp4ts/cats';
import { IO, IOF } from '@fp4ts/effect-core';
import { Queue } from '@fp4ts/effect-std';
import { AssertionError } from 'assert';

interface QueueLike<F, A> {
  construct(capacity: number): Kind<F, [Queue<F, A>]>;
  size(q: Queue<F, A>): Kind<F, [number]>;
  take(q: Queue<F, A>): Kind<F, [A]>;
  tryTake(q: Queue<F, A>): Kind<F, [Option<A>]>;
  offer(q: Queue<F, A>, a: A): Kind<F, [void]>;
  tryOffer(q: Queue<F, A>, a: A): Kind<F, [boolean]>;
}
type QueueLikeRequirements<F, A> = Pick<QueueLike<F, A>, 'construct'>;
const QueueLike = Object.freeze({
  of: <F, A>(F: QueueLikeRequirements<F, A>): QueueLike<F, A> => ({
    ...F,
    offer: (q, x) => q.offer(x),
    size: q => q.size,
    take: q => q.take(),
    tryOffer: (q, x) => q.tryOffer(x),
    tryTake: q => q.tryTake(),
  }),
});

describe('Queue', () => {
  describe('BoundedQueue', () => {
    const Q = QueueLike.of<IOF, number>({
      construct: Queue.bounded(IO.Concurrent),
    });

    test('offer with zero capacity', () =>
      Monad.Do(IO.Monad)(function* (_) {
        const q = yield* _(Q.construct(0));
        yield* _(Q.offer(q, 1).fork);
        const v1 = yield* _(Q.take(q));
        const f = yield* _(Q.take(q).fork);
        yield* _(Q.offer(q, 2));
        const v2 = yield* _(f.joinWithNever());
        yield* _(IO(() => expect([v1, v2]).toEqual([1, 2])));
      }).unsafeRunToPromise());

    test('async take with zero capacity', () =>
      Monad.Do(IO.Monad)(function* (_) {
        const q = yield* _(Q.construct(0));
        const ref = yield* _(IO.ref(false));
        yield* _(Q.offer(q, 1).fork);
        const v1 = yield* _(Q.take(q));
        yield* _(IO(() => expect(v1).toBe(1)));
        const p = yield* _(IO(() => Q.take(q).unsafeRunToPromise()));
        yield* _(
          ref.get().flatMap(resolved => IO(() => expect(resolved).toBe(false))),
        );
        yield* _(Q.offer(q, 2));
        const v2 = yield* _(IO.fromPromise(IO.pure(p)));
        yield* _(IO(() => expect(v2).toBe(2)));
      }).unsafeRunToPromise());

    test('offer/take with zero capacity', () => {
      const count = 1000;

      const producer = (q: Queue<IOF, number>, n: number): IO<void> =>
        n > 0
          ? Q.offer(q, count - n).flatMap(() => producer(q, n - 1))
          : IO.unit;

      const consumer = (
        q: Queue<IOF, number>,
        n: number,
        acc: CatsQueue<number> = CatsQueue.empty,
      ): IO<number> =>
        n > 0
          ? Q.take(q).flatMap(a => consumer(q, n - 1, acc.enqueue(a)))
          : IO.pure(acc.foldLeft(0, (x, y) => x + y));

      return Monad.Do(IO.Monad)(function* (_) {
        const q = yield* _(Q.construct(0));
        const p = yield* _(producer(q, count).fork);
        const c = yield* _(consumer(q, count).fork);
        yield* _(p.join);
        const r = yield* _(c.joinWithNever());
        yield* _(IO(() => expect(r).toBe((count * (count - 1)) / 2)));
      }).unsafeRunToPromise();
    });

    negativeCapacityConstructor(Q);
    tryOfferOnFull(Q, false);
    offerTakeOverCapacityTests(Q);
    cancelableOfferTests(Q);
    tryOfferTryTakeTests(Q);
    commonTests(Q);
  });

  describe('UnboundedQueue', () => {
    describe('Unbounded', () => {
      unboundedQueueTests(
        QueueLike.of<IOF, number>({
          construct: () => Queue.unbounded(IO.Concurrent),
        }),
      );
    });

    describe('Unbounded mapK', () => {
      unboundedQueueTests(
        QueueLike.of<IOF, number>({
          construct: () => Queue.unbounded(IO.Concurrent).map(x => x.mapK(id)),
        }),
      );
    });

    function unboundedQueueTests(Q: QueueLike<IOF, number>) {
      tryOfferOnFull(Q, true);
      tryOfferTryTakeTests(Q);
      commonTests(Q);
    }
  });

  describe('DroppingQueue', () => {
    describe('Dropping', () => {
      droppingQueueTests(
        QueueLike.of({
          construct: Queue.dropping(IO.Concurrent),
        }),
      );
    });

    describe('Dropping mapK', () => {
      droppingQueueTests(
        QueueLike.of({
          construct: n => Queue.dropping(IO.Concurrent)(n).map(q => q.mapK(id)),
        }),
      );
    });

    function droppingQueueTests(Q: QueueLike<IOF, number>) {
      zeroCapacityConstructor(Q);
      negativeCapacityConstructor(Q);
      tryOfferOnFull(Q, false);
      cancelableOfferTests(Q);
      tryOfferTryTakeTests(Q);
      commonTests(Q);
    }
  });

  describe('CircularBufferQueue', () => {
    describe('CircularBuffer', () => {
      circularBufferQueueTests(
        QueueLike.of({
          construct: Queue.circularBuffer(IO.Concurrent),
        }),
      );
    });

    describe('circularBuffer mapK', () => {
      circularBufferQueueTests(
        QueueLike.of({
          construct: n =>
            Queue.circularBuffer(IO.Concurrent)(n).map(q => q.mapK(id)),
        }),
      );
    });

    function circularBufferQueueTests(Q: QueueLike<IOF, number>) {
      zeroCapacityConstructor(Q);
      negativeCapacityConstructor(Q);
      tryOfferOnFull(Q, true);
      commonTests(Q);
    }
  });
});

function zeroCapacityConstructor(Q: QueueLike<IOF, number>) {
  it('should throw an exception when constructed with zero capacity', () =>
    IO.defer(() => Q.construct(0))
      .attempt.flatMap(r =>
        IO(() => {
          expect(r.isLeft).toBe(true);
          expect(r.getLeft).toBeInstanceOf(AssertionError);
        }),
      )
      .unsafeRunToPromise());
}

function negativeCapacityConstructor(Q: QueueLike<IOF, number>) {
  it('should throw an exception when constructed with negative capacity', () =>
    IO.defer(() => Q.construct(-1))
      .attempt.flatMap(r =>
        IO(() => {
          expect(r.isLeft).toBe(true);
          expect(r.getLeft).toBeInstanceOf(AssertionError);
        }),
      )
      .unsafeRunToPromise());
}

function tryOfferOnFull(Q: QueueLike<IOF, number>, expected: boolean) {
  test('tryOffer on full', () =>
    Monad.Do(IO.Monad)(function* (_) {
      const q = yield* _(Q.construct(1));
      yield* _(Q.offer(q, 0));
      const r = yield* _(Q.tryOffer(q, 1));
      yield* _(IO(() => expect(r).toBe(expected)));
    }).unsafeRunToPromise());
}

function offerTakeOverCapacityTests(Q: QueueLike<IOF, number>) {
  test('offer/take over capacity', () => {
    const count = 1000;

    const producer = (q: Queue<IOF, number>, n: number): IO<void> =>
      n > 0 ? Q.offer(q, count - n).flatMap(() => producer(q, n - 1)) : IO.unit;

    const consumer = (
      q: Queue<IOF, number>,
      n: number,
      acc: CatsQueue<number> = CatsQueue.empty,
    ): IO<number> =>
      n > 0
        ? Q.take(q).flatMap(a => consumer(q, n - 1, acc.enqueue(a)))
        : IO.pure(acc.foldLeft(0, (x, y) => x + y));

    return Monad.Do(IO.Monad)(function* (_) {
      const q = yield* _(Q.construct(10));
      const p = yield* _(producer(q, count).fork);
      const c = yield* _(consumer(q, count).fork);
      yield* _(p.join);
      const r = yield* _(c.joinWithNever());
      yield* _(IO(() => expect(r).toBe((count * (count - 1)) / 2)));
    }).unsafeRunToPromise();
  });
}

function cancelableOfferTests(Q: QueueLike<IOF, number>) {
  it('should cancel pending offer', () =>
    Monad.Do(IO.Monad)(function* (_) {
      const q = yield* _(Q.construct(1));
      yield* _(Q.offer(q, 1));
      const f = yield* _(Q.offer(q, 2).fork);
      yield* _(IO.sleep(10));
      yield* _(f.cancel);
      const v1 = yield* _(Q.take(q));
      const v2 = yield* _(Q.tryTake(q));
      yield* _(IO(() => expect([v1, v2]).toEqual([1, None])));
    }).unsafeRunToPromise());
}

function tryOfferTryTakeTests(Q: QueueLike<IOF, number>) {
  test('tryTake/tryOffer', () => {
    const count = 1000;

    const producer = (q: Queue<IOF, number>, n: number): IO<void> =>
      n > 0
        ? Q.tryOffer(q, count - n).flatMap(b =>
            b ? producer(q, n - 1) : IO.suspend['>>>'](producer(q, n)),
          )
        : IO.unit;

    const consumer = (
      q: Queue<IOF, number>,
      n: number,
      acc: CatsQueue<number> = CatsQueue.empty,
    ): IO<number> =>
      n > 0
        ? Q.tryTake(q).flatMap(opt =>
            opt.fold(
              () => IO.suspend['>>>'](consumer(q, n, acc)),
              a => consumer(q, n - 1, acc.enqueue(a)),
            ),
          )
        : IO.pure(acc.foldLeft(0, (x, y) => x + y));

    return Monad.Do(IO.Monad)(function* (_) {
      const q = yield* _(Q.construct(10));
      const p = yield* _(producer(q, count).fork);
      const c = yield* _(consumer(q, count).fork);
      yield* _(p.join);
      const r = yield* _(c.joinWithNever());
      yield* _(IO(() => expect(r).toBe((count * (count - 1)) / 2)));
    }).unsafeRunToPromise();
  });
}

function commonTests(Q: QueueLike<IOF, number>) {
  it('should the queue size after offer/take', () =>
    Monad.Do(IO.Monad)(function* (_) {
      const q = yield* _(Q.construct(1));
      yield* _(Q.offer(q, 1));
      yield* _(Q.take(q));
      yield* _(Q.offer(q, 2));
      const size = yield* _(Q.size(q));
      yield* _(IO(() => expect(size).toBe(1)));
    }).unsafeRunToPromise());

  it('should return None when the queue is empty', () =>
    Q.construct(1)
      .flatMap(q => Q.tryTake(q))
      .flatMap(oa => IO(() => expect(oa).toEqual(None)))
      .unsafeRunToPromise());

  it('should return values in FIFO order', () =>
    Monad.Do(IO.Monad)(function* (_) {
      const q = yield* _(Q.construct(1));
      yield* _(Q.offer(q, 1));
      const v1 = yield* _(Q.take(q));
      yield* _(Q.offer(q, 2));
      const v2 = yield* _(Q.take(q));
      yield* _(IO(() => expect([v1, v2]).toEqual([1, 2])));
    }).unsafeRunToPromise());

  test('cancelable take', () =>
    Monad.Do(IO.Monad)(function* (_) {
      const q = yield* _(Q.construct(1));
      const f = yield* _(Q.take(q).fork);
      yield* _(IO.sleep(10));
      yield* _(f.cancel);
      const v = yield* _(Q.tryOffer(q, 1));
      yield* _(IO(() => expect(v).toBe(true)));
    }).unsafeRunToPromise());

  test('async take', () =>
    Monad.Do(IO.Monad)(function* (_) {
      const q = yield* _(Q.construct(1));
      const ref = yield* _(IO.ref(false));
      yield* _(Q.offer(q, 1));
      const v1 = yield* _(Q.take(q));
      yield* _(IO(() => expect(v1).toBe(1)));
      const p = yield* _(IO(() => Q.take(q).unsafeRunToPromise()));
      yield* _(
        ref.get().flatMap(resolved => IO(() => expect(resolved).toBe(false))),
      );
      yield* _(Q.offer(q, 2));
      const v2 = yield* _(IO.fromPromise(IO.pure(p)));
      yield* _(IO(() => expect(v2).toBe(2)));
    }).unsafeRunToPromise());
}
