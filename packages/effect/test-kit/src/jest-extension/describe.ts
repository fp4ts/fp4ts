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
