import { id, Kind, pipe } from '@fp4ts/core';
import { Option, None, Queue as CatsQueue } from '@fp4ts/cats';
import { IO, IoK } from '@fp4ts/effect-core';
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
    const Q = QueueLike.of<IoK, number>({
      construct: Queue.bounded(IO.Concurrent),
    });

    test('offer with zero capacity', () =>
      Q.construct(0)
        .flatMap(q =>
          pipe(
            IO.Do,
            IO.bind(Q.offer(q, 1).fork),
            IO.bindTo('v1', Q.take(q)),
            IO.bindTo('f', Q.take(q).fork),
            IO.bind(Q.offer(q, 2)),
            IO.bindTo('v2', ({ f }) => f.joinWithNever(IO.Async)),
            IO.bind(({ v1, v2 }) => IO(() => expect([v1, v2]).toEqual([1, 2]))),
          ),
        )
        .unsafeRunToPromise());

    test('async take with zero capacity', () =>
      Q.construct(0)
        .flatMap(q =>
          pipe(
            IO.Do,
            IO.bindTo('ref', IO.ref(false)),
            IO.bind(Q.offer(q, 1).fork),
            IO.bindTo('v1', Q.take(q)),
            IO.bind(({ v1 }) => IO(() => expect(v1).toBe(1))),
            IO.bindTo(
              'p',
              IO(() => Q.take(q).unsafeRunToPromise()),
            ),
            IO.bind(({ ref }) =>
              ref
                .get()
                .flatMap(resolved => IO(() => expect(resolved).toBe(false))),
            ),
            IO.bind(Q.offer(q, 2)),
            IO.bindTo('v2', ({ p }) => IO.fromPromise(IO.pure(p))),
            IO.bind(({ v2 }) => IO(() => expect(v2).toBe(2))),
          ),
        )
        .unsafeRunToPromise());

    test('offer/take with zero capacity', () => {
      const count = 1000;

      const producer = (q: Queue<IoK, number>, n: number): IO<void> =>
        n > 0
          ? Q.offer(q, count - n).flatMap(() => producer(q, n - 1))
          : IO.unit;

      const consumer = (
        q: Queue<IoK, number>,
        n: number,
        acc: CatsQueue<number> = CatsQueue.empty,
      ): IO<number> =>
        n > 0
          ? Q.take(q).flatMap(a => consumer(q, n - 1, acc.enqueue(a)))
          : IO.pure(acc.foldLeft(0, (x, y) => x + y));

      return Q.construct(0)
        .flatMap(q =>
          pipe(
            IO.Do,
            IO.bindTo('p', producer(q, count).fork),
            IO.bindTo('c', consumer(q, count).fork),
            IO.bind(({ p }) => p.join),
            IO.bindTo('r', ({ c }) => c.joinWithNever(IO.Async)),
            IO.bind(({ r }) =>
              IO(() => expect(r).toBe((count * (count - 1)) / 2)),
            ),
          ),
        )
        .unsafeRunToPromise();
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
        QueueLike.of<IoK, number>({
          construct: () => Queue.unbounded(IO.Concurrent),
        }),
      );
    });

    describe('Unbounded mapK', () => {
      unboundedQueueTests(
        QueueLike.of<IoK, number>({
          construct: () => Queue.unbounded(IO.Concurrent).map(x => x.mapK(id)),
        }),
      );
    });

    function unboundedQueueTests(Q: QueueLike<IoK, number>) {
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

    function droppingQueueTests(Q: QueueLike<IoK, number>) {
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

    function circularBufferQueueTests(Q: QueueLike<IoK, number>) {
      zeroCapacityConstructor(Q);
      negativeCapacityConstructor(Q);
      tryOfferOnFull(Q, true);
      commonTests(Q);
    }
  });
});

