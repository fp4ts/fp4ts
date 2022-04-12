// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, id } from '@fp4ts/core';
import { Functor, FunctorRequirements } from './functor';
import { Option, Some, None } from './data/option';

/**
 * @category Type Class
 */
export interface FunctorFilter<F> extends Functor<F> {
  readonly mapFilter: <A, B>(
    f: (a: A) => Option<B>,
  ) => (fa: Kind<F, [A]>) => Kind<F, [B]>;
  readonly mapFilter_: <A, B>(
    fa: Kind<F, [A]>,
    f: (a: A) => Option<B>,
  ) => Kind<F, [B]>;

  collect<A, B>(f: (a: A) => Option<B>): (fa: Kind<F, [A]>) => Kind<F, [B]>;
  collect_<A, B>(fa: Kind<F, [A]>, f: (a: A) => Option<B>): Kind<F, [B]>;

  flattenOption<A>(ffa: Kind<F, [Option<A>]>): Kind<F, [A]>;

  filter<A, B extends A>(
    p: (a: A) => a is B,
  ): (fa: Kind<F, [A]>) => Kind<F, [A]>;
  filter<A>(p: (a: A) => boolean): (fa: Kind<F, [A]>) => Kind<F, [A]>;
  filter_<A, B extends A>(fa: Kind<F, [A]>, p: (a: A) => a is B): Kind<F, [B]>;
  filter_<A>(fa: Kind<F, [A]>, p: (a: A) => boolean): Kind<F, [A]>;

  readonly filterNot: <A>(
    p: (a: A) => boolean,
  ) => (fa: Kind<F, [A]>) => Kind<F, [A]>;
  readonly filterNot_: <A>(
    fa: Kind<F, [A]>,
    p: (a: A) => boolean,
  ) => Kind<F, [A]>;
}

export type FunctorFilterRequirements<F> = Pick<
  FunctorFilter<F>,
  'mapFilter_'
> &
  FunctorRequirements<F> &
  Partial<FunctorFilter<F>>;

export const FunctorFilter = Object.freeze({
  of: <F>(F: FunctorFilterRequirements<F>): FunctorFilter<F> => {
    const self: FunctorFilter<F> = {
      mapFilter: f => fa => self.mapFilter_(fa, f),

      collect: f => fa => self.mapFilter_(fa, f),
      collect_: (fa, f) => self.mapFilter_(fa, f),

      flattenOption: fa => self.collect_(fa, id),
      filter:
        <A>(f: (a: A) => boolean) =>
        (fa: Kind<F, [A]>) =>
          self.filter_(fa, f),
      filter_: <A>(fa: Kind<F, [A]>, p: (a: A) => boolean) =>
        self.collect_(fa, x => (p(x) ? Some(x) : None)),

      filterNot: f => fa => self.filterNot_(fa, f),
      filterNot_: (fa, p) => self.filter_(fa, x => !p(x)),

      ...Functor.of<F>(F),
      ...F,
    };
    return self;
  },
});
