import * as E from '../../fp/either';
import * as O from '../outcome';
import * as IO from '../io';
import * as IOR from '../io-runtime';
import { TestExecutionContext } from '../tests/test-execution-context';
import { Ticker } from '../tests/ticker';
import { id, pipe } from '../../fp/core';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Matchers<R> {
      tickTo(oc: O.Outcome<unknown>, ticker: Ticker): Promise<unknown>;
      toCompleteAs(result: unknown, ticker: Ticker): Promise<unknown>;
      toFailAs(error: Error, ticker: Ticker): Promise<unknown>;
      toCancel(ticker: Ticker): Promise<unknown>;
    }

    interface It {
      ticked(
        message: string,
        body: (ticker: Ticker) => unknown | Promise<unknown>,
      ): void;
    }
  }
}

type T = typeof expect['extend'] extends (_: {
  [k: string]: (this: infer MatcherContext, ...arg: any) => any;
}) => any
  ? MatcherContext
  : never;

function ticked(
  runTest: (ticker: Ticker) => any | Promise<any>,
): () => Promise<any> {
  return () => {
    const ticker = new TestExecutionContext();
    return runTest(ticker);
  };
}

it.ticked = (
  message: string,
  testBody: (ticker: Ticker) => any | Promise<any>,
) => {
  it(
    message,
    ticked(ticker => testBody(ticker)),
  );
};

test.ticked = (
  message: string,
  testBody: (ticker: Ticker) => any | Promise<any>,
) => {
  test(
    message,
    ticked(ticker => testBody(ticker)),
  );
};

async function tickTo(
  this: T,
  receivedIO: IO.IO<unknown>,
  expected: O.Outcome<unknown>,
  ec: TestExecutionContext,
) {
  const receivedPromise = IOR.unsafeRunOutcomeToPromise_(receivedIO, ec);

  ec.tickAll();

  const received = await receivedPromise;
  const result = this.equals(received, expected);

  const message = O.fold_(
    expected,
    () =>
      O.fold_(
        received,
        () => 'be canceled, but was',
        e => `be canceled, but failed with ${this.utils.printReceived(`${e}`)}`,
        r =>
          `be canceled, but completed with ${this.utils.printReceived(`${r}`)}`,
      ),
    e =>
      O.fold_(
        received,
        () => `fail with ${this.utils.printExpected(`${e}`)}, but was canceled`,
        e2 =>
          `fail with ${this.utils.printExpected(
            `${e}`,
          )}, but failed with ${this.utils.printReceived(`${e2}`)}`,
        r2 =>
          `fail with ${this.utils.printExpected(
            `${e}`,
          )}, but completed with ${this.utils.printReceived(`${r2}`)}`,
      ),
    r =>
      O.fold_(
        received,
        () =>
          `complete with ${this.utils.printExpected(`${r}`)}, but was canceled`,
        e2 =>
          `complete with ${this.utils.printExpected(
            `${r}`,
          )}, but failed with ${this.utils.printReceived(`${e2}`)}`,
        r2 =>
          `complete with ${this.utils.printExpected(
            `${r}`,
          )}, but completed with ${this.utils.printReceived(`${r2}`)}`,
      ),
  );

  return result
    ? { pass: true, message: () => `Expected IO not to ${message}` }
    : { pass: false, message: () => `Expected IO to ${message}` };
}

expect.extend({
  tickTo,

  toCompleteAs(
    receivedIO: IO.IO<unknown>,
    expected: unknown,
    ec: TestExecutionContext,
  ) {
    return tickTo.apply(this, [receivedIO, O.success(expected), ec]);
  },

  toFailAs(
    receivedIO: IO.IO<unknown>,
    expected: Error,
    ec: TestExecutionContext,
  ) {
    return tickTo.apply(this, [receivedIO, O.failure(expected), ec]);
  },

  toCancel(receivedIO: IO.IO<unknown>, ec: TestExecutionContext) {
    return tickTo.apply(this, [receivedIO, O.canceled, ec]);
  },
});

const throwError = (e: Error) => {
  throw e;
};

