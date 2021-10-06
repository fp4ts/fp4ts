import { TestExecutionContext } from './test-execution-context';
import { Ticker } from './ticker';

export function ticked(
  run: (ticker: Ticker) => any | Promise<any>,
): () => Promise<any> {
  return () => {
    const ticker = new TestExecutionContext();
    return run(ticker);
  };
}
