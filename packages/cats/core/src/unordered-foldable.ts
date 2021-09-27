import { AnyK, Base, id, instance, Kind } from '@cats4ts/core';
import {
  AdditionMonoid,
  ConjunctionMonoid,
  DisjunctionMonoid,
  Eval,
} from '@cats4ts/cats-core';

import { Monoid } from './monoid';

export interface UnorderedFoldable<F extends AnyK> extends Base<F> {
  readonly unorderedFoldMap: <M>(
    M: Monoid<M>,
  ) => <A>(f: (a: A) => M) => (fa: Kind<F, [A]>) => M;
  readonly unorderedFoldMap_: <M>(
    M: Monoid<M>,
  ) => <A>(fa: Kind<F, [A]>, f: (a: A) => M) => M;

  readonly unorderedFold: <A>(M: Monoid<A>) => (fa: Kind<F, [A]>) => A;

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

export type UnorderedFoldableRequirements<F extends AnyK> = Pick<
  UnorderedFoldable<F>,
  'unorderedFoldMap_'
> &
  Partial<UnorderedFoldable<F>>;
export const UnorderedFoldable = Object.freeze({
  of: <F extends AnyK>(
    F: UnorderedFoldableRequirements<F>,
  ): UnorderedFoldable<F> => {
    const self: UnorderedFoldable<F> = instance<UnorderedFoldable<F>>({
      unorderedFoldMap: M => f => fa => F.unorderedFoldMap_(M)(fa, f),

      unorderedFold: M => fa => F.unorderedFoldMap_(M)(fa, id),

      isEmpty: fa => !self.nonEmpty(fa),
      nonEmpty: fa => self.any_(fa, () => true),

      all: f => fa => self.all_(fa, f),
      all_: (fa, p) =>
        self.unorderedFoldMap_(Eval.Monoid(ConjunctionMonoid))(fa, x =>
          Eval.later(() => p(x)),
        ).value,

      any: f => fa => self.any_(fa, f),
      any_: (fa, p) =>
        self.unorderedFoldMap_(Eval.Monoid(DisjunctionMonoid))(fa, x =>
          Eval.later(() => p(x)),
        ).value,

      count: p => fa => self.count_(fa, p),
      count_: (fa, p) =>
        self.unorderedFoldMap_(AdditionMonoid)(fa, x => (p(x) ? 1 : 0)),

      size: fa => self.unorderedFoldMap_(AdditionMonoid)(fa, () => 1),

      ...F,
    });
    return self;
  },
});
