// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Base, id, instance, Kind } from '@fp4ts/core';
import { CommutativeMonoid } from '@fp4ts/cats-kernel';

/**
 * @category Type Class
 */
export interface UnorderedFoldable<F> extends Base<F> {
  /**
   * Lazy fold mapping each element of the structure `Kind<F, [A]>` into a commutative
   *  monoid `M` and combining them using `combineEval`.
   */
  unorderedFoldMap<M>(
    M: CommutativeMonoid<M>,
  ): <A>(f: (a: A) => M) => (fa: Kind<F, [A]>) => M;
  /**
   * Lazy fold mapping each element of the structure `Kind<F, [A]>` into a commutative
   * monoid `M` and combining them using `combineEval`.
   */
  unorderedFoldMap_<M>(
    M: CommutativeMonoid<M>,
  ): <A>(fa: Kind<F, [A]>, f: (a: A) => M) => M;

  /**
   * Lazy fold combining each element of the structure `Kind<F, [A]>` using
   * `combineEval` of the provided commutative monoid.
   */
  unorderedFold<A>(M: CommutativeMonoid<A>): (fa: Kind<F, [A]>) => A;

  isEmpty<A>(fa: Kind<F, [A]>): boolean;
  nonEmpty<A>(fa: Kind<F, [A]>): boolean;

  all<A>(p: (a: A) => boolean): (fa: Kind<F, [A]>) => boolean;
  all_<A>(fa: Kind<F, [A]>, p: (a: A) => boolean): boolean;
  any<A>(p: (a: A) => boolean): (fa: Kind<F, [A]>) => boolean;
  any_<A>(fa: Kind<F, [A]>, p: (a: A) => boolean): boolean;

  count<A>(p: (a: A) => boolean): (fa: Kind<F, [A]>) => number;
  count_<A>(fa: Kind<F, [A]>, p: (a: A) => boolean): number;

  size<A>(fa: Kind<F, [A]>): number;
}

export type UnorderedFoldableRequirements<F> = Pick<
  UnorderedFoldable<F>,
  'unorderedFoldMap_'
> &
  Partial<UnorderedFoldable<F>>;
export const UnorderedFoldable = Object.freeze({
  of: <F>(F: UnorderedFoldableRequirements<F>): UnorderedFoldable<F> => {
    const self: UnorderedFoldable<F> = instance<UnorderedFoldable<F>>({
      unorderedFoldMap: M => f => fa => F.unorderedFoldMap_(M)(fa, f),

      unorderedFold: M => fa => F.unorderedFoldMap_(M)(fa, id),

      isEmpty: fa => !self.nonEmpty(fa),
      nonEmpty: fa => self.any_(fa, () => true),

      all: f => fa => self.all_(fa, f),
      all_: (fa, p) =>
        self.unorderedFoldMap_(CommutativeMonoid.conjunction)(fa, p),

      any: f => fa => self.any_(fa, f),
      any_: (fa, p) =>
        self.unorderedFoldMap_(CommutativeMonoid.disjunction)(fa, p),

      count: p => fa => self.count_(fa, p),
      count_: (fa, p) =>
        self.unorderedFoldMap_(CommutativeMonoid.addition)(fa, x =>
          p(x) ? 1 : 0,
        ),

      size: fa =>
        self.unorderedFoldMap_(CommutativeMonoid.addition)(fa, () => 1),

      ...F,
    });
    return self;
  },
});