function zeroCapacityConstructor(Q: QueueLike<IoK, number>) {
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

function negativeCapacityConstructor(Q: QueueLike<IoK, number>) {
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

function tryOfferOnFull(Q: QueueLike<IoK, number>, expected: boolean) {
  test('tryOffer on full', () =>
    Q.construct(1)
      .flatMap(q =>
        pipe(
          IO.Do,
          IO.bind(Q.offer(q, 0)),
          IO.bindTo('r', Q.tryOffer(q, 1)),
          IO.bind(({ r }) => IO(() => expect(r).toBe(expected))),
        ),
      )
      .unsafeRunToPromise());
}

function offerTakeOverCapacityTests(Q: QueueLike<IoK, number>) {
  test('offer/take over capacity', () => {
    const count = 1000;

    const producer = (q: Queue<IoK, number>, n: number): IO<void> =>
      n > 0 ? Q.offer(q, count - n).flatMap(() => producer(q, n - 1)) : IO.unit;

    const consumer = (
      q: Queue<IoK, number>,
      n: number,
      acc: CatsQueue<number> = CatsQueue.empty,
    ): IO<number> =>
      n > 0
        ? Q.take(q).flatMap(a => consumer(q, n - 1, acc.enqueue(a)))
        : IO.pure(acc.foldLeft(0, (x, y) => x + y));

    return Q.construct(10)
      .flatMap(q =>
        pipe(
          IO.Do,
          IO.bindTo('p', producer(q, count).fork),
          IO.bindTo('c', consumer(q, count).fork),
          IO.bind(({ p }) => p.join),
          IO.bindTo('r', ({ c }) => c.joinWithNever(IO.Async)),
          IO.bind(({ r }) =>
            IO(() => expect(r).toBe((count * (count - 1)) / 2)),
          ),
        ),
      )
      .unsafeRunToPromise();
  });
}

function cancelableOfferTests(Q: QueueLike<IoK, number>) {
  it('should cancel pending offer', () =>
    Q.construct(1)
      .flatMap(q =>
        pipe(
          IO.Do,
          IO.bind(Q.offer(q, 1)),
          IO.bindTo('f', Q.offer(q, 2).fork),
          IO.bind(IO.sleep(10)),
          IO.bind(({ f }) => f.cancel),
          IO.bindTo('v1', Q.take(q)),
          IO.bindTo('v2', Q.tryTake(q)),
          IO.bind(({ v1, v2 }) =>
            IO(() => expect([v1, v2]).toEqual([1, None])),
          ),
        ),
      )
      .unsafeRunToPromise());
}

function tryOfferTryTakeTests(Q: QueueLike<IoK, number>) {
  test('tryTake/tryOffer', () => {
    const count = 1000;

    const producer = (q: Queue<IoK, number>, n: number): IO<void> =>
      n > 0
        ? Q.tryOffer(q, count - n).flatMap(b =>
            b ? producer(q, n - 1) : IO.suspend['>>>'](producer(q, n)),
          )
        : IO.unit;

    const consumer = (
      q: Queue<IoK, number>,
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

    return Q.construct(10)
      .flatMap(q =>
        pipe(
          IO.Do,
          IO.bindTo('p', producer(q, count).fork),
          IO.bindTo('c', consumer(q, count).fork),
          IO.bind(({ p }) => p.join),
          IO.bindTo('r', ({ c }) => c.joinWithNever(IO.Async)),
          IO.bind(({ r }) =>
            IO(() => expect(r).toBe((count * (count - 1)) / 2)),
          ),
        ),
      )
      .unsafeRunToPromise();
  });
}

function commonTests(Q: QueueLike<IoK, number>) {
  it('should the queue size after offer/take', () =>
    Q.construct(1)
      .flatMap(q =>
        pipe(
          IO.Do,
          IO.bind(Q.offer(q, 1)),
          IO.bind(Q.take(q)),
          IO.bind(Q.offer(q, 2)),
          IO.bindTo('size', Q.size(q)),
          IO.bind(({ size }) => IO(() => expect(size).toBe(1))),
        ),
      )
      .unsafeRunToPromise());

  it('should return None when the queue is empty', () =>
    Q.construct(1)
      .flatMap(q => Q.tryTake(q))
      .flatMap(oa => IO(() => expect(oa).toEqual(None)))
      .unsafeRunToPromise());

  it('should return values in FIFO order', () =>
    Q.construct(1)
      .flatMap(q =>
        pipe(
          IO.Do,
          IO.bind(Q.offer(q, 1)),
          IO.bindTo('v1', Q.take(q)),
          IO.bind(Q.offer(q, 2)),
          IO.bindTo('v2', Q.take(q)),
          IO.bind(({ v1, v2 }) => IO(() => expect([v1, v2]).toEqual([1, 2]))),
        ),
      )
      .unsafeRunToPromise());

  test('cancelable take', () =>
    Q.construct(1)
      .flatMap(q =>
        pipe(
          IO.Do,
          IO.bindTo('f', Q.take(q).fork),
          IO.bind(IO.sleep(10)),
          IO.bind(({ f }) => f.cancel),
          IO.bindTo('v', Q.tryOffer(q, 1)),
          IO.bind(({ v }) => IO(() => expect(v).toBe(true))),
        ),
      )
      .unsafeRunToPromise());

  test('async take', () =>
    Q.construct(1)
      .flatMap(q =>
        pipe(
          IO.Do,
          IO.bindTo('ref', IO.ref(false)),
          IO.bind(Q.offer(q, 1)),
          IO.bindTo('v1', Q.take(q)),
          IO.bind(({ v1 }) => IO(() => expect(v1).toBe(1))),
          IO.bindTo(
            'p',
            IO(() => Q.take(q).unsafeRunToPromise()),
          ),
          IO.bind(({ ref }) =>
            ref
              .get()
              .flatMap(resolved => IO(() => expect(resolved).toBe(false))),
          ),
          IO.bind(Q.offer(q, 2)),
          IO.bindTo('v2', ({ p }) => IO.fromPromise(IO.pure(p))),
          IO.bind(({ v2 }) => IO(() => expect(v2).toBe(2))),
        ),
      )
      .unsafeRunToPromise());
}
