// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Ticker } from '../ticker';
import { ticked } from '../ticked';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Describe {
      ticked(name: string, body: (ticker: Ticker) => void): void;
    }
  }
}

describe.ticked = (name: string, body) => {
  describe(
    name,
    ticked(ticker => {
      beforeEach(() => ticker.ctx.reset());

      body(ticker);
    }),
  );
};
