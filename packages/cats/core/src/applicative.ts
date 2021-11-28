// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Functor } from './functor';
import { Apply } from './apply';
import { ComposedApplicative } from './composed';

/**
 * @category Type Class
 */
export interface Applicative<F> extends Apply<F> {
  readonly pure: <A>(a: A) => Kind<F, [A]>;
  readonly unit: Kind<F, [void]>;
}

export type ApplicativeRequirements<F> = Pick<Applicative<F>, 'pure' | 'ap_'> &
  Partial<Applicative<F>>;
export const Applicative = Object.freeze({
  of: <F>(F: ApplicativeRequirements<F>): Applicative<F> => {
    const self: Applicative<F> = {
      unit: F.pure(undefined as void),

      ...Apply.of<F>({ ...Applicative.deriveFunctor<F>(F), ...F }),
      ...F,
    };
    return self;
  },

  compose: <F, G>(
    F: Applicative<F>,
    G: Applicative<G>,
  ): ComposedApplicative<F, G> => ComposedApplicative.of(F, G),

  deriveFunctor: <F>(F: ApplicativeRequirements<F>): Functor<F> =>
    Functor.of<F>({
      map_: (fa, f) => F.ap_(F.pure(f), fa),
      ...F,
    }),
});
