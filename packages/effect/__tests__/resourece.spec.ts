import '@cats4ts/effect-test-kit/lib/jest-extension';
import fc from 'fast-check';
import { fst, pipe, snd } from '@cats4ts/core';
import { Eq, List, Seq, Either, Left, Right } from '@cats4ts/cats';
import { MonadCancelSuite } from '@cats4ts/effect-laws';
import { IO, IoK } from '@cats4ts/effect-core';
import { Resource } from '@cats4ts/effect-kernel';
import * as A from '@cats4ts/effect-test-kit/lib/arbitraries';
import * as E from '@cats4ts/effect-test-kit/lib/eq';
import { checkAll, forAll, IsEq } from '@cats4ts/cats-test-kit';

describe('Resource', () => {
  describe('$<ResourceK, [IO]>', () => {
    const Instance = Resource.MonadCancel(IO.Async);

    it.ticked('should release resources in reversed order', ticker => {
      const arb = A.cats4tsList(
        fc.tuple(
          fc.integer(),
          A.cats4tsEither(A.cats4tsError(), fc.constant<void>(undefined)),
        ),
      );

      forAll(arb, as => {
        let released: List<number> = List.empty;
        const r = as.traverse(Instance)(([a, e]) =>
          Resource.make(IO.Functor)(
            IO(() => a),
            a =>
              IO(() => (released = released.prepend(a)))['>>>'](
                IO.fromEither(e),
              ),
          ),
        );

        expect(r.use_(IO.MonadCancel).attempt.void).toCompleteWith(
          undefined,
          ticker,
        );
        return new IsEq(released, as.map(fst));
      })(List.Eq(Eq.primitive))();
    });
  });

  it.ticked('should make acquires uninterruptible', ticker => {
    const io = IO.ref(false).flatMap(interrupted => {
      const fa = IO.sleep(5_000).onCancel(interrupted.set(true));

      return Resource.make(IO.Functor)(fa, () => IO.unit)
        .use_(IO.MonadCancel)
        .timeout(1_000)
        .attempt['>>>'](interrupted.get());
    });
    expect(io).toCompleteWith(false, ticker);
  });

  it.ticked(
    'should make acquires uninterruptible overriding uncancelable',
    ticker => {
      const io = IO.ref(false).flatMap(interrupted => {
        const fa = IO.uncancelable(poll =>
          poll(IO.sleep(5_000)).onCancel(interrupted.set(true)),
        );

        return Resource.make(IO.Functor)(fa, () => IO.unit)
          .use_(IO.MonadCancel)
          .timeout(1_000)
          .attempt['>>>'](interrupted.get());
      });
      expect(io).toCompleteWith(false, ticker);
    },
  );

  it.ticked(
    'should release the resource when interrupted during use',
    ticker => {
      const flag = IO.ref(false);

      const io = IO.both(flag, flag).flatMap(([acquireFin, releaseFin]) => {
        const action = IO.sleep(1_000).onCancel(acquireFin.set(true));
        const fin = releaseFin.set(true);
        const res = Resource.makeFull(IO.Functor)(
          poll => poll(action),
          () => fin,
        );

        return res
          .surround(IO.MonadCancel)(IO.never)
          .timeout(3_000)
          .attempt['>>>'](IO.both(acquireFin.get(), releaseFin.get()));
      });

      expect(io).toCompleteWith([false, true], ticker);
    },
  );

  it.ticked('should use interruptible acquires', ticker => {
    const flag = IO.ref(false);

    const io = IO.both(flag, flag).flatMap(([acquireFin, releaseFin]) => {
      const action = IO.never.onCancel(acquireFin.set(true));
      const fin = releaseFin.set(true);
      const res = Resource.makeFull(IO.Functor)(
        poll => poll(action),
        () => fin,
      );

      return res
        .use_(IO.MonadCancel)
        .timeout(1_000)
        .attempt['>>>'](IO.both(acquireFin.get(), releaseFin.get()));
    });

    expect(io).toCompleteWith([true, false], ticker);
  });

  it.ticked('should have release always uninterruptible', ticker => {
    const flag = IO.ref(false);

    const io = flag.flatMap(releaseComplete => {
      const release = IO.never.onCancel(releaseComplete.set(true));

      const res = Resource.allocateFull<IoK, void>(poll =>
        IO(() => [undefined, () => poll(release)]),
      );

      return res.use_(IO.MonadCancel).attempt['>>>'](releaseComplete.get());
    });

    expect(io).toNeverTerminate(ticker);
  });

  test.ticked('eval', ticker =>
    forAll(
      A.cats4tsIO(fc.integer()),
      fa =>
        new IsEq(
          Resource.evalF<IoK, number>(fa).use(IO.MonadCancel)(IO.pure),
          fa,
        ),
    )(E.eqIO(Eq.primitive, ticker))(),
  );

  test.ticked('evalMap', ticker =>
    forAll(
      fc.func<[number], IO<number>>(A.cats4tsIO(fc.integer())),
      f =>
        new IsEq(
          Resource.evalF<IoK, number>(IO.pure(0))
            .evalMap(f)
            .use(IO.MonadCancel)(IO.pure),
          f(0),
        ),
    )(E.eqIO(Eq.primitive, ticker))(),
  );

  test.ticked('evalTap', ticker =>
    forAll(
      fc.func<[number], IO<number>>(A.cats4tsIO(fc.integer())),
      f =>
        new IsEq(
          Resource.evalF<IoK, number>(IO.pure(0))
            .evalTap(f)
            .use(IO.MonadCancel)(IO.pure),
          f(0).map(() => 0),
        ),
    )(E.eqIO(Eq.primitive, ticker))(),
  );

  describe('allocated', () => {
    it.ticked('should release two resources', ticker => {
      let a = false;
      let b = false;

      const test = Resource.make(IO.Functor)(
        IO.unit,
        () => IO(() => (a = true)).void,
      )['>>>'](
        Resource.make(IO.Functor)(IO.unit, () => IO(() => (b = true)).void),
      );

      expect(
        test.allocated(IO.MonadCancel).flatMap(snd).attempt.void,
      ).toCompleteWith(undefined, ticker);
      expect(a).toBe(true);
      expect(b).toBe(true);
    });

    it.ticked('should not release resource until closed', ticker => {
      const flag = IO.ref(false);

      const io = flag.flatMap(released => {
        const release = Resource.make(IO.Functor)(IO.unit, () =>
          released.set(true),
        );
        const resource = Resource.evalF<IoK, void>(IO.unit);

        const ioa = release['>>>'](resource).allocated(IO.MonadCancel);

        return pipe(
          IO.Do,
          IO.bindTo('close', ioa.map(snd)),
          IO.bind(
            released.get().flatMap(rel => IO(() => expect(rel).toBe(false))),
          ),
          IO.bind(({ close }) => close),
          IO.bind(
            released.get().flatMap(rel => IO(() => expect(rel).toBe(true))),
          ),
        ).void;
      });

      expect(io).toCompleteWith(undefined, ticker);
    });
  });

  describe('stack safety', () => {
    test.ticked('use over binds - 1', ticker => {
      const ioa = Seq.range(0, 10_000)
        .foldLeft(Resource.evalF<IoK, void>(IO.unit), r =>
          r.flatMap(() => Resource.evalF<IoK, void>(IO.unit)),
        )
        .use_(IO.MonadCancel);

      expect(ioa).toCompleteWith(undefined, ticker);
    });

    test.ticked('use over binds - 2', ticker => {
      const n = 10_000;
      const p = (i: number): Resource<IoK, number> =>
        Resource.pure<IoK, Either<number, number>>(
          i < n ? Left(i + 1) : Right(i),
        ).flatMap(r => r.fold(p, x => Resource.pure<IoK, number>(x)));

      expect(p(0).use(IO.MonadCancel)(IO.pure)).toCompleteWith(n, ticker);
    });
  });

  describe('both', () => {
    test.ticked('parallel acquisition and release', ticker => {
      let leftAllocated = false;
      let rightAllocated = false;
      let leftReleasing = false;
      let rightReleasing = false;
      let leftReleased = false;
      let rightReleased = false;

      const wait = IO.sleep(1_000);
      const lhs = Resource.make(IO.Functor)(
        wait['>>>'](IO(() => (leftAllocated = true)).void),
        () =>
          IO(() => (leftReleasing = true))
            ['>>>'](wait)
            ['>>>'](IO(() => (leftReleased = true)).void),
      );
      const rhs = Resource.make(IO.Functor)(
        wait['>>>'](IO(() => (rightAllocated = true)).void),
        () =>
          IO(() => (rightReleasing = true))
            ['>>>'](wait)
            ['>>>'](IO(() => (rightReleased = true)).void),
      );
      lhs
        .both(IO.Concurrent)(rhs)
        .use(IO.MonadCancel)(() => wait)
        .unsafeRunToPromise({
          config: { autoSuspendThreshold: Infinity },
          executionContext: ticker.ctx,
          shutdown: () => {},
        });

      // after 1 second:
      //  both resources have allocated (concurrency, serially it would happen after 2 seconds)
      //  resources are still open during `use` (correctness)
      ticker.ctx.tick();
      ticker.ctx.tick(1_000);
      expect(leftAllocated).toBe(true);
      expect(rightAllocated).toBe(true);
      expect(leftReleasing).toBe(false);
      expect(rightReleasing).toBe(false);

      // after 2 seconds:
      //  both resources have started cleanup (correctness)
      ticker.ctx.tick(1_000);
      expect(leftReleasing).toBe(true);
      expect(rightReleasing).toBe(true);
      expect(leftReleased).toBe(false);
      expect(rightReleased).toBe(false);

      // after 3 seconds:
      //  both resources have terminated cleanup (concurrency, serially it would happen after 4 seconds)
      ticker.ctx.tick(1_000);
      expect(leftReleased).toBe(true);
      expect(rightReleased).toBe(true);
    });

    test.ticked(
      'safety: lhs errored during rhs interruptible region',
      ticker => {
        let leftAllocated = false;
        let rightAllocated = false;
        let leftReleasing = false;
        let rightReleasing = false;
        let leftReleased = false;
        let rightReleased = false;

        const wait = (n: number): IO<void> => IO.sleep(n * 1_000);

        const lhs = Resource.make(IO.Functor)(
          wait(1)['>>>'](IO(() => (leftAllocated = true))).void,
          () =>
            IO(() => (leftReleasing = true))
              ['>>>'](wait(1))
              ['>>>'](IO(() => (leftReleased = true)).void),
        ).flatMap(() =>
          Resource.evalF<IoK, never>(
            wait(1)['>>>'](IO.throwError(new Error())),
          ),
        );
        const rhs = Resource.make(IO.Functor)(
          wait(1)['>>>'](IO(() => (rightAllocated = true))).void,
          () =>
            IO(() => (rightReleasing = true))
              ['>>>'](wait(1))
              ['>>>'](IO(() => (rightReleased = true)).void),
        ).flatMap(() => Resource.evalF<IoK, void>(wait(2)));

        lhs
          .both(IO.Concurrent)(rhs)
          .use_(IO.MonadCancel)
          .handleError(() => {})
          .unsafeRunToPromise({
            config: { autoSuspendThreshold: Infinity },
            executionContext: ticker.ctx,
            shutdown: () => {},
          });

        // after 1 second:
        //  both resources have allocated (concurrency, serially it would happen after 2 seconds)
        //  resources are still open during `flatMap` (correctness)
        ticker.ctx.tick();
        ticker.ctx.tick(1_000);
        expect(leftAllocated).toBe(true);
        expect(rightAllocated).toBe(true);
        expect(leftReleasing).toBe(false);
        expect(rightReleasing).toBe(false);

        // after 2 seconds:
        //  both resources have started cleanup (interruption, or rhs would start releasing after 3 seconds)
        ticker.ctx.tick(1_000);
        expect(leftReleasing).toBe(true);
        expect(rightReleasing).toBe(true);
        expect(leftReleased).toBe(false);
        expect(rightReleased).toBe(false);

        // after 3 seconds:
        //  both resources have terminated cleanup (concurrency, serially it would happen after 4 seconds)
        ticker.ctx.tick(1_000);
        expect(leftReleased).toBe(true);
        expect(rightReleased).toBe(true);
      },
    );

    test.ticked(
      'safety: rhs errored during lhs interruptible region',
      ticker => {
        let leftAllocated = false;
        let rightAllocated = false;
        let rightErrored = false;
        let leftReleasing = false;
        let rightReleasing = false;
        let leftReleased = false;
        let rightReleased = false;

        const wait = (n: number): IO<void> => IO.sleep(n * 1_000);

        const lhs = Resource.make(IO.Functor)(
          wait(3)['>>>'](IO(() => (leftAllocated = true))).void,
          () =>
            IO(() => (leftReleasing = true))
              ['>>>'](wait(1))
              ['>>>'](IO(() => (leftReleased = true)).void),
        );
        const rhs = Resource.make(IO.Functor)(
          wait(1)['>>>'](IO(() => (rightAllocated = true))).void,
          () =>
            IO(() => (rightReleasing = true))
              ['>>>'](wait(1))
              ['>>>'](IO(() => (rightReleased = true)).void),
        ).flatMap(() =>
          Resource.make(IO.Functor)(
            wait(1)['>>>'](
              IO(() => (rightErrored = true))['>>>'](
                IO.throwError(new Error()),
              ),
            ),
            () => IO.unit,
          ),
        );

        lhs
          .both(IO.Concurrent)(rhs)
          .use(IO.MonadCancel)(() => wait(1))
          .handleError(() => {})
          .unsafeRunToPromise({
            config: { autoSuspendThreshold: Infinity },
            executionContext: ticker.ctx,
            shutdown: () => {},
          });

        // after 1 second:
        //  rhs has partially allocated, lhs executing
        ticker.ctx.tick();
        ticker.ctx.tick(1_000);
        expect(leftAllocated).toBe(false);
        expect(rightAllocated).toBe(true);
        expect(rightErrored).toBe(false);
        expect(leftReleasing).toBe(false);
        expect(rightReleasing).toBe(false);

        // after 2 seconds:
        //  rhs has failed, release blocked since lhs is in uninterruptible allocation
        ticker.ctx.tick(1_000);
        expect(leftAllocated).toBe(false);
        expect(rightAllocated).toBe(true);
        expect(rightErrored).toBe(true);
        expect(leftReleasing).toBe(false);
        expect(rightReleasing).toBe(false);

        // expect(leftReleased).toBe(false);
        // expect(rightReleased).toBe(false);

        // after 3 seconds:
        //  lhs completes allocation (concurrency, serially it would happen after 4 seconds)
        //  both resources have started cleanup (correctness, error propagates to both sides)
        ticker.ctx.tick(1_000);
        expect(leftAllocated).toBe(true);
        expect(leftReleasing).toBe(true);
        expect(rightReleasing).toBe(true);
        expect(leftReleased).toBe(false);
        expect(rightReleased).toBe(false);

        // after 4 seconds:
        //  both resource have terminated cleanup (concurrency, serially it would happen after 5 seconds)
        ticker.ctx.tick(1_000);
        expect(leftReleased).toBe(true);
        expect(rightReleased).toBe(true);
      },
    );
  });

  describe.ticked('Laws', ticker => {
    const resourceIOMonadCancel = Resource.MonadCancel(IO.MonadCancel);
    const monadCancelTests = MonadCancelSuite(resourceIOMonadCancel);

    checkAll(
      'MonadCancel<$<Resource, [IoK]>, Error>',
      monadCancelTests.monadCancel(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        A.cats4tsError(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.Error.strict,
        x => A.cats4tsResource(IO.Functor)(x, A.cats4tsIO),
        <X>(EqX: Eq<X>) =>
          Eq.by(E.eqIO(EqX, ticker), (r: Resource<IoK, X>) =>
            r.use(IO.MonadCancel)(IO.pure),
          ),
      ),
    );
  });
});