describe('io monad', () => {
  describe('free monad', () => {
    it.ticked('should produce a pure value', async ticker => {
      await expect(IO.pure(42)).toCompleteAs(42, ticker);
    });

    it.ticked('should sequence two effects', async ticker => {
      let i: number = 0;

      const fa = pipe(
        IO.pure(42),
        IO.flatMap(i2 =>
          IO.delay(() => {
            i = i2;
          }),
        ),
      );

      await expect(fa).toCompleteAs(undefined, ticker);
      expect(i).toBe(42);
    });

    it.ticked('should preserve monad identity on async', async ticker => {
      const io1 = IO.async(cb => IO.delay(() => cb(E.right(42))));
      const io2 = IO.flatMap_(io1, i => IO.pure(i));

      await expect(io1).toCompleteAs(42, ticker);
      await expect(io2).toCompleteAs(42, ticker);
    });
  });

  describe('error handling', () => {
    it.ticked('should capture suspended error', async ticker => {
      const io = IO.delay(() => throwError(Error('test error')));
      await expect(io).toFailAs(new Error('test error'), ticker);
    });

    it.ticked('should resume async IO with failure', async ticker => {
      const io = IO.async(cb =>
        IO.delay(() => cb(E.left(new Error('test error')))),
      );
      await expect(io).toFailAs(new Error('test error'), ticker);
    });

    it.ticked('should propagate thrown error', async ticker => {
      const io = pipe(
        IO.throwError(new Error('test error')),
        IO.flatMap(() => IO.unit),
      );
      await expect(io).toFailAs(new Error('test error'), ticker);
    });

    it.ticked('should short circuit the execution on error', async ticker => {
      const fn = jest.fn();
      const io = pipe(
        IO.throwError(new Error('test error')),
        IO.flatMap(() => IO.delay(fn)),
      );

      await expect(io).toFailAs(new Error('test error'), ticker);
      expect(fn).not.toHaveBeenCalled();
    });

    it.ticked('should handle thrown error', async ticker => {
      const io = pipe(IO.throwError(new Error('test error')), IO.attempt);
      await expect(io).toCompleteAs(E.left(new Error('test error')), ticker);
    });

    it.ticked('should catch error thrown in redeem recovery', async ticker => {
      const io = pipe(
        IO.throwError(new Error('test error')),
        IO.redeem(
          () => throwError(new Error('thrown error')),
          () => 42,
        ),
        IO.attempt,
      );
      await expect(io).toCompleteAs(E.left(new Error('thrown error')), ticker);
    });

    it.ticked('should recover from errors using redeemWith', async ticker => {
      const io = pipe(
        IO.throwError(new Error()),
        IO.redeemWith(
          () => IO.pure(42),
          () => IO.pure(43),
        ),
      );
      await expect(io).toCompleteAs(42, ticker);
    });

    it.ticked('should bind success values using redeemWith', async ticker => {
      const io = pipe(
        IO.unit,
        IO.redeemWith(
          () => IO.pure(42),
          () => IO.pure(43),
        ),
      );
      await expect(io).toCompleteAs(43, ticker);
    });

    it.ticked('should catch error thrown in map', async ticker => {
      const io = pipe(
        IO.unit,
        IO.map(() => throwError(new Error('test error'))),
        IO.attempt,
      );
      await expect(io).toCompleteAs(E.left(new Error('test error')), ticker);
    });

    it.ticked('should catch error thrown in flatMap', async ticker => {
      const io = pipe(
        IO.unit,
        IO.flatMap(() => throwError(new Error('test error'))),
        IO.attempt,
      );
      await expect(io).toCompleteAs(E.left(new Error('test error')), ticker);
    });

    it.ticked('should catch error thrown in handleErrorWith', async ticker => {
      const io = pipe(
        IO.throwError(new Error('test error')),
        IO.handleErrorWith(() => throwError(new Error('thrown error'))),
        IO.attempt,
      );
      await expect(io).toCompleteAs(E.left(new Error('thrown error')), ticker);
    });

    it.ticked(
      'should throw first bracket release error if use effect succeeded',
      async ticker => {
        const inner = pipe(
          IO.bracket_(
            IO.unit,
            () => IO.unit,
            () => IO.throwError(new Error('first error')),
          ),
        );

        const io = pipe(
          IO.bracket_(
            IO.unit,
            () => inner,
            () => IO.throwError(new Error('second error')),
          ),
          IO.attempt,
        );

        await expect(io).toCompleteAs(E.left(new Error('first error')), ticker);
      },
    );
  });

  describe('side effect suspension', () => {
    it.ticked('should not memoize effects', async ticker => {
      let counter = 42;
      const io = IO.delay(() => {
        counter += 1;
        return counter;
      });
      await expect(io).toCompleteAs(43, ticker);
      await expect(io).toCompleteAs(44, ticker);
    });

    it.ticked('should execute suspended effect on each use', async ticker => {
      let counter = 42;
      const x = IO.delay(() => {
        counter += 1;
        return counter;
      });

      const io = pipe(
        IO.Do,
        IO.bindTo('a', () => x),
        IO.bindTo('b', () => x),
        IO.map(({ a, b }) => [a, b] as [number, number]),
      );

      await expect(io).toCompleteAs([43, 44], ticker);
    });
  });

  describe('fibers', () => {
    it.ticked('should fork and join a fiber', async ticker => {
      const io = pipe(
        IO.pure(42),
        IO.map(x => x + 1),
        IO.fork,
        IO.flatMap(f => f.join),
      );
      await expect(io).toCompleteAs(O.success(43), ticker);
    });

    it.ticked('should fork and join a failed fiber', async ticker => {
      const io = pipe(
        IO.throwError(new Error('test error')),
        IO.fork,
        IO.flatMap(f => f.join),
      );
      await expect(io).toCompleteAs(O.failure(new Error('test error')), ticker);
    });

    it.ticked(
      'should fork and ignore a non-terminating fiber',
      async ticker => {
        const io = pipe(
          IO.never,
          IO.fork,
          IO.map(() => 42),
        );
        await expect(io).toCompleteAs(42, ticker);
      },
    );

    it.ticked(
      'should start a fiber and continue with its results',
      async ticker => {
        const io = pipe(
          IO.pure(42),
          IO.fork,
          IO.flatMap(f => f.join),
          IO.flatMap(
            O.fold(
              () => IO.pure(0),
              () => IO.pure(-1),
              x => IO.pure(x),
            ),
          ),
        );
        await expect(io).toCompleteAs(42, ticker);
      },
    );

    it.ticked(
      'should produce canceled outcome when fiber canceled',
      async ticker => {
        const io = pipe(
          IO.canceled,
          IO.fork,
          IO.flatMap(f => f.join),
        );
        await expect(io).toCompleteAs(O.canceled, ticker);
      },
    );

    it.ticked('should cancel already canceled fiber', async ticker => {
      const ioa = pipe(
        IO.Do,
        IO.bindTo('f', () => IO.fork(IO.canceled)),
        IO.bind(() => IO.delay(() => ticker.tickAll())),
        IO.bind(({ f }) => f.cancel),
        IO.map(() => undefined),
      );

      await expect(ioa).toCompleteAs(undefined, ticker);
    });
  });

  describe('async', () => {
    it.ticked('should resume async continuation', async ticker => {
      const io = IO.async(cb => IO.delay(() => cb(E.right(42))));

      await expect(io).toCompleteAs(42, ticker);
    });

    it.ticked(
      'should resume async continuation and bind its results',
      async ticker => {
        const io = pipe(
          IO.async<number>(cb => IO.delay(() => cb(E.right(42)))),
          IO.map(x => x + 2),
        );

        await expect(io).toCompleteAs(44, ticker);
      },
    );

    it.ticked('should produce a failure when bind fails', async ticker => {
      const io = pipe(
        IO.async<number>(cb => IO.delay(() => cb(E.right(42)))),
        IO.flatMap(() => IO.throwError(new Error('test error'))),
        IO.map(() => undefined),
      );

      await expect(io).toFailAs(new Error('test error'), ticker);
    });

    it.ticked(
      'should resume only once even if cb called multiple times',
      async ticker => {
        let cb: (ea: E.Either<Error, number>) => void;

        const async = IO.async<number>(cb0 =>
          IO.delay(() => {
            cb = cb0;
          }),
        );

        const io = pipe(
          IO.Do,
          IO.bindTo('f', () => IO.fork(async)),
          IO.bind(() => IO.delay(() => ticker.tickAll())),
          IO.bind(() => IO.delay(() => cb(E.right(42)))),
          IO.bind(() => IO.delay(() => ticker.tickAll())),
          IO.bind(() => IO.delay(() => cb(E.right(43)))),
          IO.bind(() => IO.delay(() => ticker.tickAll())),
          IO.bind(() => IO.delay(() => cb(E.left(new Error('test error'))))),
          IO.flatMap(({ f }) => f.join),
        );

        await expect(io).toCompleteAs(O.success(42), ticker);
      },
    );

    it.ticked(
      'should cancel and complete a fiber while finalizer on poll',
      async ticker => {
        const ioa = IO.uncancelable(poll =>
          pipe(
            IO.canceled,
            IO.flatMap(() => poll(IO.unit)),
            IO.finalize(() => IO.unit),
            IO.fork,
            IO.flatMap(f => f.join),
          ),
        );

        await expect(ioa).toCompleteAs(O.canceled, ticker);
      },
    );

    it.ticked('should allow miss-ordering of completions', async ticker => {
      let outerR: number = 0;
      let innerR: number = 0;

      const outer = IO.async<number>(cb1 => {
        const inner = IO.async<number>(cb2 =>
          pipe(
            IO.delay(() => cb1(E.right(1))),
            IO.flatMap(() => IO.readExecutionContext),
            IO.flatMap(ec =>
              IO.delay(() => ec.executeAsync(() => cb2(E.right(2)))),
            ),
          ),
        );

        return IO.flatMap_(inner, i =>
          IO.delay(() => {
            innerR = i;
          }),
        );
      });

      const io = IO.flatMap_(outer, i =>
        IO.delay(() => {
          outerR = i;
        }),
      );

      await expect(io).toCompleteAs(undefined, ticker);
      expect(innerR).toBe(1);
      expect(outerR).toBe(2);
    });
  });

  describe('both', () => {
    it.ticked('should complete when both fibers complete', async ticker => {
      const io = IO.both_(IO.pure(42), IO.pure(43));
      await expect(io).toCompleteAs([42, 43], ticker);
    });

    it.ticked('should fail if lhs fiber fails', async ticker => {
      const io = IO.both_(IO.throwError(new Error('left error')), IO.pure(43));
      await expect(io).toFailAs(new Error('left error'), ticker);
    });

    it.ticked('should fail if rhs fiber fails', async ticker => {
      const io = IO.both_(IO.pure(42), IO.throwError(new Error('right error')));
      await expect(io).toFailAs(new Error('right error'), ticker);
    });

    it.ticked('should cancel if lhs cancels', async ticker => {
      const io = pipe(
        IO.both_(IO.canceled, IO.pure(43)),
        IO.fork,
        IO.flatMap(f => f.join),
      );
      await expect(io).toCompleteAs(O.canceled, ticker);
    });

    it.ticked('should cancel if rhs cancels', async ticker => {
      const io = pipe(
        IO.both_(IO.pure(42), IO.canceled),
        IO.fork,
        IO.flatMap(f => f.join),
      );
      await expect(io).toCompleteAs(O.canceled, ticker);
    });

    it.ticked('should propagate cancelation', async ticker => {
      const io = pipe(
        IO.Do,
        IO.bindTo('f', () => IO.fork(IO.both_(IO.never, IO.never))),
        IO.bind(() => IO.delay(() => ticker.tickAll())),
        IO.bind(({ f }) => f.cancel),
        IO.bind(() => IO.delay(() => ticker.tickAll())),
        IO.flatMap(({ f }) => f.join),
      );

      await expect(io).toCompleteAs(O.canceled, ticker);
    });

    it.ticked('should cancel both fibers', async ticker => {
      const io = pipe(
        IO.Do,
        IO.bindTo('l', () => IO.ref<boolean>(false)),
        IO.bindTo('r', () => IO.ref<boolean>(false)),
        IO.bindTo('fiber', ({ l, r }) =>
          pipe(
            IO.both_(
              pipe(IO.never, IO.onCancel(l.set(true))),
              pipe(IO.never, IO.onCancel(r.set(true))),
            ),
            IO.fork,
          ),
        ),
        IO.bind(() => IO.delay(() => ticker.tickAll())),
        IO.bind(({ fiber }) => fiber.cancel),
        IO.bind(() => IO.delay(() => ticker.tickAll())),
        IO.bindTo('l2', ({ l }) => l.get()),
        IO.bindTo('r2', ({ r }) => r.get()),
        IO.map(({ l2, r2 }) => [l2, r2] as [boolean, boolean]),
      );

      await expect(io).toCompleteAs([true, true], ticker);
    });
  });

  describe('race', () => {
    it.ticked('should complete with faster, lhs', async ticker => {
      const io = IO.race_(
        IO.pure(42),
        pipe(
          IO.sleep(100),
          IO.flatMap(() => IO.pure(43)),
        ),
      );

      await expect(io).toCompleteAs(E.left(42), ticker);
    });

    it.ticked('should complete with faster, rhs', async ticker => {
      const io = IO.race_(
        pipe(
          IO.sleep(100),
          IO.flatMap(() => IO.pure(42)),
        ),
        IO.pure(43),
      );

      await expect(io).toCompleteAs(E.right(43), ticker);
    });

    it.ticked('should fail if lhs fails', async ticker => {
      const io = IO.race_(IO.throwError(new Error('left error')), IO.pure(43));
      await expect(io).toFailAs(new Error('left error'), ticker);
    });

    it.ticked('should fail if rhs fails', async ticker => {
      const io = IO.race_(IO.pure(42), IO.throwError(new Error('right error')));
      await expect(io).toFailAs(new Error('right error'), ticker);
    });

    it.ticked(
      'should fail if lhs fails and rhs never completes',
      async ticker => {
        const io = IO.race_(IO.throwError(new Error('left error')), IO.never);
        await expect(io).toFailAs(new Error('left error'), ticker);
      },
    );

    it.ticked(
      'should fail if rhs fails and lhs never completes',
      async ticker => {
        const io = IO.race_(IO.never, IO.throwError(new Error('right error')));
        await expect(io).toFailAs(new Error('right error'), ticker);
      },
    );

    it.ticked(
      'should complete with lhs when rhs never completes',
      async ticker => {
        const io = IO.race_(IO.pure(42), IO.never);
        await expect(io).toCompleteAs(E.left(42), ticker);
      },
    );

    it.ticked(
      'should complete with rhs when lhs never completes',
      async ticker => {
        const io = IO.race_(IO.never, IO.pure(43));
        await expect(io).toCompleteAs(E.right(43), ticker);
      },
    );

    it.ticked('should be canceled when both sides canceled', async ticker => {
      const io = pipe(
        IO.race_(IO.canceled, IO.canceled),
        IO.fork,
        IO.flatMap(f => f.join),
      );

      await expect(io).toCompleteAs(O.canceled, ticker);
    });

    it.ticked(
      'should succeed if lhs succeeds and rhs cancels',
      async ticker => {
        const io = IO.race_(IO.pure(42), IO.canceled);
        await expect(io).toCompleteAs(E.left(42), ticker);
      },
    );

    it.ticked(
      'should succeed if rhs succeeds and lhs cancels',
      async ticker => {
        const io = IO.race_(IO.canceled, IO.pure(43));
        await expect(io).toCompleteAs(E.right(43), ticker);
      },
    );

    it.ticked('should fail if lhs fails and rhs cancels', async ticker => {
      const io = IO.race_(IO.throwError(new Error('test error')), IO.canceled);
      await expect(io).toFailAs(new Error('test error'), ticker);
    });

    it.ticked('should fail if rhs fails and lhs cancels', async ticker => {
      const io = IO.race_(IO.canceled, IO.throwError(new Error('test error')));
      await expect(io).toFailAs(new Error('test error'), ticker);
    });

    it.ticked('should cancel both fibers when canceled', async ticker => {
      const io = pipe(
        IO.Do,
        IO.bindTo('l', () => IO.ref(false)),
        IO.bindTo('r', () => IO.ref(false)),
        IO.bindTo('fiber', ({ l, r }) =>
          pipe(
            IO.race_(
              pipe(IO.never, IO.onCancel(l.set(true))),
              pipe(IO.never, IO.onCancel(r.set(true))),
            ),
            IO.fork,
          ),
        ),
        IO.bind(() => IO.delay(() => ticker.tickAll())),
        IO.bind(({ fiber }) => fiber.cancel),
        IO.bindTo('l2', ({ l }) => l.get()),
        IO.bindTo('r2', ({ r }) => r.get()),
        IO.map(({ l2, r2 }) => [l2, r2] as [boolean, boolean]),
      );

      await expect(io).toCompleteAs([true, true], ticker);
    });
  });

  describe('cancelation', () => {
    it.ticked('should cancel never after forking', async ticker => {
      const io = pipe(
        IO.fork(IO.never),
        IO.flatMap(f => IO.flatMap_(f.cancel, () => f.join)),
      );

      await expect(io).toCompleteAs(O.canceled, ticker);
    });

    it.ticked('should cancel infinite chain of binds', async ticker => {
      const infinite: IO.IO<void> = IO.flatMap_(IO.unit, () => infinite);

      const io = pipe(
        IO.fork(infinite),
        IO.flatMap(f =>
          pipe(
            f.cancel,
            IO.flatMap(() => f.join),
          ),
        ),
      );

      await expect(io).toCompleteAs(O.canceled, ticker);
    });

    it.ticked('should trigger cancelation cleanup of async', async ticker => {
      const cleanup = jest.fn();

      const target = IO.async(() => IO.pure(IO.delay(cleanup)));

      const io = pipe(
        IO.Do,
        IO.bindTo('f', () => IO.fork(target)),
        IO.bind(() => IO.delay(() => ticker.tickAll())),
        IO.flatMap(({ f }) => f.cancel),
      );

      await expect(io).toCompleteAs(undefined, ticker);
      expect(cleanup).toHaveBeenCalled();
    });

    // it.ticked(
    //   'should not trigger cancelation cleanup of async when wrapped in uncancelable',
    //   async ticker => {
    //     let executed = false;

    //     const target = IO.uncancelable(() =>
    //       IO.async(() =>
    //         IO.pure(
    //           IO.delay(() => {
    //             executed = true;
    //           }),
    //         ),
    //       ),
    //     );

    //     const io = pipe(
    //       IO.Do,
    //       IO.bindTo('f', () => IO.fork(target)),
    //       IO.bind(() => IO.delay(() => ticker.tickAll())),
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
        const io = pipe(
          IO.uncancelable(() => IO.canceled),
          IO.flatMap(() => IO.delay(() => cont)),
        );

        await expect(io).toCancel(ticker);
        expect(cont).not.toHaveBeenCalled();
      },
    );

    it.ticked('should execute onCancel block', async ticker => {
      const cleanup = jest.fn();

      const io = IO.uncancelable(poll =>
        pipe(
          IO.canceled,
          IO.flatMap(() => IO.onCancel_(poll(IO.unit), IO.delay(cleanup))),
        ),
      );

      await expect(io).toCancel(ticker);
      expect(cleanup).toHaveBeenCalled();
    });

    it.ticked(
      'should break out of uncancelable when canceled before poll',
      async ticker => {
        const cont = jest.fn();

        const io = IO.uncancelable(poll =>
          pipe(
            IO.canceled,
            IO.flatMap(() => poll(IO.unit)),
            IO.flatMap(() => IO.delay(cont)),
          ),
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
          pipe(
            IO.canceled,
            IO.flatMap(() => IO.onCancel_(IO.unit, IO.delay(cleanup))),
          ),
        );

        await expect(io).toCancel(ticker);
        expect(cleanup).not.toHaveBeenCalled();
      },
    );

    it.ticked('should unmask only the current fiber', async ticker => {
      const cont = jest.fn();

      const io = IO.uncancelable(outerPoll => {
        const inner = IO.uncancelable(() =>
          outerPoll(
            pipe(
              IO.canceled,
              IO.flatMap(() => IO.delay(cont)),
            ),
          ),
        );

        return pipe(
          IO.fork(inner),
          IO.flatMap(f => f.join),
          IO.map(() => undefined),
        );
      });

      await expect(io).toCompleteAs(undefined, ticker);
      expect(cont).toHaveBeenCalled();
    });

    it.ticked(
      'should run three finalizers while async suspended',
      async ticker => {
        const results: number[] = [];
        const pushResult: (x: number) => IO.IO<void> = x =>
          IO.delay(() => {
            results.push(x);
          });

        const body = IO.async<never>(() => IO.pure(pushResult(1)));

        const io = pipe(
          IO.Do,
          IO.bindTo('fiber', () =>
            pipe(
              body,
              IO.onCancel(pushResult(2)),
              IO.onCancel(pushResult(3)),
              IO.fork,
            ),
          ),
          IO.bind(() => IO.delay(() => ticker.tickAll())),
          IO.bind(({ fiber }) => fiber.cancel),
          IO.flatMap(({ fiber }) => fiber.join),
        );

        await expect(io).toCompleteAs(O.canceled, ticker);
        expect(results).toEqual([1, 2, 3]);
      },
    );

    it.ticked(
      'should apply nested polls when called in correct order',
      async ticker => {
        const cont = jest.fn();

        const io = IO.uncancelable(outerPoll =>
          IO.uncancelable(innerPoll =>
            pipe(
              outerPoll(innerPoll(IO.canceled)),
              IO.flatMap(() => IO.delay(cont)),
            ),
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
            pipe(
              innerPoll(outerPoll(IO.canceled)),
              IO.flatMap(() => IO.delay(cont)),
            ),
          ),
        );

        await expect(io).toCancel(ticker);
        expect(cont).not.toHaveBeenCalled();
      },
    );

    it.ticked('should ignore repeated poll calls', async ticker => {
      const cont = jest.fn();

      const io = IO.uncancelable(poll =>
        IO.uncancelable(() =>
          pipe(
            poll(poll(IO.canceled)),
            IO.flatMap(() => IO.delay(cont)),
          ),
        ),
      );

      await expect(io).toCancel(ticker);
      expect(cont).toHaveBeenCalled();
    });
  });

  describe('finalizers', () => {
    it.ticked('finalizer should not run on success', async ticker => {
      const fin = jest.fn();

      const io = pipe(IO.pure(42), IO.onCancel(IO.delay(fin)));

      await expect(io).toCompleteAs(42, ticker);
      expect(fin).not.toHaveBeenCalled();
    });

    it.ticked('should run finalizer on success', async ticker => {
      const fin = jest.fn();

      const io = pipe(
        IO.pure(42),
        IO.finalize(() => IO.delay(fin)),
      );

      await expect(io).toCompleteAs(42, ticker);
      expect(fin).toHaveBeenCalled();
    });

    it.ticked('should run finalizer on failure', async ticker => {
      const fin = jest.fn();

      const io = pipe(
        IO.throwError(new Error('test error')),
        IO.finalize(() => IO.delay(fin)),
      );

      await expect(io).toFailAs(new Error('test error'), ticker);
      expect(fin).toHaveBeenCalled();
    });

    it.ticked('should run finalizer on cancelation', async ticker => {
      const fin = jest.fn();

      const io = pipe(
        IO.canceled,
        IO.finalize(() => IO.delay(fin)),
      );

      await expect(io).toCancel(ticker);
      expect(fin).toHaveBeenCalled();
    });

    it.ticked('should run multiple finalizers', async ticker => {
      const inner = jest.fn();
      const outer = jest.fn();

      const io = pipe(
        IO.pure(42),
        IO.finalize(() => IO.delay(inner)),
        IO.finalize(() => IO.delay(outer)),
      );

      await expect(io).toCompleteAs(42, ticker);
      expect(inner).toHaveBeenCalled();
      expect(outer).toHaveBeenCalled();
    });

    it.ticked('should run multiple finalizers exactly once', async ticker => {
      const inner = jest.fn();
      const outer = jest.fn();

      const io = pipe(
        IO.pure(42),
        IO.finalize(() => IO.delay(inner)),
        IO.finalize(() => IO.delay(outer)),
      );

      await expect(io).toCompleteAs(42, ticker);
      expect(inner).toHaveBeenCalledTimes(1);
      expect(outer).toHaveBeenCalledTimes(1);
    });

    it.ticked('should run finalizer on async success', async ticker => {
      const fin = jest.fn();

      const io = pipe(
        IO.pure(42),
        IO.delayBy(1_000 * 60 * 60 * 24), // 1 day
        IO.finalize(
          O.fold(
            () => IO.unit,
            () => IO.unit,
            () => IO.delay(fin),
          ),
        ),
      );

      await expect(io).toCompleteAs(42, ticker);
      expect(fin).toHaveBeenCalled();
    });

    it.ticked('should retain errors through finalizers', async ticker => {
      const io = pipe(
        IO.throwError(new Error('test error')),
        IO.finalize(() => IO.unit),
        IO.finalize(() => IO.unit),
      );

      await expect(io).toFailAs(new Error('test error'), ticker);
    });

    it.ticked('should run an async finalizer of async IO', async ticker => {
      const fin = jest.fn();

      const body = IO.async(() =>
        IO.delay(() =>
          pipe(
            IO.async(cb =>
              pipe(
                IO.readExecutionContext,
                IO.flatMap(ec =>
                  // enforce async completion
                  IO.delay(() => ec.executeAsync(() => cb(E.rightUnit))),
                ),
              ),
            ),
            IO.tap(fin),
          ),
        ),
      );

      const io = pipe(
        IO.Do,
        IO.bindTo('fiber', () => IO.fork(body)),
        IO.bind(() => IO.delay(() => ticker.tickAll())), // start async task
        IO.flatMap(({ fiber }) => fiber.cancel), // cancel after the async task is running
      );

      await expect(io).toCompleteAs(undefined, ticker);
      expect(fin).toHaveBeenCalled();
    });

    it.ticked(
      'should not run finalizer of canceled uncancelable succeeds',
      async ticker => {
        const fin = jest.fn();

        const io = pipe(
          IO.uncancelable(() =>
            pipe(
              IO.canceled,
              IO.map(() => 42),
            ),
          ),
          IO.onCancel(IO.delay(fin)),
        );

        await expect(io).toCancel(ticker);
        expect(fin).not.toHaveBeenCalled();
      },
    );

    it.ticked(
      'should not run finalizer of canceled uncancelable fails',
      async ticker => {
        const fin = jest.fn();

        const io = pipe(
          IO.uncancelable(() =>
            pipe(
              IO.canceled,
              IO.flatMap(() => IO.throwError(new Error('test error'))),
            ),
          ),
          IO.onCancel(IO.delay(fin)),
        );

        await expect(io).toCancel(ticker);
        expect(fin).not.toHaveBeenCalled();
      },
    );

    it.ticked('should run finalizer on failed bracket use', async ticker => {
      const io = pipe(
        IO.Do,
        IO.bindTo('ref', () => IO.ref(false)),
        IO.bind(({ ref }) =>
          pipe(
            IO.bracketFull_(
              () => IO.unit,
              () => throwError(new Error('Uncaught error')),
              () => ref.set(true),
            ),
            IO.attempt,
          ),
        ),
        IO.flatMap(({ ref }) => ref.get()),
      );

      await expect(io).toCompleteAs(true, ticker);
    });
  });

  describe('stack-safety', () => {
    it.ticked('should evaluate 10,000 consecutive binds', async ticker => {
      const loop: (i: number) => IO.IO<void> = i =>
        i < 10_000
          ? pipe(
              IO.unit,
              IO.flatMap(() => loop(i + 1)),
              IO.map(id),
            )
          : IO.unit;

      await expect(loop(0)).toCompleteAs(undefined, ticker);
    });

    it.ticked('should evaluate 10,000 error handler binds', async ticker => {
      const loop: (i: number) => IO.IO<void> = i =>
        i < 10_000
          ? pipe(
              IO.unit,
              IO.flatMap(() => loop(i + 1)),
              IO.handleErrorWith(IO.throwError),
            )
          : IO.throwError(new Error('test error'));

      const io = IO.handleErrorWith_(loop(0), () => IO.unit);
      await expect(io).toCompleteAs(undefined, ticker);
    });

    it.ticked('should evaluate 10,000 consecutive attempts', async ticker => {
      let acc: IO.IO<unknown> = IO.unit;

      for (let i = 0; i < 10_000; i++) acc = IO.attempt(acc);

      const io = IO.flatMap_(acc, () => IO.unit);
      await expect(io).toCompleteAs(undefined, ticker);
    });
  });

  describe('parTraverseN', () => {
    it.ticked('should propagate errors', async ticker => {
      const io = pipe(
        [1, 2, 3],
        IO.parTraverseN(
          x => (x === 2 ? throwError(new Error('test error')) : IO.unit),
          2,
        ),
      );

      await expect(io).toFailAs(new Error('test error'), ticker);
    });

    // it.ticked('should be cancelable', async ticker => {
    //   const traverse = pipe(
    //     [1, 2, 3],
    //     IO.parTraverseN(() => IO.never, 2),
    //   );

    //   const io = pipe(
    //     IO.Do,
    //     IO.bindTo('fiber', () => IO.fork(traverse)),
    //     IO.bind(() => IO.delay(() => ticker.tickAll())),
    //     IO.flatMap(({ fiber }) => fiber.cancel),
    //   );

    //   await expect(io).toCompleteAs(undefined, ticker);
    // });

    // it.ticked('should cancel all running tasks', async ticker => {
    //   const fins = [jest.fn(), jest.fn(), jest.fn()];

    //   const traverse = pipe(
    //     fins,
    //     IO.parTraverseN(fin => IO.onCancel_(IO.never, IO.delay(fin)), 2),
    //   );

    //   const io = pipe(
    //     IO.Do,
    //     IO.bindTo('fiber', () => IO.fork(traverse)),
    //     IO.bind(() => IO.delay(() => ticker.tickAll())),
    //     IO.flatMap(({ fiber }) => fiber.cancel),
    //   );

    //   await expect(io).toCompleteAs(undefined, ticker);
    //   expect(fins[0]).toHaveBeenCalled();
    //   expect(fins[1]).toHaveBeenCalled();
    //   expect(fins[2]).not.toHaveBeenCalled();
    // });
  });
});
