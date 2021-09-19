import { ticked, Ticker } from '@cats4ts/effect-test-kit';
import { IOOutcome } from '../io-outcome';

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

    interface It {
      ticked(
        message: string,
        body: (ticker: Ticker) => unknown | Promise<unknown>,
      ): void;
    }
  }
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
