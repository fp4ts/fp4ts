import { IsEq } from './rules';
import { Eq } from '@fp4ts/cats-core';

export function exec<R>(predicate: () => IsEq<R>): (E: Eq<R>) => () => void;
export function exec(predicate: () => boolean): () => void;
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function exec(predicate: any): any {
  const run = async (E?: any) => {
    if (!E) {
      const result = await predicate();
      return expect(result).toBe(true);
    }
    if (typeof E === 'function') return E(predicate());
    const { lhs, rhs } = predicate();
    expect(E.equals(lhs, rhs)).toBe(true);
  };
  return (...args: any[]) => {
    const [E] = args;
    return E != null ? () => run(E) : run();
  };
}
