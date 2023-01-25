// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { instance, Kind } from '@fp4ts/core';
import { Functor } from './functor';
import { ArrayF, arrayFunctorWithIndex } from './instances/array';

/**
 * @category Type Class
 */
export interface FunctorWithIndex<F, I> extends Functor<F> {
  mapWithIndex<A, B>(f: (a: A, i: I) => B): (fa: Kind<F, [A]>) => Kind<F, [B]>;
  mapWithIndex_<A, B>(fa: Kind<F, [A]>, f: (a: A, i: I) => B): Kind<F, [B]>;
}

export type FunctorWithIndexRequirements<F, I> = Pick<
  FunctorWithIndex<F, I>,
  'mapWithIndex_'
> &
  Partial<FunctorWithIndex<F, I>>;
export const FunctorWithIndex = Object.freeze({
  of: <F, I>(F: FunctorWithIndexRequirements<F, I>): FunctorWithIndex<F, I> => {
    const self: FunctorWithIndex<F, I> = instance<FunctorWithIndex<F, I>>({
      mapWithIndex: f => fa => self.mapWithIndex_(fa, f),

      ...Functor.of({
        map_:
          F.map_ ??
          (<A, B>(fa: Kind<F, [A]>, f: (a: A) => B) =>
            self.mapWithIndex_(fa, a => f(a))),
      }),

      ...F,
    });
    return self;
  },

  get Array(): FunctorWithIndex<ArrayF, number> {
    return arrayFunctorWithIndex();
  },
});
