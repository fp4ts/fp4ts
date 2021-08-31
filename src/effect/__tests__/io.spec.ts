import '../test-kit/jest';
import { id, pipe } from '../../fp/core';
import * as E from '../../fp/either';

import { IO } from '../io';
import * as O from '../kernel/outcome';
import { Semaphore } from '../kernel/semaphore';
import { ioAsync } from '../io/instances';
import { List } from '../../cats/data';
import { listTraversable } from '../../cats/data/list/instances';

const throwError = (e: Error) => {
  throw e;
};

describe('io monad', () => {
  describe('free monad', () => {
    it.ticked('should produce a pure value', async ticker => {
      await expect(IO.pure(42)).toCompleteWith(42, ticker);
    });

    it.ticked('should sequence two effects', async ticker => {
      let i: number = 0;

      const fa = pipe(
        IO.pure(42).flatMap(i2 =>
          IO(() => {
            i = i2;
          }),
        ),
      );

      await expect(fa).toCompleteWith(undefined, ticker);
      expect(i).toBe(42);
    });

    it.ticked('should preserve monad identity on async', async ticker => {
      const io1 = IO.async_(cb => IO(() => cb(E.right(42))));
      const io2 = io1.flatMap(i => IO.pure(i));

      await expect(io1).toCompleteWith(42, ticker);
      await expect(io2).toCompleteWith(42, ticker);
    });
  });

  describe('error handling', () => {
    it.ticked('should capture suspended error', async ticker => {
      const io = IO(() => throwError(Error('test error')));
      await expect(io).toFailWith(new Error('test error'), ticker);
    });

    it.ticked('should resume async IO with failure', async ticker => {
      const io = IO.async_(cb => IO(() => cb(E.left(new Error('test error')))));
      await expect(io).toFailWith(new Error('test error'), ticker);
    });

    it.ticked('should propagate thrown error', async ticker => {
      const io = IO.throwError(new Error('test error')).void;
      await expect(io).toFailWith(new Error('test error'), ticker);
    });

    it.ticked('should short circuit the execution on error', async ticker => {
      const fn = jest.fn();
      const io = IO.throwError(new Error('test error')).flatMap(() => IO(fn));

      await expect(io).toFailWith(new Error('test error'), ticker);
      expect(fn).not.toHaveBeenCalled();
    });

    it.ticked('should handle thrown error', async ticker => {
      const io = IO.throwError(new Error('test error')).attempt;
      await expect(io).toCompleteWith(E.left(new Error('test error')), ticker);
    });

    it.ticked('should catch error thrown in redeem recovery', async ticker => {
      const io = IO.throwError(new Error('test error')).redeem(
        () => throwError(new Error('thrown error')),
        () => 42,
      ).attempt;

      await expect(io).toCompleteWith(
        E.left(new Error('thrown error')),
        ticker,
      );
    });

    it.ticked('should recover from errors using redeemWith', async ticker => {
      const io = IO.throwError(new Error()).redeemWith(
        () => IO.pure(42),
        () => IO.pure(43),
      );
      await expect(io).toCompleteWith(42, ticker);
    });

    it.ticked('should bind success values using redeemWith', async ticker => {
      const io = IO.unit.redeemWith(
        () => IO.pure(42),
        () => IO.pure(43),
      );
      await expect(io).toCompleteWith(43, ticker);
    });

    it.ticked('should catch error thrown in map', async ticker => {
      const io = IO.unit.map(() => throwError(new Error('test error'))).attempt;

      await expect(io).toCompleteWith(E.left(new Error('test error')), ticker);
    });

    it.ticked('should catch error thrown in flatMap', async ticker => {
      const io = IO.unit.flatMap(() =>
        throwError(new Error('test error')),
      ).attempt;

      await expect(io).toCompleteWith(E.left(new Error('test error')), ticker);
    });

    it.ticked('should catch error thrown in handleErrorWith', async ticker => {
      const io = IO.throwError(new Error('test error')).handleErrorWith(() =>
        throwError(new Error('thrown error')),
      ).attempt;

      await expect(io).toCompleteWith(
        E.left(new Error('thrown error')),
        ticker,
      );
    });

    it.ticked(
      'should throw first bracket release error if use effect succeeded',
      async ticker => {
        const inner = IO.unit.bracket(() => IO.unit)(() =>
          IO.throwError(new Error('first error')),
        );

        const io = IO.unit.bracket(() => inner)(() =>
          IO.throwError(new Error('second error')),
        ).attempt;

        await expect(io).toCompleteWith(
          E.left(new Error('first error')),
          ticker,
        );
      },
    );
  });

  describe('side effect suspension', () => {
    it.ticked('should not memoize effects', async ticker => {
      let counter = 42;
      const io = IO(() => {
        counter += 1;
        return counter;
      });

      await expect(io).toCompleteWith(43, ticker);
      await expect(io).toCompleteWith(44, ticker);
    });

    it.ticked('should execute suspended effect on each use', async ticker => {
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

      await expect(io).toCompleteWith([43, 44], ticker);
    });
  });

  describe('fibers', () => {
    it.ticked('should fork and join a fiber', async ticker => {
      const io = IO.pure(42)
        .map(x => x + 1)
        .fork.flatMap(f => f.join);

      await expect(io).toCompleteWith(O.success(IO.pure(43)), ticker);
    });

    it.ticked('should fork and join a failed fiber', async ticker => {
      const io = IO.throwError(new Error('test error')).fork.flatMap(
        f => f.join,
      );

      await expect(io).toCompleteWith(
        O.failure(new Error('test error')),
        ticker,
      );
    });

    it.ticked(
      'should fork and ignore a non-terminating fiber',
      async ticker => {
        const io = IO.never.fork.map(() => 42);
        await expect(io).toCompleteWith(42, ticker);
      },
    );

    it.ticked(
      'should start a fiber and continue with its results',
      async ticker => {
        const io = IO.pure(42)
          .fork.flatMap(f => f.join)
          .flatMap(
            O.fold(
              () => IO.pure(0),
              () => IO.pure(-1),
              id,
            ),
          );

        await expect(io).toCompleteWith(42, ticker);
      },
    );

    it.ticked(
      'should produce canceled outcome when fiber canceled',
      async ticker => {
        const io = IO.canceled.fork.flatMap(f => f.join);
        await expect(io).toCompleteWith(O.canceled, ticker);
      },
    );

    it.ticked('should cancel already canceled fiber', async ticker => {
      const ioa = pipe(
        IO.Do,
        IO.bindTo('f', () => IO.canceled.fork),
        IO.bind(() => IO(() => ticker.tickAll())),
        IO.bind(({ f }) => f.cancel),
      ).void;

      await expect(ioa).toCompleteWith(undefined, ticker);
    });
  });

  describe('async', () => {
    it.ticked('should resume async continuation', async ticker => {
      const io = IO.async_(cb => IO(() => cb(E.right(42))));

      await expect(io).toCompleteWith(42, ticker);
    });

    it.ticked(
      'should resume async continuation and bind its results',
      async ticker => {
        const io = IO.async_<number>(cb => IO(() => cb(E.right(42)))).map(
          x => x + 2,
        );

        await expect(io).toCompleteWith(44, ticker);
      },
    );

    it.ticked('should produce a failure when bind fails', async ticker => {
      const io = IO.async_<number>(cb => IO(() => cb(E.right(42)))).flatMap(
        () => IO.throwError(new Error('test error')),
      ).void;

      await expect(io).toFailWith(new Error('test error'), ticker);
    });

    it.ticked(
      'should resume only once even if cb called multiple times',
      async ticker => {
        let cb: (ea: E.Either<Error, number>) => void;

        const async = IO.async_<number>(cb0 =>
          IO(() => {
            cb = cb0;
          }),
        );

        const io = pipe(
          IO.Do,
          IO.bindTo('f', () => async.fork),
          IO.bind(IO(() => ticker.tickAll())),
          IO.bind(IO(() => cb(E.right(42)))),
          IO.bind(IO(() => ticker.tickAll())),
          IO.bind(IO(() => cb(E.right(43)))),
          IO.bind(IO(() => ticker.tickAll())),
          IO.bind(IO(() => cb(E.left(new Error('test error'))))),
        ).flatMap(({ f }) => f.join);

        await expect(io).toCompleteWith(O.success(IO.pure(42)), ticker);
      },
    );

    it.ticked(
      'should cancel and complete a fiber while finalizer on poll',
      async ticker => {
        const ioa = IO.uncancelable(poll =>
          IO.canceled
            .flatMap(() => poll(IO.unit))
            .finalize(() => IO.unit)
            .fork.flatMap(f => f.join),
        );

        await expect(ioa).toCompleteWith(O.canceled, ticker);
      },
    );

    it.ticked('should allow miss-ordering of completions', async ticker => {
      let outerR: number = 0;
      let innerR: number = 0;

      const outer = IO.async_<number>(cb1 => {
        const inner = IO.async_<number>(cb2 =>
          IO(() => cb1(E.right(1)))
            .flatMap(() => IO.readExecutionContext)
            .flatMap(ec => IO(() => ec.executeAsync(() => cb2(E.right(2))))),
        );

        return inner.flatMap(i =>
          IO(() => {
            innerR = i;
          }),
        );
      });

      const io = outer.flatMap(i =>
        IO(() => {
          outerR = i;
        }),
      );

      await expect(io).toCompleteWith(undefined, ticker);
      expect(innerR).toBe(1);
      expect(outerR).toBe(2);
    });
  });

  describe('both', () => {
    it.ticked('should complete when both fibers complete', async ticker => {
      const io = IO.both(IO.pure(42), IO.pure(43));
      await expect(io).toCompleteWith([42, 43], ticker);
    });

    it.ticked('should fail if lhs fiber fails', async ticker => {
      const io = IO.both(IO.throwError(new Error('left error')), IO.pure(43));
      await expect(io).toFailWith(new Error('left error'), ticker);
    });

    it.ticked('should fail if rhs fiber fails', async ticker => {
      const io = IO.both(IO.pure(42), IO.throwError(new Error('right error')));
      await expect(io).toFailWith(new Error('right error'), ticker);
    });

    it.ticked('should cancel if lhs cancels', async ticker => {
      const io = IO.both(IO.canceled, IO.pure(43)).fork.flatMap(f => f.join);

      await expect(io).toCompleteWith(O.canceled, ticker);
    });

    it.ticked('should cancel if rhs cancels', async ticker => {
      const io = IO.both(IO.pure(42), IO.canceled).fork.flatMap(f => f.join);

      await expect(io).toCompleteWith(O.canceled, ticker);
    });

    it.ticked('should propagate cancelation', async ticker => {
      const io = pipe(
        IO.Do,
        IO.bindTo('f', IO.both(IO.never, IO.never).fork),
        IO.bind(IO(() => ticker.tickAll())),
        IO.bind(({ f }) => f.cancel),
        IO.bind(IO(() => ticker.tickAll())),
      ).flatMap(({ f }) => f.join);

      await expect(io).toCompleteWith(O.canceled, ticker);
    });

    it.ticked('should cancel both fibers', async ticker => {
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
        IO.bind(IO(() => ticker.tickAll())),
        IO.bind(({ fiber }) => fiber.cancel),
        IO.bind(IO(() => ticker.tickAll())),
        IO.bindTo('l2', ({ l }) => l.get()),
        IO.bindTo('r2', ({ r }) => r.get()),
      ).map(({ l2, r2 }) => [l2, r2] as [boolean, boolean]);

      await expect(io).toCompleteWith([true, true], ticker);
    });
  });

  describe('race', () => {
    it.ticked('should complete with faster, lhs', async ticker => {
      const io = IO.race(
        IO.pure(42),
        IO.sleep(100).flatMap(() => IO.pure(43)),
      );

      await expect(io).toCompleteWith(E.left(42), ticker);
    });

    it.ticked('should complete with faster, rhs', async ticker => {
      const io = IO.race(
        IO.sleep(100).flatMap(() => IO.pure(42)),
        IO.pure(43),
      );

      await expect(io).toCompleteWith(E.right(43), ticker);
    });

    it.ticked('should fail if lhs fails', async ticker => {
      const io = IO.race(IO.throwError(new Error('left error')), IO.pure(43));
      await expect(io).toFailWith(new Error('left error'), ticker);
    });

    it.ticked('should fail if rhs fails', async ticker => {
      const io = IO.race(IO.pure(42), IO.throwError(new Error('right error')));
      await expect(io).toFailWith(new Error('right error'), ticker);
    });

    it.ticked(
      'should fail if lhs fails and rhs never completes',
      async ticker => {
        const io = IO.race(IO.throwError(new Error('left error')), IO.never);
        await expect(io).toFailWith(new Error('left error'), ticker);
      },
    );

    it.ticked(
      'should fail if rhs fails and lhs never completes',
      async ticker => {
        const io = IO.race(IO.never, IO.throwError(new Error('right error')));
        await expect(io).toFailWith(new Error('right error'), ticker);
      },
    );

    it.ticked(
      'should complete with lhs when rhs never completes',
      async ticker => {
        const io = IO.race(IO.pure(42), IO.never);
        await expect(io).toCompleteWith(E.left(42), ticker);
      },
    );

    it.ticked(
      'should complete with rhs when lhs never completes',
      async ticker => {
        const io = IO.race(IO.never, IO.pure(43));
        await expect(io).toCompleteWith(E.right(43), ticker);
      },
    );

    it.ticked('should be canceled when both sides canceled', async ticker => {
      const io = IO.race(IO.canceled, IO.canceled).fork.flatMap(f => f.join);

      await expect(io).toCompleteWith(O.canceled, ticker);
    });

    it.ticked(
      'should succeed if lhs succeeds and rhs cancels',
      async ticker => {
        const io = IO.race(IO.pure(42), IO.canceled);
        await expect(io).toCompleteWith(E.left(42), ticker);
      },
    );

    it.ticked(
      'should succeed if rhs succeeds and lhs cancels',
      async ticker => {
        const io = IO.race(IO.canceled, IO.pure(43));
        await expect(io).toCompleteWith(E.right(43), ticker);
      },
    );

    it.ticked('should fail if lhs fails and rhs cancels', async ticker => {
      const io = IO.race(IO.throwError(new Error('test error')), IO.canceled);
      await expect(io).toFailWith(new Error('test error'), ticker);
    });

    it.ticked('should fail if rhs fails and lhs cancels', async ticker => {
      const io = IO.race(IO.canceled, IO.throwError(new Error('test error')));
      await expect(io).toFailWith(new Error('test error'), ticker);
    });

    it.ticked('should cancel both fibers when canceled', async ticker => {
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
        IO.bind(IO(() => ticker.tickAll())),
        IO.bind(({ fiber }) => fiber.cancel),
        IO.bindTo('l2', ({ l }) => l.get()),
        IO.bindTo('r2', ({ r }) => r.get()),
      ).map(({ l2, r2 }) => [l2, r2] as [boolean, boolean]);

      await expect(io).toCompleteWith([true, true], ticker);
    });
  });

  describe('cancelation', () => {
    it.ticked('should cancel never after forking', async ticker => {
      const io = IO.never.fork.flatMap(f => f.cancel['>>>'](f.join));

      await expect(io).toCompleteWith(O.canceled, ticker);
    });

    it.ticked('should cancel infinite chain of binds', async ticker => {
      const infinite: IO<void> = IO.unit.flatMap(() => infinite);
      const io = infinite.fork.flatMap(f => f.cancel['>>>'](f.join));

      await expect(io).toCompleteWith(O.canceled, ticker);
    });

    it.ticked('should trigger cancelation cleanup of async', async ticker => {
      const cleanup = jest.fn();

      const target = IO.async(() => IO.pure(IO(cleanup)));

      const io = pipe(
        IO.Do,
        IO.bindTo('f', () => target.fork),
        IO.bind(() => IO(() => ticker.tickAll())),
      ).flatMap(({ f }) => f.cancel);

      await expect(io).toCompleteWith(undefined, ticker);
      expect(cleanup).toHaveBeenCalled();
    });

    // it.ticked(
    //   'should not trigger cancelation cleanup of async when wrapped in uncancelable',
    //   async ticker => {
    //     let executed = false;

    //     const target = IO.uncancelable(() =>
    //       IO.async_(() =>
    //         IO.pure(
    //           IO(() => {
    //             executed = true;
    //           }),
    //         ),
    //       ),
    //     );

    //     const io = pipe(
    //       IO.Do,
    //       IO.bindTo('f', () => IO.fork(target)),
    //       IO.bind(() => IO(() => ticker.tickAll())),
    //       IO.flatMap(({ f }) => f.cancel),
    //     );

    //     await expect(io).toCompleteAs(undefined, ticker);
    //     expect(executed).toBe(true);
    //   },
    // );

    it.ticked(
      'should end with canceled outcome when canceled in uncancelable block',
      async ticker => {
        const io = IO.uncancelable(() => IO.canceled);

        await expect(io).toCancel(ticker);
      },
    );

    it.ticked(
      'should cancel bind of canceled uncancelable block',
      async ticker => {
        const cont = jest.fn();
        const io = IO.uncancelable(() => IO.canceled).flatMap(() => IO(cont));

        await expect(io).toCancel(ticker);
        expect(cont).not.toHaveBeenCalled();
      },
    );

    it.ticked('should execute onCancel block', async ticker => {
      const cleanup = jest.fn();

      const io = IO.uncancelable(poll =>
        IO.canceled.flatMap(() => poll(IO.unit).onCancel(IO(cleanup))),
      );

      await expect(io).toCancel(ticker);
      expect(cleanup).toHaveBeenCalled();
    });

    it.ticked(
      'should break out of uncancelable when canceled before poll',
      async ticker => {
        const cont = jest.fn();

        const io = IO.uncancelable(poll =>
          IO.canceled.flatMap(() => poll(IO.unit)).flatMap(() => IO(cont)),
        );

        await expect(io).toCancel(ticker);
        expect(cont).not.toHaveBeenCalled();
      },
    );

    it.ticked(
      'should not execute onCancel block when canceled within uncancelable',
      async ticker => {
        const cleanup = jest.fn();

        const io = IO.uncancelable(() =>
          IO.canceled.flatMap(() => IO.unit.onCancel(IO(cleanup))),
        );

        await expect(io).toCancel(ticker);
        expect(cleanup).not.toHaveBeenCalled();
      },
    );

    it.ticked('should unmask only the current fiber', async ticker => {
      const cont = jest.fn();

      const io = IO.uncancelable(outerPoll => {
        const inner = IO.uncancelable(() =>
          outerPoll(IO.canceled.flatMap(() => IO(cont))),
        );

        return inner.fork.flatMap(f => f.join).void;
      });

      await expect(io).toCompleteWith(undefined, ticker);
      expect(cont).toHaveBeenCalled();
    });

    it.ticked(
      'should run three finalizers while async suspended',
      async ticker => {
        const results: number[] = [];
        const pushResult: (x: number) => IO<void> = x =>
          IO(() => {
            results.push(x);
          });

        const body = IO.async<never>(() => IO.pure(pushResult(1)));

        const io = pipe(
          IO.Do,
          IO.bindTo(
            'fiber',
            body.onCancel(pushResult(2)).onCancel(pushResult(3)).fork,
          ),
          IO.bind(IO(() => ticker.tickAll())),
          IO.bind(({ fiber }) => fiber.cancel),
        ).flatMap(({ fiber }) => fiber.join);

        await expect(io).toCompleteWith(O.canceled, ticker);
        expect(results).toEqual([1, 2, 3]);
      },
    );

    it.ticked(
      'should apply nested polls when called in correct order',
      async ticker => {
        const cont = jest.fn();

        const io = IO.uncancelable(outerPoll =>
          IO.uncancelable(innerPoll =>
            outerPoll(innerPoll(IO.canceled)).flatMap(() => IO(cont)),
          ),
        );

        await expect(io).toCancel(ticker);
        expect(cont).toHaveBeenCalled();
      },
    );

    it.ticked(
      'should not apply nested polls when called in incorrect order',
      async ticker => {
        const cont = jest.fn();

        const io = IO.uncancelable(outerPoll =>
          IO.uncancelable(innerPoll =>
            innerPoll(outerPoll(IO.canceled)).flatMap(() => IO(cont)),
          ),
        );

        await expect(io).toCancel(ticker);
        expect(cont).not.toHaveBeenCalled();
      },
    );

    it.ticked('should ignore repeated poll calls', async ticker => {
      const cont = jest.fn();

      const io = IO.uncancelable(poll =>
        IO.uncancelable(() => poll(poll(IO.canceled)).flatMap(() => IO(cont))),
      );

      await expect(io).toCancel(ticker);
      expect(cont).toHaveBeenCalled();
    });
  });

  describe('finalizers', () => {
    it.ticked('finalizer should not run on success', async ticker => {
      const fin = jest.fn();

      const io = IO.pure(42).onCancel(IO(fin));

      await expect(io).toCompleteWith(42, ticker);
      expect(fin).not.toHaveBeenCalled();
    });

    it.ticked('should run finalizer on success', async ticker => {
      const fin = jest.fn();

      const io = IO.pure(42).finalize(() => IO(fin));

      await expect(io).toCompleteWith(42, ticker);
      expect(fin).toHaveBeenCalled();
    });

    it.ticked('should run finalizer on failure', async ticker => {
      const fin = jest.fn();

      const io = IO.throwError(new Error('test error')).finalize(() => IO(fin));

      await expect(io).toFailWith(new Error('test error'), ticker);
      expect(fin).toHaveBeenCalled();
    });

    it.ticked('should run finalizer on cancelation', async ticker => {
      const fin = jest.fn();

      const io = IO.canceled.finalize(() => IO(fin));

      await expect(io).toCancel(ticker);
      expect(fin).toHaveBeenCalled();
    });

    it.ticked('should run multiple finalizers', async ticker => {
      const inner = jest.fn();
      const outer = jest.fn();

      const io = IO.pure(42)
        .finalize(() => IO(inner))
        .finalize(() => IO(outer));

      await expect(io).toCompleteWith(42, ticker);
      expect(inner).toHaveBeenCalled();
      expect(outer).toHaveBeenCalled();
    });

    it.ticked('should run multiple finalizers exactly once', async ticker => {
      const inner = jest.fn();
      const outer = jest.fn();

      const io = IO.pure(42)
        .finalize(() => IO(inner))
        .finalize(() => IO(outer));

      await expect(io).toCompleteWith(42, ticker);
      expect(inner).toHaveBeenCalledTimes(1);
      expect(outer).toHaveBeenCalledTimes(1);
    });

    it.ticked('should run finalizer on async success', async ticker => {
      const fin = jest.fn();

      const io = IO.pure(42)
        .delayBy(1_000 * 60 * 60 * 24) // 1 day
        .finalize(
          O.fold(
            () => IO.unit,
            () => IO.unit,
            () => IO(fin),
          ),
        );

      await expect(io).toCompleteWith(42, ticker);
      expect(fin).toHaveBeenCalled();
    });

    it.ticked('should retain errors through finalizers', async ticker => {
      const io = IO.throwError(new Error('test error'))
        .finalize(() => IO.unit)
        .finalize(() => IO.unit);

      await expect(io).toFailWith(new Error('test error'), ticker);
    });

    it.ticked('should run an async finalizer of async IO', async ticker => {
      const fin = jest.fn();

      const body = IO.async(() =>
        IO(() =>
          IO.async_<void>(cb =>
            IO.readExecutionContext.flatMap(ec =>
              // enforce async completion
              IO(() => ec.executeAsync(() => cb(E.rightUnit))),
            ),
          ).tap(fin),
        ),
      );

      const io = pipe(
        IO.Do,
        IO.bindTo('fiber', body.fork),
        IO.bind(IO(() => ticker.tickAll())), // start async task
      ).flatMap(({ fiber }) => fiber.cancel); // cancel after the async task is running;

      await expect(io).toCompleteWith(undefined, ticker);
      expect(fin).toHaveBeenCalled();
    });

    it.ticked(
      'should not run finalizer of canceled uncancelable succeeds',
      async ticker => {
        const fin = jest.fn();

        const io = IO.uncancelable(() => IO.canceled.map(() => 42)).onCancel(
          IO(fin),
        );

        await expect(io).toCancel(ticker);
        expect(fin).not.toHaveBeenCalled();
      },
    );

    it.ticked(
      'should not run finalizer of canceled uncancelable fails',
      async ticker => {
        const fin = jest.fn();

        const io = IO.uncancelable(() =>
          IO.canceled.flatMap(() => IO.throwError(new Error('test error'))),
        ).onCancel(IO(fin));

        await expect(io).toCancel(ticker);
        expect(fin).not.toHaveBeenCalled();
      },
    );

    it.ticked('should run finalizer on failed bracket use', async ticker => {
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

      await expect(io).toCompleteWith(true, ticker);
    });

    it.ticked(
      'should cancel never completing use of acquired resource',
      async ticker => {
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
          IO.bind(IO(() => ticker.tickAll())), // start waiting for the result of cancelation
          IO.bindTo('bFiber', ({ bracket }) => bracket.fork),
          IO.bind(IO(() => ticker.tickAll())), // start `use` with resource
          IO.bind(({ bFiber }) => bFiber.cancel),
        ).flatMap(({ dFiber }) => dFiber.join); // await the cancelation result

        await expect(io).toCompleteWith(O.success(IO.pure(undefined)), ticker);
      },
    );
  });

  describe('stack-safety', () => {
    it.ticked('should evaluate 10,000 consecutive binds', async ticker => {
      const loop: (i: number) => IO<void> = i =>
        i < 10_000 ? IO.unit.flatMap(() => loop(i + 1)).map(id) : IO.unit;

      await expect(loop(0)).toCompleteWith(undefined, ticker);
    });

    it.ticked('should evaluate 10,000 error handler binds', async ticker => {
      const loop: (i: number) => IO<void> = i =>
        i < 10_000
          ? IO.unit.flatMap(() => loop(i + 1)).handleErrorWith(IO.throwError)
          : IO.throwError(new Error('test error'));

      const io = loop(0).handleErrorWith(() => IO.unit);
      await expect(io).toCompleteWith(undefined, ticker);
    });

    it.ticked('should evaluate 10,000 consecutive attempts', async ticker => {
      let acc: IO<unknown> = IO.unit;

      for (let i = 0; i < 10_000; i++) acc = acc.attempt;

      const io = acc.flatMap(() => IO.unit);
      await expect(io).toCompleteWith(undefined, ticker);
    });
  });

  describe('parTraverseN', () => {
    it.ticked('should propagate errors', async ticker => {
      const io = pipe(
        List(1, 2, 3),
        IO.parTraverseN(
          listTraversable(),
          2,
        )(x => (x === 2 ? throwError(new Error('test error')) : IO.unit)),
      );

      await expect(io).toFailWith(new Error('test error'), ticker);
    });

    it.ticked('should be cancelable', async ticker => {
      const traverse = pipe(
        List(1, 2, 3),
        IO.parTraverseN(listTraversable(), 2)(() => IO.never),
      );

      const io = pipe(
        IO.Do,
        IO.bindTo('fiber', () => traverse.fork),
        IO.bind(() => IO(() => ticker.tickAll())),
      ).flatMap(({ fiber }) => fiber.cancel);

      await expect(io).toCompleteWith(undefined, ticker);
    });

    it.ticked('should cancel all running tasks', async ticker => {
      const fins = List(jest.fn(), jest.fn(), jest.fn());

      const traverse = pipe(
        fins,
        IO.parTraverseN(
          listTraversable(),
          2,
        )(fin => IO.never.onCancel(IO(fin))),
      );

      const io = pipe(
        IO.Do,
        IO.bindTo('fiber', () => traverse.fork),
        IO.bind(IO(() => ticker.tickAll())),
      ).flatMap(({ fiber }) => fiber.cancel);

      await expect(io).toCompleteWith(undefined, ticker);
      expect(fins.elem(0)).toHaveBeenCalled();
      expect(fins.elem(1)).toHaveBeenCalled();
      expect(fins.elem(2)).not.toHaveBeenCalled();
    });

    it.ticked(
      'should not execute un-started IOs when earlier one failed',
      async ticker => {
        const fin = jest.fn();
        const cont = jest.fn();
        const ts = List(
          IO.defer(() => IO.throwError(new Error('test test'))),
          IO.never,
          IO.never.onCancel(IO(fin)),
          IO(cont),
          IO(cont),
        );

        const io = pipe(ts, IO.parTraverseN(listTraversable(), 2)(id));

        await expect(io).toFailWith(new Error('test test'), ticker);
        expect(fin).toHaveBeenCalled();
        expect(cont).not.toHaveBeenCalled();
      },
    );

    it.ticked(
      'should not release the permit when release gets canceled',
      async ticker => {
        const cont = jest.fn();

        const io = pipe(
          IO.Do,
          IO.bindTo('sem', Semaphore.withPermits(ioAsync())(1)),
          IO.bindTo('f1', ({ sem }) => sem.withPermit(IO.never).fork),
          IO.bindTo('f2', ({ sem }) => sem.withPermit(IO.never).fork),
          IO.bind(IO(() => ticker.tickAll())),
          IO.bind(({ sem }) => sem.withPermit(IO(cont)).fork),
          IO.bind(IO(() => ticker.tickAll())),
        ).flatMap(({ f2 }) => f2.cancel);

        await expect(io).toCompleteWith(undefined, ticker);
        expect(cont).not.toHaveBeenCalled();
      },
    );
  });
});
