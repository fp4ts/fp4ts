// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Eq, Ord } from '@fp4ts/cats';

export interface Unique<F> {
  unique: Kind<F, [UniqueToken]>;
}
export type UniqueRequirements<F> = Pick<Unique<F>, 'unique'>;
export const Unique = Object.freeze({
  of: <F>(F: UniqueRequirements<F>): Unique<F> => ({
    ...F,
  }),
});

export class UniqueToken {
  private static addresses: bigint = 0n;
  private readonly address: bigint = UniqueToken.addresses++;

  public equals(that: UniqueToken): boolean {
    return this === that;
  }
  public notEquals(that: UniqueToken): boolean {
    return this !== that;
  }

  public static Eq: Eq<UniqueToken> = Eq.of({ equals: (x, y) => x.equals(y) });
  public static Ord: Ord<UniqueToken> = Ord.by(Ord.primitive, u => u.address);
}
