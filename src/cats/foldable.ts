import { Kind, instance, Auto, Base } from '../core';
import { Monoid, ConjunctionMonoid, DisjunctionMonoid } from './monoid';

export interface Foldable<F, C = Auto> extends Base<F, C> {
  readonly foldLeft: <A, B>(
    b: B,
    f: (b: B, a: A) => B,
  ) => <S, R, E>(fa: Kind<F, C, S, R, E, A>) => B;
  readonly foldLeft_: <S, R, E, A, B>(
    fa: Kind<F, C, S, R, E, A>,
    b: B,
    f: (b: B, a: A) => B,
  ) => B;

  readonly foldRight: <A, B>(
    b: B,
    f: (a: A, b: B) => B,
  ) => <S, R, E>(fa: Kind<F, C, S, R, E, A>) => B;
  readonly foldRight_: <S, R, E, A, B>(
    fa: Kind<F, C, S, R, E, A>,
    b: B,
    f: (a: A, b: B) => B,
  ) => B;

  readonly foldMap: <M>(
    M: Monoid<M>,
  ) => <A>(f: (a: A) => M) => <S, R, E>(fa: Kind<F, C, S, R, E, A>) => M;
  readonly foldMap_: <M>(
    M: Monoid<M>,
  ) => <S, R, E, A>(fa: Kind<F, C, S, R, E, A>, f: (a: A) => M) => M;

  readonly isEmpty: <S, R, E, A>(fa: Kind<F, C, S, R, E, A>) => boolean;
  readonly nonEmpty: <S, R, E, A>(fa: Kind<F, C, S, R, E, A>) => boolean;

  readonly all: <A>(
    p: (a: A) => boolean,
  ) => <S, R, E>(fa: Kind<F, C, S, R, E, A>) => boolean;
  readonly all_: <S, R, E, A>(
    fa: Kind<F, C, S, R, E, A>,
    p: (a: A) => boolean,
  ) => boolean;
  readonly any: <A>(
    p: (a: A) => boolean,
  ) => <S, R, E>(fa: Kind<F, C, S, R, E, A>) => boolean;
  readonly any_: <S, R, E, A>(
    fa: Kind<F, C, S, R, E, A>,
    p: (a: A) => boolean,
  ) => boolean;

  readonly count: <A>(
    p: (a: A) => boolean,
  ) => <S, R, E>(fa: Kind<F, C, S, R, E, A>) => number;
  readonly count_: <S, R, E, A>(
    fa: Kind<F, C, S, R, E, A>,
    p: (a: A) => boolean,
  ) => number;

  readonly size: <S, R, E, A>(fa: Kind<F, C, S, R, E, A>) => number;
}

export type FoldableRequirements<F, C = Auto> = Pick<
  Foldable<F, C>,
  'foldLeft_' | 'foldRight_'
> &
  Partial<Foldable<F, C>>;
export const Foldable = {
  of: <F, C = Auto>(F: FoldableRequirements<F, C>): Foldable<F, C> => {
    const self: Foldable<F, C> = instance<Foldable<F, C>>({
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
