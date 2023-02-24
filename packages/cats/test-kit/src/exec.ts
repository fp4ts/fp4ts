// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eq } from '@fp4ts/cats-kernel';
import { IsEq } from './rules';

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
