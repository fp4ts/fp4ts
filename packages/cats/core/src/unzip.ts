// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id, Kind } from '@fp4ts/core';
import { Zip, ZipRequirements } from './zip';
import { ArrayF, arrayUnzip } from './instances/array';

/**
 * @category Type Class
 */
export interface Unzip<F> extends Zip<F> {
  /**
   * Transforms a structure using the function `f` into a pair of structures,
   * corresponding to the first and second components returned from `f`.
   */
  unzipWith<A, B, C>(
    f: (a: A) => readonly [B, C],
  ): (fa: Kind<F, [A]>) => [Kind<F, [B]>, Kind<F, [C]>];
  /**
   * Transforms a structure using the function `f` into a pair of structures,
   * corresponding to the first and second components returned from `f`.
   */
  unzipWith_<A, B, C>(
    fa: Kind<F, [A]>,
    f: (a: A) => readonly [B, C],
  ): [Kind<F, [B]>, Kind<F, [C]>];

  /**
   * Given a structure of pairs, create a pair of structures where with corresponding
   * elements.
   */
  unzip<A, B>(fab: Kind<F, [readonly [A, B]]>): [Kind<F, [A]>, Kind<F, [B]>];
}

export type UnzipRequirements<F> = Pick<Unzip<F>, 'unzipWith_'> &
  ZipRequirements<F> &
  Partial<Unzip<F>>;
export const Unzip = Object.freeze({
  of: <F>(F: UnzipRequirements<F>): Unzip<F> => {
    const self: Unzip<F> = {
      unzipWith: f => fa => self.unzipWith_(fa, f),
      unzip: fab => self.unzipWith_(fab, id),
      ...Zip.of(F),
      ...F,
    };
    return self;
  },

  get Array(): Unzip<ArrayF> {
    return arrayUnzip();
  },
});
