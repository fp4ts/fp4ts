// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { instance, Kind } from '@fp4ts/core';
import { Monoid } from '@fp4ts/cats-kernel';
import { Applicative } from './applicative';
import { Const, Identity } from './data';
import { FoldableWithIndex } from './foldable-with-index';
import { FunctorWithIndex } from './functor-with-index';
import { Traversable } from './traversable';

/**
 * @category Type Class
 */
export interface TraversableWithIndex<F, I>
  extends Traversable<F>,
    FoldableWithIndex<F, I>,
    FunctorWithIndex<F, I> {
  traverseWithIndex<G>(
    G: Applicative<G>,
  ): <A, B>(
    f: (a: A, i: I) => Kind<G, [B]>,
  ) => (fa: Kind<F, [A]>) => Kind<G, [Kind<F, [B]>]>;
  traverseWithIndex_<G>(
    G: Applicative<G>,
  ): <A, B>(
    fa: Kind<F, [A]>,
    f: (a: A, i: I) => Kind<G, [B]>,
  ) => Kind<G, [Kind<F, [B]>]>;
}

export type TraversableWithIndexRequirements<F, I> = Pick<
  TraversableWithIndex<F, I>,
  'traverseWithIndex_'
> &
  Partial<TraversableWithIndex<F, I>>;
export const TraversableWithIndex = Object.freeze({
  of: <F, I>(
    F: TraversableWithIndexRequirements<F, I>,
  ): TraversableWithIndex<F, I> => {
    const self: TraversableWithIndex<F, I> = instance<
      TraversableWithIndex<F, I>
    >({
      traverseWithIndex: G => f => fa => self.traverseWithIndex_(G)(fa, f),

      ...Traversable.of({
        traverse_:
          F.traverse_ ??
          (<G>(G: Applicative<G>) =>
            <A, B>(
              fa: Kind<F, [A]>,
              f: (a: A) => Kind<G, [B]>,
            ): Kind<G, [Kind<F, [B]>]> =>
              self.traverseWithIndex_(G)(fa, a => f(a))),
      }),
      ...FunctorWithIndex.of({
        mapWithIndex_:
          F.mapWithIndex_ ?? F.traverseWithIndex_(Identity.Applicative),
      }),
      ...FoldableWithIndex.of({
        foldMapWithIndex_:
          F.foldMapWithIndex_ ??
          (<M>(M: Monoid<M>) =>
            self.traverseWithIndex_(Const.Applicative<M>(M))),
      }),

      ...F,
    });
    return self;
  },
});
