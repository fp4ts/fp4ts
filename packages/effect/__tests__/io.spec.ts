// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit/lib/jest-extension';
import fc from 'fast-check';
import { id, pipe, throwError } from '@fp4ts/core';
import { Either, Left, Right, Some, List, Eq, None } from '@fp4ts/cats';
import { Semaphore } from '@fp4ts/effect-kernel';
import { IO, IOOutcome } from '@fp4ts/effect-core';
import { checkAll, forAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/effect-test-kit/lib/arbitraries';
import * as E from '@fp4ts/effect-test-kit/lib/eq';
import { AsyncSuite } from '@fp4ts/effect-laws';

describe('IO', () => {
  describe('free monad', () => {
    it.ticked('should produce a pure value', ticker => {
      expect(IO.pure(42)).toCompleteWith(42, ticker);
    });

    it.ticked('should sequence two effects', ticker => {
      let i: number = 0;

      const fa = pipe(
        IO.pure(42).flatMap(i2 =>
          IO(() => {
            i = i2;
          }),
        ),
      );

      expect(fa).toCompleteWith(undefined, ticker);
      expect(i).toBe(42);
    });

    it.ticked('should preserve monad identity on async', ticker => {
      const io1 = IO.async_(cb => cb(Right(42)));
      const io2 = io1.flatMap(i => IO.pure(i));

      expect(io1).toCompleteWith(42, ticker);
      expect(io2).toCompleteWith(42, ticker);
    });
  });

  describe('error handling', () => {
    // test('tracing', async () => {
    //   const fib = (n: number, a: bigint = 0n, b: bigint = 1n): IO<bigint> =>
    //     IO(() => a + b).flatMap(c => (n > 0 ? fib(n - 1, b, c) : IO.pure(c)));

    //   const program = pipe(
    //     IO.Do,
    //     IO.bindTo('x', fib(20)),
    //     IO.bind(({ x }) => IO(() => console.log(`20th fib number is ${x}`))),
    //     IO.bind(() => IO.throwError(new Error('test'))),
    //   );

    //   try {
    //     await program.unsafeRunToPromise();
    //   } catch (e) {
    //     console.log(e);
    //   }
    // });

    test.ticked(
      'attempt is redeem with Left for recover and Right for map',
      ticker =>
        forAll(A.fp4tsIO(fc.integer()), io =>
          io.attempt['<=>'](io.redeem<Either<Error, number>>(Left, Right)),
        )(
          E.eqIO(
            Either.Eq(Eq.Error.strict, Eq.primitive as Eq<number>),
            ticker,
          ),
        )(),
    );

    test.ticked('attempt is flattened redeemWith', ticker =>
      forAll(
        A.fp4tsIO(fc.integer()),
        fc.func<[Error], IO<string>>(A.fp4tsIO(fc.string())),
        fc.func<[number], IO<string>>(A.fp4tsIO(fc.string())),
        (io, recover, bind) =>
          io.attempt
            .flatMap(ea => ea.fold(recover, bind))
            ['<=>'](io.redeemWith(recover, bind)),
      )(E.eqIO(Eq.primitive, ticker))(),
    );

    test.ticked('attempt is flattened redeemWith', ticker =>
      forAll(
        A.fp4tsIO(fc.integer()),
        fc.func<[Error], IO<string>>(A.fp4tsIO(fc.string())),
        fc.func<[number], IO<string>>(A.fp4tsIO(fc.string())),
        (io, recover, bind) =>
          io.attempt
            .flatMap(ea => ea.fold(recover, bind))
            ['<=>'](io.redeemWith(recover, bind)),
      )(E.eqIO(Eq.primitive, ticker))(),
    );

    test.ticked('redeem subsumes handleError', ticker =>
      forAll(
        A.fp4tsIO(fc.integer()),
        fc.func<[Error], number>(fc.integer()),
        (io, recover) => io.redeem(recover, id)['<=>'](io.handleError(recover)),
      )(E.eqIO(Eq.primitive, ticker))(),
    );

    test.ticked('redeemWith subsumes handleErrorWith', ticker =>
      forAll(
        A.fp4tsIO(fc.integer()),
        fc.func<[Error], IO<number>>(A.fp4tsIO(fc.integer())),
        (io, recover) =>
          io.redeemWith(recover, IO.pure)['<=>'](io.handleErrorWith(recover)),
      )(E.eqIO(Eq.primitive, ticker))(),
    );

    it.ticked('should capture suspended error', ticker => {
      const io = IO(() => throwError(Error('test error')));
      expect(io).toFailWith(new Error('test error'), ticker);
    });

    it.ticked('should resume async IO with failure', ticker => {
      const io = IO.async_(cb => cb(Left(new Error('test error'))));
      expect(io).toFailWith(new Error('test error'), ticker);
    });

    it.ticked('should propagate thrown error', ticker => {
      const io = IO.throwError(new Error('test error')).void;
      expect(io).toFailWith(new Error('test error'), ticker);
    });

    it.ticked('should short circuit the execution on error', ticker => {
      const fn = jest.fn();
      const io = IO.throwError(new Error('test error')).flatMap(() => IO(fn));

      expect(io).toFailWith(new Error('test error'), ticker);
      expect(fn).not.toHaveBeenCalled();
    });

    it.ticked('should handle thrown error', ticker => {
      const io = IO.throwError(new Error('test error')).attempt;
      expect(io).toCompleteWith(Left(new Error('test error')), ticker);
    });

    it.ticked('should catch error thrown in redeem recovery', ticker => {
      const io = IO.throwError(new Error('test error')).redeem(
        () => throwError(new Error('thrown error')),
        () => 42,
      ).attempt;

      expect(io).toCompleteWith(Left(new Error('thrown error')), ticker);
    });

    it.ticked('should recover from errors using redeemWith', ticker => {
      const io = IO.throwError(new Error()).redeemWith(
        () => IO.pure(42),
        () => IO.pure(43),
      );
      expect(io).toCompleteWith(42, ticker);
    });

    it.ticked('should bind success values using redeemWith', ticker => {
      const io = IO.unit.redeemWith(
        () => IO.pure(42),
        () => IO.pure(43),
      );
      expect(io).toCompleteWith(43, ticker);
    });

    it.ticked('should catch error thrown in map', ticker => {
      const io = IO.unit.map(() => throwError(new Error('test error'))).attempt;

      expect(io).toCompleteWith(Left(new Error('test error')), ticker);
    });

    it.ticked('should catch error thrown in flatMap', ticker => {
      const io = IO.unit.flatMap(() =>
        throwError(new Error('test error')),
      ).attempt;

      expect(io).toCompleteWith(Left(new Error('test error')), ticker);
    });

    it.ticked('should catch error thrown in handleErrorWith', ticker => {
      const io = IO.throwError(new Error('test error')).handleErrorWith(() =>
        throwError(new Error('thrown error')),
      ).attempt;

      expect(io).toCompleteWith(Left(new Error('thrown error')), ticker);
    });

    it.ticked(
      'should throw first bracket release error if use effect succeeded',
      ticker => {
        const inner = IO.unit.bracket(() => IO.unit)(() =>
          IO.throwError(new Error('first error')),
        );

        const io = IO.unit.bracket(() => inner)(() =>
          IO.throwError(new Error('second error')),
        ).attempt;

        expect(io).toCompleteWith(Left(new Error('first error')), ticker);
      },
    );
  });

  describe('side effect suspension', () => {
    it.ticked('should not memoize effects', ticker => {
      let counter = 42;
      const io = IO(() => {
        counter += 1;
        return counter;
      });

      expect(io).toCompleteWith(43, ticker);
      expect(io).toCompleteWith(44, ticker);
    });

    it.ticked('should execute suspended effect on each use', ticker => {
      let counter = 42;
      const x = IO(() => {
        counter += 1;
        return counter;
      });

      const io = pipe(
        IO.Do,
        IO.bindTo('a', () => x),
        IO.bindTo('b', () => x),
      ).map(({ a, b }) => [a, b] as [number, number]);

      expect(io).toCompleteWith([43, 44], ticker);
    });
  });

  describe('fibers', () => {
    it.ticked('should fork and join a fiber', ticker => {
      const io = IO.pure(42)
        .map(x => x + 1)
        .fork.flatMap(f => f.join);

      expect(io).toCompleteWith(IOOutcome.success(IO.pure(43)), ticker);
    });

    it.ticked('should fork and join a failed fiber', ticker => {
      const io = IO.throwError(new Error('test error')).fork.flatMap(
        f => f.join,
      );

      expect(io).toCompleteWith(
        IOOutcome.failure(new Error('test error')),
        ticker,
      );
    });

    it.ticked('should fork and ignore a non-terminating fiber', ticker => {
      const io = IO.never.fork.map(() => 42);
      expect(io).toCompleteWith(42, ticker);
    });

    it.ticked('should start a fiber and continue with its results', ticker => {
      const io = IO.pure(42)
        .fork.flatMap(f => f.join)
        .flatMap(oc =>
          oc.fold(
            () => IO.pure(0),
            () => IO.pure(-1),
            id,
          ),
        );

      expect(io).toCompleteWith(42, ticker);
    });

    it.ticked('should produce canceled outcome when fiber canceled', ticker => {
      const io = IO.canceled.fork.flatMap(f => f.join);
      expect(io).toCompleteWith(IOOutcome.canceled(), ticker);
    });

    it.ticked('should cancel already canceled fiber', ticker => {
      const ioa = pipe(
        IO.Do,
        IO.bindTo('f', () => IO.canceled.fork),
        IO.bind(() => IO(() => ticker.ctx.tickAll())),
        IO.bind(({ f }) => f.cancel),
      ).void;

      expect(ioa).toCompleteWith(undefined, ticker);
    });

    it.ticked(
      'should complete with never ending task run in the background',
      ticker => {
        let started = false;
        const bio = IO(() => (started = true)).flatMap(() => IO.never);
        const ioa = bio.background.use(IO.Async)(
          () =>
            // let the background task to be started
            IO.suspend,
        ).void;

        expect(ioa).toCompleteWith(undefined, ticker);
        expect(started).toEqual(true);
      },
    );

    it.ticked('should cancel task run in the background', ticker => {
      let canceled = false;
      const ioa = IO.never
        .onCancel(IO(() => (canceled = true)).void)
        .background.use(IO.Async)(
        () =>
          // let the background task to be started
          IO.suspend,
      ).void;

      expect(ioa).toCompleteWith(undefined, ticker);
      expect(canceled).toBe(true);
    });
  });

  describe('async', () => {
    it.ticked('should resume async continuation', ticker => {
      const io = IO.async_(cb => cb(Right(42)));

      expect(io).toCompleteWith(42, ticker);
    });

    it.ticked(
      'should resume async continuation and bind its results',
      ticker => {
        const io = IO.async_<number>(cb => cb(Right(42))).map(x => x + 2);

        expect(io).toCompleteWith(44, ticker);
      },
    );

    it.ticked('should produce a failure when bind fails', ticker => {
      const io = IO.async_<number>(cb => cb(Right(42))).flatMap(() =>
        IO.throwError(new Error('test error')),
      ).void;

      expect(io).toFailWith(new Error('test error'), ticker);
    });

    it.ticked(
      'should resume only once even if cb called multiple times',
      ticker => {
        let cb: (ea: Either<Error, number>) => void;

        const async = IO.async<number>(cb0 =>
          IO(() => {
            cb = cb0;
            return None;
          }),
        );

        const io = pipe(
          IO.Do,
          IO.bindTo('f', () => async.fork),
          IO.bind(IO(() => ticker.ctx.tickAll())),
          IO.bind(IO(() => cb(Right(42)))),
          IO.bind(IO(() => ticker.ctx.tickAll())),
          IO.bind(IO(() => cb(Right(43)))),
          IO.bind(IO(() => ticker.ctx.tickAll())),
          IO.bind(IO(() => cb(Left(new Error('test error'))))),
        ).flatMap(({ f }) => f.join);

        expect(io).toCompleteWith(IOOutcome.success(IO.pure(42)), ticker);
      },
    );

    it.ticked(
      'should cancel and complete a fiber while finalizer on poll',
      ticker => {
        const ioa = IO.uncancelable(poll =>
          IO.canceled
            .flatMap(() => poll(IO.unit))
            .finalize(() => IO.unit)
            .fork.flatMap(f => f.join),
        );

        expect(ioa).toCompleteWith(IOOutcome.canceled(), ticker);
      },
    );

    it.ticked('should allow miss-ordering of completions', ticker => {
      let outerR: number = 0;
      let innerR: number = 0;

      const outer = IO.async<number>(cb1 => {
        const inner = IO.async<number>(cb2 =>
          IO(() => cb1(Right(1)))
            ['>>>'](IO.readExecutionContext)
            .flatMap(ec => IO(() => ec.executeAsync(() => cb2(Right(2)))))
            .map(() => None),
        );

        return inner.flatMap(i =>
          IO(() => {
            innerR = i;
          }).map(() => None),
        );
      });

      const io = outer.flatMap(i =>
        IO(() => {
          outerR = i;
        }),
      );

      expect(io).toCompleteWith(undefined, ticker);
      expect([innerR, outerR]).toEqual([2, 1]);
    });
  });

  describe('both', () => {
    it.ticked('should complete when both fibers complete', ticker => {
      const io = IO.both(IO.pure(42), IO.pure(43));
      expect(io).toCompleteWith([42, 43], ticker);
    });

    it.ticked('should fail if lhs fiber fails', ticker => {
      const io = IO.both(IO.throwError(new Error('left error')), IO.pure(43));
      expect(io).toFailWith(new Error('left error'), ticker);
    });

    it.ticked('should fail if rhs fiber fails', ticker => {
      const io = IO.both(IO.pure(42), IO.throwError(new Error('right error')));
      expect(io).toFailWith(new Error('right error'), ticker);
    });

    it.ticked('should cancel if lhs cancels', ticker => {
      const io = IO.both(IO.canceled, IO.pure(43)).fork.flatMap(f => f.join);

      expect(io).toCompleteWith(IOOutcome.canceled(), ticker);
    });

    it.ticked('should cancel if rhs cancels', ticker => {
      const io = IO.both(IO.pure(42), IO.canceled).fork.flatMap(f => f.join);

      expect(io).toCompleteWith(IOOutcome.canceled(), ticker);
    });

    it.ticked('should never complete if lhs never completes', ticker => {
      expect(IO.both(IO.never, IO.pure(42)).void).toNeverTerminate(ticker);
    });

    it.ticked('should never complete if rhs never completes', ticker => {
      expect(IO.both(IO.pure(42), IO.never).void).toNeverTerminate(ticker);
    });

    it.ticked('should propagate cancelation', ticker => {
      const io = pipe(
        IO.Do,
        IO.bindTo('f', IO.both(IO.never, IO.never).fork),
        IO.bind(IO(() => ticker.ctx.tickAll())),
        IO.bind(({ f }) => f.cancel),
        IO.bind(IO(() => ticker.ctx.tickAll())),
      ).flatMap(({ f }) => f.join);

      expect(io).toCompleteWith(IOOutcome.canceled(), ticker);
    });

    it.ticked('should cancel both fibers', ticker => {
      const io = pipe(
        IO.Do,
        IO.bindTo('l', IO.ref<boolean>(false)),
        IO.bindTo('r', IO.ref<boolean>(false)),
        IO.bindTo(
          'fiber',
          ({ l, r }) =>
            IO.both(
              IO.never.onCancel(l.set(true)),
              IO.never.onCancel(r.set(true)),
            ).fork,
        ),
        IO.bind(IO(() => ticker.ctx.tickAll())),
        IO.bind(({ fiber }) => fiber.cancel),
        IO.bind(IO(() => ticker.ctx.tickAll())),
        IO.bindTo('l2', ({ l }) => l.get()),
        IO.bindTo('r2', ({ r }) => r.get()),
      ).map(({ l2, r2 }) => [l2, r2] as [boolean, boolean]);

      expect(io).toCompleteWith([true, true], ticker);
    });
  });

  describe('race', () => {
    it.ticked('should complete with faster, lhs', ticker => {
      const io = IO.race(
        IO.pure(42),
        IO.sleep(100).flatMap(() => IO.pure(43)),
      );

      expect(io).toCompleteWith(Left(42), ticker);
    });

    it.ticked('should complete with faster, rhs', ticker => {
      const io = IO.race(
        IO.sleep(100).flatMap(() => IO.pure(42)),
        IO.pure(43),
      );

      expect(io).toCompleteWith(Right(43), ticker);
    });

    it.ticked('should fail if lhs fails', ticker => {
      const io = IO.race(IO.throwError(new Error('left error')), IO.pure(43));
      expect(io).toFailWith(new Error('left error'), ticker);
    });

    it.ticked('should fail if rhs fails', ticker => {
      const io = IO.race(IO.pure(42), IO.throwError(new Error('right error')));
      expect(io).toFailWith(new Error('right error'), ticker);
    });

    it.ticked('should fail if lhs fails and rhs never completes', ticker => {
      const io = IO.race(IO.throwError(new Error('left error')), IO.never);
      expect(io).toFailWith(new Error('left error'), ticker);
    });

    it.ticked('should fail if rhs fails and lhs never completes', ticker => {
      const io = IO.race(IO.never, IO.throwError(new Error('right error')));
      expect(io).toFailWith(new Error('right error'), ticker);
    });

    it.ticked('should complete with lhs when rhs never completes', ticker => {
      const io = IO.race(IO.pure(42), IO.never);
      expect(io).toCompleteWith(Left(42), ticker);
    });

    it.ticked('should complete with rhs when lhs never completes', ticker => {
      const io = IO.race(IO.never, IO.pure(43));
      expect(io).toCompleteWith(Right(43), ticker);
    });

    it.ticked('should be canceled when both sides canceled', ticker => {
      const io = IO.race(IO.canceled, IO.canceled).fork.flatMap(f => f.join);

      expect(io).toCompleteWith(IOOutcome.canceled(), ticker);
    });

    it.ticked('should succeed if lhs succeeds and rhs cancels', ticker => {
      const io = IO.race(IO.pure(42), IO.canceled);
      expect(io).toCompleteWith(Left(42), ticker);
    });

    it.ticked('should succeed if rhs succeeds and lhs cancels', ticker => {
      const io = IO.race(IO.canceled, IO.pure(43));
      expect(io).toCompleteWith(Right(43), ticker);
    });

    it.ticked('should fail if lhs fails and rhs cancels', ticker => {
      const io = IO.race(IO.throwError(new Error('test error')), IO.canceled);
      expect(io).toFailWith(new Error('test error'), ticker);
    });

    it.ticked('should fail if rhs fails and lhs cancels', ticker => {
      const io = IO.race(IO.canceled, IO.throwError(new Error('test error')));
      expect(io).toFailWith(new Error('test error'), ticker);
    });

    it.ticked('should cancel both fibers when canceled', ticker => {
      const io = pipe(
        IO.Do,
        IO.bindTo('l', IO.ref(false)),
        IO.bindTo('r', IO.ref(false)),
        IO.bindTo(
          'fiber',
          ({ l, r }) =>
            IO.race(
              IO.never.onCancel(l.set(true)),
              IO.never.onCancel(r.set(true)),
            ).fork,
        ),
        IO.bind(IO(() => ticker.ctx.tickAll())),
        IO.bind(({ fiber }) => fiber.cancel),
        IO.bindTo('l2', ({ l }) => l.get()),
        IO.bindTo('r2', ({ r }) => r.get()),
      ).map(({ l2, r2 }) => [l2, r2] as [boolean, boolean]);

      expect(io).toCompleteWith([true, true], ticker);
    });
  });

  describe('cancelation', () => {
    it.ticked('should never terminate', ticker => {
      expect(IO.never).toNeverTerminate(ticker);
    });

    it.ticked('should cancel never after forking', ticker => {
      const io = IO.never.fork.flatMap(f => f.cancel['>>>'](f.join));

      expect(io).toCompleteWith(IOOutcome.canceled(), ticker);
    });

    it.ticked('should cancel infinite chain of binds', ticker => {
      const infinite: IO<void> = IO.unit.flatMap(() => infinite);
      const io = infinite.fork.flatMap(f => f.cancel['>>>'](f.join));

      expect(io).toCompleteWith(IOOutcome.canceled(), ticker);
    });

    it.ticked('should trigger cancelation cleanup of async', ticker => {
      const cleanup = jest.fn();

      const target = IO.async(() => IO.pure(Some(IO(cleanup))));

      const io = pipe(
        IO.Do,
        IO.bindTo('f', () => target.fork),
        IO.bind(() => IO(() => ticker.ctx.tickAll())),
      ).flatMap(({ f }) => f.cancel);

      expect(io).toCompleteWith(undefined, ticker);
      expect(cleanup).toHaveBeenCalled();
    });

    it.ticked(
      'should end with canceled outcome when canceled in uncancelable block',
      ticker => {
        const io = IO.uncancelable(() => IO.canceled);

        expect(io).toCancel(ticker);
      },
    );

    it.ticked('should cancel bind of canceled uncancelable block', ticker => {
      const cont = jest.fn();
      const io = IO.uncancelable(() => IO.canceled).flatMap(() => IO(cont));

      expect(io).toCancel(ticker);
      expect(cont).not.toHaveBeenCalled();
    });

    it.ticked('should execute onCancel block', ticker => {
      const cleanup = jest.fn();

      const io = IO.uncancelable(poll =>
        IO.canceled.flatMap(() => poll(IO.unit).onCancel(IO(cleanup))),
      );

      expect(io).toCancel(ticker);
      expect(cleanup).toHaveBeenCalled();
    });

    it.ticked(
      'should break out of uncancelable when canceled before poll',
      ticker => {
        const cont = jest.fn();

        const io = IO.uncancelable(poll =>
          IO.canceled.flatMap(() => poll(IO.unit)).flatMap(() => IO(cont)),
        );

        expect(io).toCancel(ticker);
        expect(cont).not.toHaveBeenCalled();
      },
    );

    it.ticked(
      'should not execute onCancel block when canceled within uncancelable',
      ticker => {
        const cleanup = jest.fn();

        const io = IO.uncancelable(() =>
          IO.canceled.flatMap(() => IO.unit.onCancel(IO(cleanup))),
        );

        expect(io).toCancel(ticker);
        expect(cleanup).not.toHaveBeenCalled();
      },
    );

    it.ticked('should unmask only the current fiber', ticker => {
      const cont = jest.fn();

      const io = IO.uncancelable(outerPoll => {
        const inner = IO.uncancelable(() =>
          outerPoll(IO.canceled.flatMap(() => IO(cont))),
        );

        return inner.fork.flatMap(f => f.join).void;
      });

      expect(io).toCompleteWith(undefined, ticker);
      expect(cont).toHaveBeenCalled();
    });

    it.ticked('should run three finalizers while async suspended', ticker => {
      const results: number[] = [];
      const pushResult: (x: number) => IO<void> = x =>
        IO(() => {
          results.push(x);
        });

      const body = IO.async<never>(() => IO.pure(Some(pushResult(1))));

      const io = pipe(
        IO.Do,
        IO.bindTo(
          'fiber',
          body.onCancel(pushResult(2)).onCancel(pushResult(3)).fork,
        ),
        IO.bind(IO(() => ticker.ctx.tickAll())),
        IO.bind(({ fiber }) => fiber.cancel),
      ).flatMap(({ fiber }) => fiber.join);

      expect(io).toCompleteWith(IOOutcome.canceled(), ticker);
      expect(results).toEqual([1, 2, 3]);
    });

    it.ticked(
      'should apply nested polls when called in correct order',
      ticker => {
        const cont = jest.fn();

        const io = IO.uncancelable(outerPoll =>
          IO.uncancelable(innerPoll =>
            outerPoll(innerPoll(IO.canceled)).flatMap(() => IO(cont)),
          ),
        );

        expect(io).toCancel(ticker);
        expect(cont).toHaveBeenCalled();
      },
    );

    it.ticked(
      'should not apply nested polls when called in incorrect order',
      ticker => {
        const cont = jest.fn();

        const io = IO.uncancelable(outerPoll =>
          IO.uncancelable(innerPoll =>
            innerPoll(outerPoll(IO.canceled)).flatMap(() => IO(cont)),
          ),
        );

        expect(io).toCancel(ticker);
        expect(cont).not.toHaveBeenCalled();
      },
    );

    it.ticked('should ignore repeated poll calls', ticker => {
      const cont = jest.fn();

      const io = IO.uncancelable(poll =>
        IO.uncancelable(() => poll(poll(IO.canceled)).flatMap(() => IO(cont))),
      );

      expect(io).toCancel(ticker);
      expect(cont).toHaveBeenCalled();
    });
  });

  describe('finalizers', () => {
    it.ticked('finalizer should not run on success', ticker => {
      const fin = jest.fn();

      const io = IO.pure(42).onCancel(IO(fin));

      expect(io).toCompleteWith(42, ticker);
      expect(fin).not.toHaveBeenCalled();
    });

    it.ticked('should run finalizer on success', ticker => {
      const fin = jest.fn();

      const io = IO.pure(42).finalize(() => IO(fin));

      expect(io).toCompleteWith(42, ticker);
      expect(fin).toHaveBeenCalled();
    });

    it.ticked('should run finalizer on failure', ticker => {
      const fin = jest.fn();

      const io = IO.throwError(new Error('test error')).finalize(() => IO(fin));

      expect(io).toFailWith(new Error('test error'), ticker);
      expect(fin).toHaveBeenCalled();
    });

    it.ticked('should run finalizer on cancelation', ticker => {
      const fin = jest.fn();

      const io = IO.canceled.finalize(() => IO(fin));

      expect(io).toCancel(ticker);
      expect(fin).toHaveBeenCalled();
    });

    it.ticked('should run multiple finalizers', ticker => {
      const inner = jest.fn();
      const outer = jest.fn();

      const io = IO.pure(42)
        .finalize(() => IO(inner))
        .finalize(() => IO(outer));

      expect(io).toCompleteWith(42, ticker);
      expect(inner).toHaveBeenCalled();
      expect(outer).toHaveBeenCalled();
    });

    it.ticked('should run multiple finalizers exactly once', ticker => {
      const inner = jest.fn();
      const outer = jest.fn();

      const io = IO.pure(42)
        .finalize(() => IO(inner))
        .finalize(() => IO(outer));

      expect(io).toCompleteWith(42, ticker);
      expect(inner).toHaveBeenCalledTimes(1);
      expect(outer).toHaveBeenCalledTimes(1);
    });

    it.ticked('should run finalizer on async success', ticker => {
      const fin = jest.fn();

      const io = IO.pure(42)
        .delayBy(1_000 * 60 * 60 * 24) // 1 day
        .finalize(oc =>
          oc.fold(
            () => IO.unit,
            () => IO.unit,
            () => IO(fin),
          ),
        );

      expect(io).toCompleteWith(42, ticker);
      expect(fin).toHaveBeenCalled();
    });

    it.ticked('should retain errors through finalizers', ticker => {
      const io = IO.throwError(new Error('test error'))
        .finalize(() => IO.unit)
        .finalize(() => IO.unit);

      expect(io).toFailWith(new Error('test error'), ticker);
    });

    it.ticked('should run an async finalizer of async IO', ticker => {
      const fin = jest.fn();

      const body = IO.async(() =>
        IO(() =>
          Some(
            IO.async<void>(cb =>
              IO.readExecutionContext
                .flatMap(ec =>
                  // enforce async completion
                  IO(() => ec.executeAsync(() => cb(Either.rightUnit))),
                )
                .map(() => None),
            ),
          ).tap(fin),
        ),
      );

      const io = pipe(
        IO.Do,
        IO.bindTo('fiber', body.fork),
        IO.bind(IO(() => ticker.ctx.tickAll())), // start async task
      ).flatMap(({ fiber }) => fiber.cancel); // cancel after the async task is running;

      expect(io).toCompleteWith(undefined, ticker);
      expect(fin).toHaveBeenCalled();
    });

    it.ticked(
      'should not run finalizer of canceled uncancelable succeeds',
      ticker => {
        const fin = jest.fn();

        const io = IO.uncancelable(() => IO.canceled.map(() => 42)).onCancel(
          IO(fin),
        );

        expect(io).toCancel(ticker);
        expect(fin).not.toHaveBeenCalled();
      },
    );

    it.ticked(
      'should not run finalizer of canceled uncancelable fails',
      ticker => {
        const fin = jest.fn();

        const io = IO.uncancelable(() =>
          IO.canceled.flatMap(() => IO.throwError(new Error('test error'))),
        ).onCancel(IO(fin));

        expect(io).toCancel(ticker);
        expect(fin).not.toHaveBeenCalled();
      },
    );

    it.ticked('should run finalizer on failed bracket use', ticker => {
      const io = pipe(
        IO.Do,
        IO.bindTo('ref', IO.ref(false)),
        IO.bind(
          ({ ref }) =>
            IO.bracketFull(
              () => IO.unit,
              () => throwError(new Error('Uncaught error')),
              () => ref.set(true),
            ).attempt,
        ),
      ).flatMap(({ ref }) => ref.get());

      expect(io).toCompleteWith(true, ticker);
    });

    it.ticked(
      'should cancel never completing use of acquired resource',
      ticker => {
        const io = pipe(
          IO.Do,
          IO.bindTo('def', IO.deferred<void>()),
          IO.bindTo('bracket', ({ def }) =>
            IO.pure(
              IO.bracketFull(
                () => IO.unit,
                () => IO.never,
                () => def.complete(undefined),
              ),
            ),
          ),
          IO.bindTo('dFiber', ({ def }) => def.get().fork),
          IO.bind(IO(() => ticker.ctx.tickAll())), // start waiting for the result of cancelation
          IO.bindTo('bFiber', ({ bracket }) => bracket.fork),
          IO.bind(IO(() => ticker.ctx.tickAll())), // start `use` with resource
          IO.bind(({ bFiber }) => bFiber.cancel),
        ).flatMap(({ dFiber }) => dFiber.join); // await the cancelation result

        expect(io).toCompleteWith(IOOutcome.success(IO.unit), ticker);
      },
    );
  });

  describe('stack-safety', () => {
    it.ticked('should evaluate 10,000 consecutive binds', ticker => {
      const loop: (i: number) => IO<void> = i =>
        i < 10_000 ? IO.unit.flatMap(() => loop(i + 1)).map(id) : IO.unit;

      expect(loop(0)).toCompleteWith(undefined, ticker);
    });

    it.ticked('should evaluate 10,000 error handler binds', ticker => {
      const loop: (i: number) => IO<void> = i =>
        i < 10_000
          ? IO.unit.flatMap(() => loop(i + 1)).handleErrorWith(IO.throwError)
          : IO.throwError(new Error('test error'));

      const io = loop(0).handleErrorWith(() => IO.unit);
      expect(io).toCompleteWith(undefined, ticker);
    });

    it.ticked('should evaluate 10,000 consecutive attempts', ticker => {
      let acc: IO<unknown> = IO.unit;

      for (let i = 0; i < 10_000; i++) acc = acc.attempt;

      const io = acc.flatMap(() => IO.unit);
      expect(io).toCompleteWith(undefined, ticker);
    });
  });

  describe('parTraverseN', () => {
    it.ticked('should propagate errors', ticker => {
      const io = pipe(
        List(1, 2, 3),
        IO.parTraverseN(List.Traversable)(2, x =>
          x === 2 ? throwError(new Error('test error')) : IO.unit,
        ),
      );

      expect(io).toFailWith(new Error('test error'), ticker);
    });

    it.ticked('should be cancelable', ticker => {
      const traverse = pipe(
        List(1, 2, 3),
        IO.parTraverseN(List.Traversable)(2, () => IO.never),
      );

      const io = pipe(
        IO.Do,
        IO.bindTo('fiber', () => traverse.fork),
        IO.bind(() => IO(() => ticker.ctx.tickAll())),
      ).flatMap(({ fiber }) => fiber.cancel);

      expect(io).toCompleteWith(undefined, ticker);
    });

    it.ticked('should cancel all running tasks', ticker => {
      const fins = List(jest.fn(), jest.fn(), jest.fn());

      const traverse = pipe(
        fins,
        IO.parTraverseN(List.Traversable)(2, fin => IO.never.onCancel(IO(fin))),
      );

      const io = pipe(
        IO.Do,
        IO.bindTo('fiber', () => traverse.fork),
        IO.bind(IO(() => ticker.ctx.tickAll())),
      ).flatMap(({ fiber }) => fiber.cancel);

      expect(io).toCompleteWith(undefined, ticker);
      expect(fins.elem(0)).toHaveBeenCalled();
      expect(fins.elem(1)).toHaveBeenCalled();
      expect(fins.elem(2)).not.toHaveBeenCalled();
    });

    it.ticked(
      'should not execute un-started IOs when earlier one failed',
      ticker => {
        const fin = jest.fn();
        const cont = jest.fn();
        const ts = List(
          IO.defer(() => IO.throwError(new Error('test test'))),
          IO.never,
          IO.never.onCancel(IO(fin)),
          IO(cont),
          IO(cont),
        );

        const io = pipe(ts, IO.parTraverseN(List.Traversable)(2, id));

        expect(io).toFailWith(new Error('test test'), ticker);
        expect(fin).toHaveBeenCalled();
        expect(cont).not.toHaveBeenCalled();
      },
    );

    it.ticked(
      'should not release the permit when release gets canceled',
      ticker => {
        const cont = jest.fn();

        const io = pipe(
          IO.Do,
          IO.bindTo('sem', Semaphore.withPermits(IO.Async)(1)),
          IO.bindTo('f1', ({ sem }) => sem.withPermit(IO.never).fork),
          IO.bindTo('f2', ({ sem }) => sem.withPermit(IO.never).fork),
          IO.bind(IO(() => ticker.ctx.tickAll())),
          IO.bind(({ sem }) => sem.withPermit(IO(cont)).fork),
          IO.bind(IO(() => ticker.ctx.tickAll())),
        ).flatMap(({ f2 }) => f2.cancel);

        expect(io).toCompleteWith(undefined, ticker);
        expect(cont).not.toHaveBeenCalled();
      },
    );
  });

  describe.ticked('Laws', ticker => {
    const spawnTests = AsyncSuite(IO.Async);
    checkAll(
      'Async<IO>',
      spawnTests.async(
        fc.integer(),
        fc.string(),
        fc.string(),
        fc.string(),
        ticker.ctx,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        E.eqIOOutcome(Eq.primitive),
        A.fp4tsIO,
        EqX => E.eqIO(EqX, ticker),
      ),
    );
  });
});
