import { Kind, instance, Base, AnyK } from '../core';
import { Monoid, ConjunctionMonoid, DisjunctionMonoid } from './monoid';

export interface Foldable<F extends AnyK> extends Base<F> {
  readonly foldLeft: <A, B>(
    b: B,
    f: (b: B, a: A) => B,
  ) => (fa: Kind<F, [A]>) => B;
  readonly foldLeft_: <A, B>(fa: Kind<F, [A]>, b: B, f: (b: B, a: A) => B) => B;

  readonly foldRight: <A, B>(
    b: B,
    f: (a: A, b: B) => B,
  ) => (fa: Kind<F, [A]>) => B;
  readonly foldRight_: <A, B>(
    fa: Kind<F, [A]>,
    b: B,
    f: (a: A, b: B) => B,
  ) => B;

  readonly foldMap: <M>(
    M: Monoid<M>,
  ) => <A>(f: (a: A) => M) => (fa: Kind<F, [A]>) => M;
  readonly foldMap_: <M>(
    M: Monoid<M>,
  ) => <A>(fa: Kind<F, [A]>, f: (a: A) => M) => M;

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

export type FoldableRequirements<F extends AnyK> = Pick<
  Foldable<F>,
  'foldLeft_' | 'foldRight_'
> &
  Partial<Foldable<F>>;
export const Foldable = {
  of: <F extends AnyK>(F: FoldableRequirements<F>): Foldable<F> => {
    const self: Foldable<F> = instance<Foldable<F>>({
      foldLeft: (z, f) => fa => self.foldLeft_(fa, z, f),
      foldRight: (z, f) => fa => self.foldRight_(fa, z, f),

      foldMap: M => f => fa => self.foldMap_(M)(fa, f),
      foldMap_: M => (fa, f) =>
        self.foldLeft_(fa, M.empty, (r, x) => M.combine_(r, f(x))),

      isEmpty: fa => self.size(fa) === 0,
      nonEmpty: fa => !self.isEmpty(fa),

      all: f => fa => self.any_(fa, f),
      all_: (fa, f) => self.foldMap_(ConjunctionMonoid)(fa, f),
      any: f => fa => self.any_(fa, f),
      any_: (fa, f) => self.foldMap_(DisjunctionMonoid)(fa, f),

      count: p => fa => self.count_(fa, p),
      count_: (fa, p) => self.foldLeft_(fa, 0, (c, x) => c + (p(x) ? 1 : 0)),

      size: fa => self.foldLeft_(fa, 0, c => c + 1),

      ...F,
    });
    return self;
  },
};
