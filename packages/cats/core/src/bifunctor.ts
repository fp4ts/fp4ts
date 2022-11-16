// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Base, Fix, id, instance, Kind, lazyVal, α, λ } from '@fp4ts/core';
import { Functor } from './functor';

/**
 * @category Type Class
 */
export interface Bifunctor<F> extends Base<F> {
  readonly bimap: <A, B, C, D>(
    f: (a: A) => C,
    g: (b: B) => D,
  ) => (fab: Kind<F, [A, B]>) => Kind<F, [C, D]>;
  readonly bimap_: <A, B, C, D>(
    fab: Kind<F, [A, B]>,
    f: (a: A) => C,
    g: (b: B) => D,
  ) => Kind<F, [C, D]>;

  readonly leftFunctor: <X>() => Functor<λ<F, [α, Fix<X>]>>;
  readonly rightFunctor: <X>() => Functor<$<F, [X]>>;

  readonly map: <B, D>(
    g: (b: B) => D,
  ) => <A>(fab: Kind<F, [A, B]>) => Kind<F, [A, D]>;
  readonly map_: <A, B, D>(
    fab: Kind<F, [A, B]>,
    g: (b: B) => D,
  ) => Kind<F, [A, D]>;

  readonly leftMap: <A, C>(
    f: (a: A) => C,
  ) => <B>(fab: Kind<F, [A, B]>) => Kind<F, [C, B]>;
  readonly leftMap_: <A, B, C>(
    fab: Kind<F, [A, B]>,
    f: (a: A) => C,
  ) => Kind<F, [C, B]>;
}

export type BifunctorRequirements<F> = Pick<Bifunctor<F>, 'bimap_'> &
  Partial<Bifunctor<F>>;
export const Bifunctor = Object.freeze({
  of: <F>(F: BifunctorRequirements<F>): Bifunctor<F> => {
    const self: Bifunctor<F> = instance<Bifunctor<F>>({
      bimap: (f, g) => fab => self.bimap_(fab, f, g),

      leftFunctor: lazyVal(<X>() =>
        Functor.of<λ<F, [α, Fix<X>]>>({
          map_: (fa, f) => self.leftMap_(fa, f),
        }),
      ) as <X>() => Functor<λ<F, [α, Fix<X>]>>,
      rightFunctor: lazyVal(<X>() =>
        Functor.of<$<F, [X]>>({
          map_: (fa, f) => self.map_(fa, f),
        }),
      ) as <X>() => Functor<$<F, [X]>>,

      map: g => fab => self.map_(fab, g),
      map_: (fab, g) => self.bimap_(fab, id, g),

      leftMap: f => fab => self.leftMap_(fab, f),
      leftMap_: (fab, f) => self.bimap_(fab, f, id),

      ...F,
    });
    return self;
  },
});
