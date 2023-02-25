// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Alternative } from './alternative';
import { FunctorFilter } from './functor-filter';
import { Monad, MonadRequirements } from './monad';
import { MonoidKRequirements } from './monoid-k';

import { Option } from './data';
import { ArrayF, arrayMonadPlus } from './instances/array';

/**
 * @category Type Class
 */
export interface MonadPlus<F>
  extends Monad<F>,
    Alternative<F>,
    FunctorFilter<F> {}
export type MonadPlusRequirements<F> = MonadRequirements<F> &
  MonoidKRequirements<F> &
  Partial<MonadPlus<F>>;
export const MonadPlus = Object.freeze({
  of: <F>(F: MonadPlusRequirements<F>): MonadPlus<F> => {
    const M: Monad<F> = Monad.of({ ...F });
    const self: MonadPlus<F> = {
      ...Alternative.of({ ...M, ...F }),
      ...FunctorFilter.of({
        mapFilter_:
          F.mapFilter_ ??
          (<A, B>(fa: Kind<F, [A]>, f: (a: A) => Option<B>): Kind<F, [B]> =>
            F.flatMap_(fa, a => {
              const ob = f(a);
              return ob.nonEmpty ? self.pure(ob.get) : self.emptyK<B>();
            })),

        filter_:
          F.filter_ ??
          (<A>(fa: Kind<F, [A]>, f: (a: A) => boolean): Kind<F, [A]> =>
            F.flatMap_(fa, a => (f(a) ? F.pure(a) : F.emptyK<A>()))),

        ...M,
        ...F,
      }),
      ...M,
      ...F,
    };
    return self;
  },

  get Array(): MonadPlus<ArrayF> {
    return arrayMonadPlus();
  },
});
