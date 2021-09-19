import { Ticker, TestExecutionContext } from '@cats4ts/effect-test-kit';

import { IO } from '../io';
import { IOOutcome } from '../io-outcome';
import * as IOR from '../unsafe/io-runtime';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Matchers<R> {
      tickTo(oc: IOOutcome<unknown>, ticker: Ticker): Promise<unknown>;
      toCompleteWith(result: unknown, ticker: Ticker): Promise<unknown>;
      toFailWith(error: Error, ticker: Ticker): Promise<unknown>;
      toCancel(ticker: Ticker): Promise<unknown>;
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
  const receivedPromise: Promise<IOOutcome<unknown>> = new Promise(resolve =>
    receivedIO.unsafeRunAsyncOutcome(
      oc => resolve(oc),
      new IOR.IORuntime(ec, () => {}, { autoSuspendThreshold: Infinity }),
    ),
  );

  ec.tickAll();

  const received = await receivedPromise;
  const result = this.equals(received, expected);

  const message = expected.fold(
    () =>
      received.fold(
        () => 'be canceled, but was',
        e => `be canceled, but failed with ${this.utils.printReceived(`${e}`)}`,
        r =>
          `be canceled, but completed with ${this.utils.printReceived(`${r}`)}`,
      ),
    e =>
      received.fold(
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
      received.fold(
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
});
