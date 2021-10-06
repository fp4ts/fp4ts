import { Ticker } from './ticker';

export function ticked(
  run: (ticker: Ticker) => any | Promise<any>,
): () => Promise<any> {
  return () => run(new Ticker());
}
