import * as E from '../../fp/either';
import * as O from '../outcome';
import * as IO from '../io';
import * as IOR from '../io-runtime';
import { TestExecutionContext } from '../tests/test-execution-context';
import { pipe } from '../../fp/core';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      tickTo(oc: O.Outcome<unknown>): Promise<any>;
      toCompleteAs(result: unknown): Promise<any>;
      toFailAs(error: Error): Promise<any>;
    }
  }
}

type T = typeof expect['extend'] extends (_: {
  [k: string]: (this: infer MatcherContext, ...arg: any) => any;
}) => any
  ? MatcherContext
  : never;

async function tickTo(
  this: T,
  receivedIO: IO.IO<unknown>,
  expected: O.Outcome<unknown>,
) {
  const ec = new TestExecutionContext();
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

  toCompleteAs(receivedIO: IO.IO<unknown>, expected: unknown) {
    return tickTo.apply(this, [receivedIO, O.success(expected)]);
  },

  async toFailAs(receivedIO: IO.IO<unknown>, expected: Error) {
    return tickTo.apply(this, [receivedIO, O.failure(expected)]);
  },
});

describe('io monad', () => {
  describe('free monad', () => {
    it('should produce a pure value when run', async () => {
      await expect(IO.pure(42)).toCompleteAs(42);
    });

    it('should sequence two effects', async () => {
      let i: number = 0;

      const fa = pipe(
        IO.pure(42),
        IO.flatMap(i2 =>
          IO.delay(() => {
            i = i2;
          }),
        ),
      );

      await expect(fa).toCompleteAs(undefined);
      expect(i).toBe(42);
    });

    it('should preserve monad identity on async', async () => {
      const fa = IO.async(cb => IO.delay(() => cb(E.right(42))));

      await expect(IO.flatMap_(fa, i => IO.pure(i))).toCompleteAs(42);
      await expect(fa).toCompleteAs(42);
    });
  });

  describe('error handling', () => {
    it('should capture suspended error', async () => {
      class TestError extends Error {}
      await expect(
        IO.delay(() => {
          throw new TestError();
        }),
      ).toFailAs(new TestError());
    });

    it('should resume async IO with failure', async () => {
      class TestError extends Error {}
      await expect(
        IO.async(cb => IO.delay(() => cb(E.left(new TestError())))),
      ).toFailAs(new TestError());
    });

    it('should propagate out thrown error', async () => {
      class TestError extends Error {}
      await expect(
        pipe(
          IO.throwError(new TestError()),
          IO.flatMap(() => IO.unit),
        ),
      ).toFailAs(new TestError());
    });

    it('should short circuit the execution on error', async () => {
      const fn = jest.fn();
      class TestError extends Error {}

      await expect(
        pipe(
          IO.throwError(new TestError()),
          IO.flatMap(() => IO.delay(fn)),
        ),
      ).toFailAs(new TestError());
      expect(fn).not.toHaveBeenCalled();
    });

    it('should handle thrown error', async () => {
      class TestError extends Error {}
      await expect(
        pipe(IO.throwError(new TestError()), IO.attempt),
      ).toCompleteAs(E.left(new TestError()));
    });
  });
});
