// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Functor, FunctorRequirements } from './functor';
import { ArrayF } from './instances/array';
import { Unzip } from './unzip';

/**
 * @category Type Class
 */
export interface Zip<F> extends Functor<F> {
  /**
   * Combines given structures by taking an intersection of their shapes and
   * applying function `f` to combine the corresponding element pairs.
   *
   * @note A version of `zip` with a user-supplied zipping function.
   */
  zipWith<A, B, C>(
    fb: Kind<F, [B]>,
    f: (a: A, b: B) => C,
  ): (fa: Kind<F, [A]>) => Kind<F, [C]>;
  /**
   * Combines given structures by taking an intersection of their shapes and
   * applying function `f` to combine the corresponding element pairs.
   *
   * @note A version of `zip` with a user-supplied zipping function.
   */
  zipWith_<A, B, C>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
    f: (a: A, b: B) => C,
  ): Kind<F, [C]>;

  /**
   * Returns a structure of corresponding element pairs from the intersection
   * of the provided structures' shapes.
   */
  zip<B>(fb: Kind<F, [B]>): <A>(fa: Kind<F, [A]>) => Kind<F, [[A, B]]>;
  /**
   * Returns a structure of corresponding element pairs from the intersection
   * of the provided structures' shapes.
   */
  zip_<A, B>(fa: Kind<F, [A]>, fb: Kind<F, [B]>): Kind<F, [[A, B]]>;
}

export type ZipRequirements<F> = Pick<Zip<F>, 'zipWith_'> &
  FunctorRequirements<F> &
  Partial<Zip<F>>;
export const Zip = Object.freeze({
  of: <F>(F: ZipRequirements<F>): Zip<F> => {
    const self: Zip<F> = {
      zipWith: (fb, f) => fa => self.zipWith_(fa, fb, f),
      zip: fb => fa => self.zip_(fa, fb),
      zip_: (fa, fb) => self.zipWith_(fa, fb, (a, b) => [a, b]),
      ...Functor.of(F),
      ...F,
    };
    return self;
  },

  get Array(): Zip<ArrayF> {
    return Unzip.Array;
  },
});
