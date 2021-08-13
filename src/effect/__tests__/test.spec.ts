import * as E from '../../fp/either';
import * as O from '../outcome';
import * as IO from '../io';
import * as IOR from '../io-runtime';
import { TestExecutionContext } from '../tests/test-execution-context';
import { Ticker } from '../tests/ticker';
import { pipe } from '../../fp/core';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Matchers<R> {
      tickTo(oc: O.Outcome<unknown>, ticket: Ticker): Promise<any>;
      toCompleteAs(result: unknown, ticket: Ticker): Promise<any>;
      toFailAs(error: Error, ticket: Ticker): Promise<any>;
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
  const ticker = new TestExecutionContext();
  return () => runTest(ticker);
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

  async toFailAs(
    receivedIO: IO.IO<unknown>,
    expected: Error,
    ec: TestExecutionContext,
  ) {
    return tickTo.apply(this, [receivedIO, O.failure(expected), ec]);
  },
});

const throwError = (e: Error) => {
  throw e;
};

describe('io monad', () => {
  describe('free monad', () => {
    it.ticked('should produce a pure value when run', async ticker => {
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
      const fa = IO.async(cb => IO.delay(() => cb(E.right(42))));

      await expect(IO.flatMap_(fa, i => IO.pure(i))).toCompleteAs(42, ticker);
      await expect(fa).toCompleteAs(42, ticker);
    });
  });

  describe('error handling', () => {
    it.ticked('should capture suspended error', async ticker => {
      await expect(IO.delay(() => throwError(Error('test error')))).toFailAs(
        new Error('test error'),
        ticker,
      );
    });

    it.ticked('should resume async IO with failure', async ticker => {
      await expect(
        IO.async(cb => IO.delay(() => cb(E.left(new Error('test error'))))),
      ).toFailAs(new Error('test error'), ticker);
    });

    it.ticked('should propagate out thrown error', async ticker => {
      await expect(
        pipe(
          IO.throwError(new Error('test error')),
          IO.flatMap(() => IO.unit),
        ),
      ).toFailAs(new Error('test error'), ticker);
    });

    it.ticked('should short circuit the execution on error', async ticker => {
      const fn = jest.fn();

      await expect(
        pipe(
          IO.throwError(new Error('test error')),
          IO.flatMap(() => IO.delay(fn)),
        ),
      ).toFailAs(new Error('test error'), ticker);
      expect(fn).not.toHaveBeenCalled();
    });

    it.ticked('should handle thrown error', async ticker => {
      await expect(
        pipe(IO.throwError(new Error('test error')), IO.attempt),
      ).toCompleteAs(E.left(new Error('test error')), ticker);
    });

    it.ticked('should catch exceptions in redeem recovery', async ticker => {
      await expect(
        pipe(
          IO.throwError(new Error('test error')),
          IO.redeem(
            () => throwError(new Error('thrown error')),
            () => 42,
          ),
          IO.attempt,
        ),
      ).toCompleteAs(E.left(new Error('thrown error')), ticker);
    });

    it.ticked('should recover from errors using redeemWith', async ticker => {
      await expect(
        pipe(
          IO.throwError(new Error()),
          IO.redeemWith(
            () => IO.pure(42),
            () => IO.pure(43),
          ),
        ),
      ).toCompleteAs(42, ticker);
    });

    it.ticked('should bind success values using redeemWith', async ticker => {
      await expect(
        pipe(
          IO.unit,
          IO.redeemWith(
            () => IO.pure(42),
            () => IO.pure(43),
          ),
        ),
      ).toCompleteAs(43, ticker);
    });

    it.ticked('should catch exceptions thrown in map', async ticker => {
      await expect(
        pipe(
          IO.unit,
          IO.map(() => throwError(new Error('test error'))),
          IO.attempt,
        ),
      ).toCompleteAs(E.left(new Error('test error')), ticker);
    });

    it.ticked('should catch exceptions thrown in flatMap', async ticker => {
      await expect(
        pipe(
          IO.unit,
          IO.flatMap(() => throwError(new Error('test error'))),
          IO.attempt,
        ),
      ).toCompleteAs(E.left(new Error('test error')), ticker);
    });

    it.ticked(
      'should catch exceptions thrown in handleErrorWith',
      async ticker => {
        await expect(
          pipe(
            IO.throwError(new Error('test error')),
            IO.handleErrorWith(() => throwError(new Error('thrown error'))),
            IO.attempt,
          ),
        ).toCompleteAs(E.left(new Error('thrown error')), ticker);
      },
    );

    it.ticked(
      'should raise first bracket release error if use effect succeeded',
      async ticker => {
        const inner = pipe(
          IO.bracket_(
            IO.unit,
            () => IO.unit,
            () => IO.throwError(new Error('first error')),
          ),
        );

        await expect(
          pipe(
            IO.bracket_(
              IO.unit,
              () => inner,
              () => IO.throwError(new Error('second error')),
            ),
            IO.attempt,
          ),
        ).toCompleteAs(E.left(new Error('first error')), ticker);
      },
    );
  });

  describe('side effect suspension', () => {
    it.ticked('should not memoize effects', async ticker => {
      let counter = 42;
      const ioa = IO.delay(() => {
        counter += 1;
        return counter;
      });
      await expect(ioa).toCompleteAs(43, ticker);
      await expect(ioa).toCompleteAs(44, ticker);
    });
  });

  describe('fibers', () => {
    it.ticked('should fork and join a fiber', async ticker => {
      await expect(
        pipe(
          IO.pure(42),
          IO.map(x => x + 1),
          IO.fork,
          IO.flatMap(f => f.join),
        ),
      ).toCompleteAs(O.success(43), ticker);
    });

    it.ticked('should fork and join a failed fiber', async ticker => {
      await expect(
        pipe(
          IO.throwError(new Error('test error')),
          IO.fork,
          IO.flatMap(f => f.join),
        ),
      ).toCompleteAs(O.failure(new Error('test error')), ticker);
    });

    it.ticked(
      'should fork and ignore a non-terminating fiber',
      async ticker => {
        await expect(
          pipe(
            IO.never,
            IO.fork,
            IO.map(() => 42),
          ),
        ).toCompleteAs(42, ticker);
      },
    );

    it.ticked(
      'should start a fiber and continue with its results',
      async ticker => {
        await expect(
          pipe(
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
          ),
        ).toCompleteAs(42, ticker);
      },
    );

    it.ticked(
      'should produce canceled outcome when fiber canceled at start',
      async ticker => {
        await expect(
          pipe(
            IO.canceled,
            IO.fork,
            IO.flatMap(f => f.join),
          ),
        ).toCompleteAs(O.canceled, ticker);
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
      'should resume async continuation and use it in further computations',
      async ticker => {
        const io = pipe(
          IO.async<number>(cb => IO.delay(() => cb(E.right(42)))),
          IO.map(x => x + 2),
        );

        await expect(io).toCompleteAs(44, ticker);
      },
    );

    it.ticked(
      'should produce a failure when further computation fails',
      async ticker => {
        const io = pipe(
          IO.async<number>(cb => IO.delay(() => cb(E.right(42)))),
          IO.flatMap(() => IO.throwError(new Error('test error'))),
          IO.map(() => undefined),
        );

        await expect(io).toFailAs(new Error('test error'), ticker);
      },
    );

    it.ticked(
      'should resume only once even if resumed multiple times',
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
  });
});
