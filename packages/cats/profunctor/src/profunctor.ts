// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Base, Kind, instance, id } from '@fp4ts/core';

/**
 * @category Type Class
 * @category Profunctor
 */
export interface Profunctor<P> extends Base<P> {
  dimap<A, B, C, D>(
    f: (c: C) => A,
    g: (b: B) => D,
  ): (fab: Kind<P, [A, B]>) => Kind<P, [C, D]>;
  dimap_<A, B, C, D>(
    pab: Kind<P, [A, B]>,
    f: (c: C) => A,
    g: (b: B) => D,
  ): Kind<P, [C, D]>;

  lmap<A, C>(f: (c: C) => A): <B>(fab: Kind<P, [A, B]>) => Kind<P, [C, B]>;
  lmap_<A, B, C>(pab: Kind<P, [A, B]>, f: (c: C) => A): Kind<P, [C, B]>;

  rmap<B, D>(g: (b: B) => D): <A>(fab: Kind<P, [A, B]>) => Kind<P, [A, D]>;
  rmap_<A, B, D>(pab: Kind<P, [A, B]>, g: (b: B) => D): Kind<P, [A, D]>;
}

export type ProfunctorRequirements<F> = (
  | Pick<Profunctor<F>, 'dimap_'>
  | Pick<Profunctor<F>, 'lmap_' | 'rmap_'>
) &
  Partial<Profunctor<F>>;
export const Profunctor = Object.freeze({
  of: <P>(P: ProfunctorRequirements<P>): Profunctor<P> => {
    const self: Profunctor<P> = instance<Profunctor<P>>({
      dimap: (f, g) => fab => self.dimap_(fab, f, g),
      dimap_: P.dimap_ ?? ((pab, f, g) => self.lmap_(self.rmap_(pab, g), f)),

      lmap: f => fab => self.lmap_(fab, f),
      lmap_: P.lmap_ ?? ((fab, f) => self.dimap_(fab, f, id)),

      rmap: f => fab => self.rmap_(fab, f),
      rmap_: P.rmap_ ?? ((fab, g) => self.dimap_(fab, id, g)),

      ...P,
    });
    return self;
  },
});
