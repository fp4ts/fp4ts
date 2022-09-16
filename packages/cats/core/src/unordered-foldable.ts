// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Base, id, instance, Kind, lazyVal } from '@fp4ts/core';
import { CommutativeMonoid } from '@fp4ts/cats-kernel';
import { Eval } from './eval';

/**
 * @category Type Class
 */
export interface UnorderedFoldable<F> extends Base<F> {
  readonly unorderedFoldMap: <M>(
    M: CommutativeMonoid<M>,
  ) => <A>(f: (a: A) => M) => (fa: Kind<F, [A]>) => M;
  readonly unorderedFoldMap_: <M>(
    M: CommutativeMonoid<M>,
  ) => <A>(fa: Kind<F, [A]>, f: (a: A) => M) => M;

  readonly unorderedFold: <A>(
    M: CommutativeMonoid<A>,
  ) => (fa: Kind<F, [A]>) => A;

  readonly isEmpty: <A>(fa: Kind<F, [A]>) => boolean;
  readonly nonEmpty: <A>(fa: Kind<F, [A]>) => boolean;

  readonly all: <A>(p: (a: A) => boolean) => (fa: Kind<F, [A]>) => boolean;
  readonly all_: <A>(fa: Kind<F, [A]>, p: (a: A) => boolean) => boolean;
  readonly any: <A>(p: (a: A) => boolean) => (fa: Kind<F, [A]>) => boolean;
  readonly any_: <A>(fa: Kind<F, [A]>, p: (a: A) => boolean) => boolean;

  readonly count: <A>(p: (a: A) => boolean) => (fa: Kind<F, [A]>) => number;
  readonly count_: <A>(fa: Kind<F, [A]>, p: (a: A) => boolean) => number;

  readonly size: <A>(fa: Kind<F, [A]>) => number;
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
        self.unorderedFoldMap_(andEvalMonoid())(fa, x => Eval.later(() => p(x)))
          .value,

      any: f => fa => self.any_(fa, f),
      any_: (fa, p) =>
        self.unorderedFoldMap_(orEvalMonoid())(fa, x => Eval.later(() => p(x)))
          .value,

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

const orEvalMonoid: () => CommutativeMonoid<Eval<boolean>> = lazyVal(() =>
  CommutativeMonoid.of({
    empty: Eval.false,
    combine_: (x, y) => x.flatMap(x => (!x ? y() : Eval.true)),
  }),
);
const andEvalMonoid: () => CommutativeMonoid<Eval<boolean>> = lazyVal(() =>
  CommutativeMonoid.of({
    empty: Eval.true,
    combine_: (x, y) => x.flatMap(x => (x ? y() : Eval.false)),
  }),
);
