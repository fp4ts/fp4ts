// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id, instance, Kind } from '@fp4ts/core';
import { Traversable } from './traversable';
import { FunctorFilter } from './functor-filter';
import { Applicative } from './applicative';
import { Identity, None, Option, Some } from './data';

/**
 * @category Type Class
 */
export interface TraversableFilter<F> extends Traversable<F>, FunctorFilter<F> {
  traverseFilter<G>(
    G: Applicative<G>,
  ): <A, B>(
    f: (a: A) => Kind<G, [Option<B>]>,
  ) => (fa: Kind<F, [A]>) => Kind<G, [Kind<F, [B]>]>;
  traverseFilter_<G>(
    G: Applicative<G>,
  ): <A, B>(
    fa: Kind<F, [A]>,
    f: (a: A) => Kind<G, [Option<B>]>,
  ) => Kind<G, [Kind<F, [B]>]>;

  sequenceFilter<G>(
    G: Applicative<G>,
  ): <A>(fga: Kind<F, [Kind<G, [Option<A>]>]>) => Kind<G, [Kind<F, [A]>]>;

  filterA<G>(
    G: Applicative<G>,
  ): <A>(
    f: (a: A) => Kind<G, [boolean]>,
  ) => (fa: Kind<F, [A]>) => Kind<G, [Kind<F, [A]>]>;
  filterA_<G>(
    G: Applicative<G>,
  ): <A>(
    fa: Kind<F, [A]>,
    f: (a: A) => Kind<G, [boolean]>,
  ) => Kind<G, [Kind<F, [A]>]>;
}

export type TraversableFilterRequirements<F> = Pick<
  TraversableFilter<F>,
  'traverseFilter_'
> &
  Partial<TraversableFilter<F>>;
export const TraversableFilter = Object.freeze({
  of: <F>(F: TraversableFilterRequirements<F>): TraversableFilter<F> => {
    const self: TraversableFilter<F> = instance({
      traverseFilter:
        <G>(G: Applicative<G>) =>
        <A, B>(f: (a: A) => Kind<G, [Option<B>]>) =>
        (fa: Kind<F, [A]>) =>
          self.traverseFilter_(G)(fa, f),

      sequenceFilter:
        <G>(G: Applicative<G>) =>
        <A>(fga: Kind<F, [Kind<G, [Option<A>]>]>) =>
          self.traverseFilter_(G)(fga, id),

      filterA:
        <G>(G: Applicative<G>) =>
        <A>(f: (a: A) => Kind<G, [boolean]>) =>
        (fa: Kind<F, [A]>) =>
          self.filterA_(G)(fa, f),
      filterA_:
        <G>(G: Applicative<G>) =>
        <A>(fa: Kind<F, [A]>, f: (a: A) => Kind<G, [boolean]>) =>
          self.traverseFilter_(G)(fa, x =>
            G.map_(f(x), b => (b ? Some(x) : None)),
          ),

      ...Traversable.of({
        traverse_:
          F.traverse_ ??
          (<G>(G: Applicative<G>) =>
            <A, B>(fa: Kind<F, [A]>, f: (a: A) => Kind<G, [B]>) =>
              self.traverseFilter_(G)(fa, x => G.map_(f(x), Some))),
      }),
      ...FunctorFilter.of({
        mapFilter_:
          F.mapFilter_ ??
          (<A, B>(fa: Kind<F, [A]>, f: (a: A) => Option<B>) =>
            self.traverseFilter_(Identity.Applicative)(fa, f)),
      }),
      ...F,
    });
    return self;
  },
});
