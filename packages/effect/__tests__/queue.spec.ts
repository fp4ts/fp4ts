// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit';
import { id, Kind } from '@fp4ts/core';
import { Option, None, Seq } from '@fp4ts/cats';
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

    test.real('offer with zero capacity', () =>
      IO.Monad.do(function* (_) {
        const q = yield* _(Q.construct(0));
        yield* _(Q.offer(q, 1).fork);
        const v1 = yield* _(Q.take(q));
        const f = yield* _(Q.take(q).fork);
        yield* _(Q.offer(q, 2));
        const v2 = yield* _(f.joinWithNever());
        expect([v1, v2]).toEqual([1, 2]);
      }),
    );

    test.real('async take with zero capacity', () =>
      IO.Monad.do(function* (_) {
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
        expect(v2).toBe(2);
      }),
    );

    test.real('offer/take with zero capacity', () => {
      const count = 1000;

      const producer = (q: Queue<IOF, number>, n: number): IO<void> =>
        n > 0
          ? Q.offer(q, count - n).flatMap(() => producer(q, n - 1))
          : IO.unit;

      const consumer = (
        q: Queue<IOF, number>,
        n: number,
        acc: Seq<number> = Seq.empty,
      ): IO<number> =>
        n > 0
          ? Q.take(q).flatMap(a => consumer(q, n - 1, acc.append(a)))
          : IO.pure(acc.foldLeft(0, (x, y) => x + y));

      return IO.Monad.do(function* (_) {
        const q = yield* _(Q.construct(0));
        const p = yield* _(producer(q, count).fork);
        const c = yield* _(consumer(q, count).fork);
        yield* _(p.join);
        const r = yield* _(c.joinWithNever());
        expect(r).toBe((count * (count - 1)) / 2);
      });
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
        QueueLike.of({
          construct: () => Queue.unbounded<IOF, number>(IO.Concurrent),
        }),
      );
    });

    describe('Unbounded mapK', () => {
      unboundedQueueTests(
        QueueLike.of({
          construct: () =>
            Queue.unbounded<IOF, number>(IO.Concurrent).map(x => x.mapK(id)),
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
        QueueLike.of<IOF, number>({
          construct: Queue.dropping(IO.Concurrent),
        }),
      );
    });

    describe('Dropping mapK', () => {
      droppingQueueTests(
        QueueLike.of({
          construct: n =>
            Queue.dropping(IO.Concurrent)<number>(n).map(q => q.mapK(id)),
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
        QueueLike.of<IOF, number>({
          construct: Queue.circularBuffer(IO.Concurrent),
        }),
      );
    });

    describe('circularBuffer mapK', () => {
      circularBufferQueueTests(
        QueueLike.of({
          construct: n =>
            Queue.circularBuffer(IO.Concurrent)<number>(n).map(q => q.mapK(id)),
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
  it.real('should throw an exception when constructed with zero capacity', () =>
    IO.defer(() => Q.construct(0)).attempt.map(r => {
      expect(r.isLeft()).toBe(true);
      expect(r.getLeft).toBeInstanceOf(AssertionError);
    }),
  );
}

function negativeCapacityConstructor(Q: QueueLike<IOF, number>) {
  it.real(
    'should throw an exception when constructed with negative capacity',
    () =>
      IO.defer(() => Q.construct(-1)).attempt.map(r => {
        expect(r.isLeft()).toBe(true);
        expect(r.getLeft).toBeInstanceOf(AssertionError);
      }),
  );
}

function tryOfferOnFull(Q: QueueLike<IOF, number>, expected: boolean) {
  test.real('tryOffer on full', () =>
    IO.Monad.do(function* (_) {
      const q = yield* _(Q.construct(1));
      yield* _(Q.offer(q, 0));
      const r = yield* _(Q.tryOffer(q, 1));
      expect(r).toBe(expected);
    }),
  );
}

function offerTakeOverCapacityTests(Q: QueueLike<IOF, number>) {
  test.real('offer/take over capacity', () => {
    const count = 1000;

    const producer = (q: Queue<IOF, number>, n: number): IO<void> =>
      n > 0 ? Q.offer(q, count - n).flatMap(() => producer(q, n - 1)) : IO.unit;

    const consumer = (
      q: Queue<IOF, number>,
      n: number,
      acc: Seq<number> = Seq.empty,
    ): IO<number> =>
      n > 0
        ? Q.take(q).flatMap(a => consumer(q, n - 1, acc.append(a)))
        : IO.pure(acc.foldLeft(0, (x, y) => x + y));

    return IO.Monad.do(function* (_) {
      const q = yield* _(Q.construct(10));
      const p = yield* _(producer(q, count).fork);
      const c = yield* _(consumer(q, count).fork);
      yield* _(p.join);
      const r = yield* _(c.joinWithNever());
      expect(r).toBe((count * (count - 1)) / 2);
    });
  });
}

function cancelableOfferTests(Q: QueueLike<IOF, number>) {
  it.real('should cancel pending offer', () =>
    IO.Monad.do(function* (_) {
      const q = yield* _(Q.construct(1));
      yield* _(Q.offer(q, 1));
      const f = yield* _(Q.offer(q, 2).fork);
      yield* _(IO.sleep(10));
      yield* _(f.cancel);
      const v1 = yield* _(Q.take(q));
      const v2 = yield* _(Q.tryTake(q));
      expect([v1, v2]).toEqual([1, None]);
    }),
  );
}

function tryOfferTryTakeTests(Q: QueueLike<IOF, number>) {
  test.real('tryTake/tryOffer', () => {
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
      acc: Seq<number> = Seq.empty,
    ): IO<number> =>
      n > 0
        ? Q.tryTake(q).flatMap(opt =>
            opt.fold(
              () => IO.suspend['>>>'](consumer(q, n, acc)),
              a => consumer(q, n - 1, acc.append(a)),
            ),
          )
        : IO.pure(acc.foldLeft(0, (x, y) => x + y));

    return IO.Monad.do(function* (_) {
      const q = yield* _(Q.construct(10));
      const p = yield* _(producer(q, count).fork);
      const c = yield* _(consumer(q, count).fork);
      yield* _(p.join);
      const r = yield* _(c.joinWithNever());
      expect(r).toBe((count * (count - 1)) / 2);
    });
  });
}

function commonTests(Q: QueueLike<IOF, number>) {
  it.real('should the queue size after offer/take', () =>
    IO.Monad.do(function* (_) {
      const q = yield* _(Q.construct(1));
      yield* _(Q.offer(q, 1));
      yield* _(Q.take(q));
      yield* _(Q.offer(q, 2));
      const size = yield* _(Q.size(q));
      expect(size).toBe(1);
    }),
  );

  it.real('should return None when the queue is empty', () =>
    Q.construct(1)
      .flatMap(q => Q.tryTake(q))
      .map(oa => expect(oa).toEqual(None)),
  );

  it.real('should return values in FIFO order', () =>
    IO.Monad.do(function* (_) {
      const q = yield* _(Q.construct(1));
      yield* _(Q.offer(q, 1));
      const v1 = yield* _(Q.take(q));
      yield* _(Q.offer(q, 2));
      const v2 = yield* _(Q.take(q));
      expect([v1, v2]).toEqual([1, 2]);
    }),
  );

  test.real('cancelable take', () =>
    IO.Monad.do(function* (_) {
      const q = yield* _(Q.construct(1));
      const f = yield* _(Q.take(q).fork);
      yield* _(IO.sleep(10));
      yield* _(f.cancel);
      const v = yield* _(Q.tryOffer(q, 1));
      expect(v).toBe(true);
    }),
  );

  test.real('async take', () =>
    IO.Monad.do(function* (_) {
      const q = yield* _(Q.construct(1));
      const ref = yield* _(IO.ref(false));
      yield* _(Q.offer(q, 1));
      const v1 = yield* _(Q.take(q));
      expect(v1).toBe(1);

      const p = yield* _(IO(() => Q.take(q).unsafeRunToPromise()));
      yield* _(
        ref.get().flatMap(resolved => IO(() => expect(resolved).toBe(false))),
      );
      yield* _(Q.offer(q, 2));
      const v2 = yield* _(IO.fromPromise(IO.pure(p)));
      expect(v2).toBe(2);
    }),
  );
}
