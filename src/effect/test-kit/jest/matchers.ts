import * as O from '../../outcome';
import * as IO from '../../io';
import * as IOR from '../../io-runtime';
import { Ticker } from '../ticker';
import { TestExecutionContext } from '../test-execution-context';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Matchers<R> {
      tickTo(oc: O.Outcome<unknown>, ticker: Ticker): Promise<unknown>;
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

  toCompleteWith(
    receivedIO: IO.IO<unknown>,
    expected: unknown,
    ec: TestExecutionContext,
  ) {
    return tickTo.apply(this, [receivedIO, O.success(expected), ec]);
  },

  toFailWith(
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
