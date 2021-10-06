import { IO, IOOutcome, IORuntime } from '@cats4ts/effect-core';

import { Ticker } from '../ticker';
import { TestExecutionContext } from '../test-execution-context';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Matchers<R> {
      tickTo(oc: IOOutcome<unknown>, ticker: Ticker): unknown;
      toCompleteWith(result: unknown, ticker: Ticker): unknown;
      toFailWith(error: Error, ticker: Ticker): unknown;
      toCancel(ticker: Ticker): unknown;
      toNeverTerminate(ticket: Ticker): unknown;
    }
  }
}

type JestExtends<Context> = (_: {
  [k: string]: (this: Context, ...arg: any) => any;
}) => any;
type MatcherContext = typeof expect['extend'] extends JestExtends<infer Context>
  ? Context
  : never;

async function tickTo(
  this: MatcherContext,
  receivedIO: IO<unknown>,
  expected: IOOutcome<unknown>,
  ec: TestExecutionContext,
) {
  let received: IOOutcome<unknown> | undefined;

  receivedIO.unsafeRunAsyncOutcome(
    oc => (received = oc),
    new IORuntime(ec, () => {}, { autoSuspendThreshold: Infinity }),
  );

  ec.tickAll();

  const result = this.equals(received, expected);

  const message = expected.fold(
    () =>
      received?.fold(
        () => 'be canceled, but was',
        e => `be canceled, but failed with ${this.utils.printReceived(`${e}`)}`,
        r =>
          `be canceled, but completed with ${this.utils.printReceived(`${r}`)}`,
      ) ?? 'be canceled, but it never terminated',
    e =>
      received?.fold(
        () => `fail with ${this.utils.printExpected(`${e}`)}, but was canceled`,
        e2 =>
          `fail with ${this.utils.printExpected(
            `${e}`,
          )}, but failed with ${this.utils.printReceived(`${e2}`)}`,
        r2 =>
          `fail with ${this.utils.printExpected(
            `${e}`,
          )}, but completed with ${this.utils.printReceived(`${r2}`)}`,
      ) ??
      `fail with ${this.utils.printExpected(`${e}`)}, but it never terminated`,
    r =>
      received?.fold(
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
      ) ??
      `complete with ${this.utils.printExpected(
        `${r}`,
      )}, but it never terminated`,
  );

  return result
    ? { pass: true, message: () => `Expected IO not to ${message}` }
    : { pass: false, message: () => `Expected IO to ${message}` };
}

expect.extend({
  tickTo,

  toCompleteWith(
    receivedIO: IO<unknown>,
    expected: unknown,
    ec: TestExecutionContext,
  ) {
    return tickTo.apply(this, [
      receivedIO,
      IOOutcome.success(IO.pure(expected)),
      ec,
    ]);
  },

  toFailWith(
    receivedIO: IO<unknown>,
    expected: Error,
    ec: TestExecutionContext,
  ) {
    return tickTo.apply(this, [receivedIO, IOOutcome.failure(expected), ec]);
  },

  toCancel(receivedIO: IO<unknown>, ec: TestExecutionContext) {
    return tickTo.apply(this, [receivedIO, IOOutcome.canceled(), ec]);
  },

  toNeverTerminate(receivedIO: IO<unknown>, ec: TestExecutionContext) {
    let outcome: IOOutcome<unknown> | undefined;

    receivedIO.unsafeRunAsyncOutcome(oc => {
      outcome = oc;
    }, new IORuntime(ec, () => {}, { autoSuspendThreshold: Infinity }));

    ec.tickAll();

    if (outcome) {
      return {
        pass: false,
        message: () =>
          `Expected IO not to complete, but it completed with ${outcome}`,
      };
    } else {
      return {
        pass: true,
        message: () => `Expected IO to complete, but it didn't`,
      };
    }
  },
});
