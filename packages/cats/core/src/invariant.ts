// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Base, instance, Kind } from '@fp4ts/core';

/**
 * @category Type Class
 */
export interface Invariant<F> extends Base<F> {
  readonly imap: <A, B>(
    f: (a: A) => B,
    g: (b: B) => A,
  ) => (fa: Kind<F, [A]>) => Kind<F, [B]>;

  readonly imap_: <A, B>(
    fa: Kind<F, [A]>,
    f: (a: A) => B,
    g: (b: B) => A,
  ) => Kind<F, [B]>;
}

export type InvariantRequirements<F> = Pick<Invariant<F>, 'imap_'> &
  Partial<Invariant<F>>;

export const Invariant = Object.freeze({
  of: <F>(F: InvariantRequirements<F>): Invariant<F> =>
    instance<Invariant<F>>({
      imap: (f, g) => fa => F.imap_(fa, f, g),
      ...F,
    }),
});
