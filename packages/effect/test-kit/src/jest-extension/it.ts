// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { IO, IOOutcome } from '@fp4ts/effect-core';
import { ticked } from '../ticked';
import { Ticker } from '../ticker';

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
        timeout?: number,
      ): void;
      real(message: string, body: () => IO<unknown>, timeout?: number): void;
      M(message: string, body: () => IO<unknown>, timeout?: number): void;
    }
  }
}

it.ticked = (
  message: string,
  testBody: (ticker: Ticker) => any | Promise<any>,
  timeout?: number,
) => {
  it(
    message,
    ticked(ticker => testBody(ticker)),
    timeout,
  );
};

test.ticked = (
  message: string,
  testBody: (ticker: Ticker) => any | Promise<any>,
  timeout?: number,
) => {
  test(
    message,
    ticked(ticker => testBody(ticker)),
    timeout,
  );
};

it.real = (message: string, testBody: () => IO<unknown>, timeout?: number) => {
  it(message, () => testBody().unsafeRunToPromise(), timeout);
};
test.real = (
  message: string,
  testBody: () => IO<unknown>,
  timeout?: number,
) => {
  it(message, () => testBody().unsafeRunToPromise(), timeout);
};
it.M = (message: string, testBody: () => IO<unknown>, timeout?: number) => {
  it(message, () => testBody().unsafeRunToPromise(), timeout);
};
test.M = (message: string, testBody: () => IO<unknown>, timeout?: number) => {
  it(message, () => testBody().unsafeRunToPromise(), timeout);
};
