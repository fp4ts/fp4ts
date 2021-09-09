import { Kind, Kind2 } from '../fp/hkt';
import { Monoid, ConjunctionMonoid, DisjunctionMonoid } from './monoid';

export interface Foldable<F> {
  readonly URI: F;

  readonly foldLeft: <A, B>(
    b: B,
    f: (b: B, a: A) => B,
  ) => (fa: Kind<F, A>) => B;
  readonly foldLeft_: <A, B>(fa: Kind<F, A>, b: B, f: (b: B, a: A) => B) => B;

  readonly foldRight: <A, B>(
    b: B,
    f: (a: A, b: B) => B,
  ) => (fa: Kind<F, A>) => B;
  readonly foldRight_: <A, B>(fa: Kind<F, A>, b: B, f: (a: A, b: B) => B) => B;

  readonly foldMap: <M>(
    M: Monoid<M>,
  ) => <A>(f: (a: A) => M) => (fa: Kind<F, A>) => M;
  readonly foldMap_: <M>(
    M: Monoid<M>,
  ) => <A>(fa: Kind<F, A>, f: (a: A) => M) => M;

  readonly isEmpty: <A>(fa: Kind<F, A>) => boolean;
  readonly nonEmpty: <A>(fa: Kind<F, A>) => boolean;

  readonly all: <A>(p: (a: A) => boolean) => (fa: Kind<F, A>) => boolean;
  readonly all_: <A>(fa: Kind<F, A>, p: (a: A) => boolean) => boolean;
  readonly any: <A>(p: (a: A) => boolean) => (fa: Kind<F, A>) => boolean;
  readonly any_: <A>(fa: Kind<F, A>, p: (a: A) => boolean) => boolean;

  readonly count: <A>(p: (a: A) => boolean) => (fa: Kind<F, A>) => number;
  readonly count_: <A>(fa: Kind<F, A>, p: (a: A) => boolean) => number;

  readonly size: <A>(fa: Kind<F, A>) => number;
}

export type FoldableRequirements<F> = Pick<
  Foldable<F>,
  'URI' | 'foldLeft_' | 'foldRight_'
> &
  Partial<Foldable<F>>;
export const Foldable = {
  of: <F>(F: FoldableRequirements<F>): Foldable<F> => {
    const self: Foldable<F> = {
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
    };
    return self;
  },
};

export interface Foldable2C<F, E> {
  readonly URI: F;

  readonly foldLeft: <A, B>(
    b: B,
    f: (b: B, a: A) => B,
  ) => (fa: Kind2<F, E, A>) => B;
  readonly foldLeft_: <A, B>(
    fa: Kind2<F, E, A>,
    b: B,
    f: (b: B, a: A) => B,
  ) => B;

  readonly foldRight: <A, B>(
    b: B,
    f: (a: A, b: B) => B,
  ) => (fa: Kind2<F, E, A>) => B;
  readonly foldRight_: <A, B>(
    fa: Kind2<F, E, A>,
    b: B,
    f: (a: A, b: B) => B,
  ) => B;

  readonly foldMap: <M>(
    M: Monoid<M>,
  ) => <A>(f: (a: A) => M) => (fa: Kind2<F, E, A>) => M;
  readonly foldMap_: <M>(
    M: Monoid<M>,
  ) => <A>(fa: Kind2<F, E, A>, f: (a: A) => M) => M;

  readonly isEmpty: <A>(fa: Kind2<F, E, A>) => boolean;
  readonly nonEmpty: <A>(fa: Kind2<F, E, A>) => boolean;

  readonly all: <A>(p: (a: A) => boolean) => (fa: Kind2<F, E, A>) => boolean;
  readonly all_: <A>(fa: Kind2<F, E, A>, p: (a: A) => boolean) => boolean;
  readonly any: <A>(p: (a: A) => boolean) => (fa: Kind2<F, E, A>) => boolean;
  readonly any_: <A>(fa: Kind2<F, E, A>, p: (a: A) => boolean) => boolean;

  readonly count: <A>(p: (a: A) => boolean) => (fa: Kind2<F, E, A>) => number;
  readonly count_: <A>(fa: Kind2<F, E, A>, p: (a: A) => boolean) => number;

  readonly size: <A>(fa: Kind2<F, E, A>) => number;
}

export type Foldable2CRequirements<F, E> = Pick<
  Foldable2C<F, E>,
  'URI' | 'foldLeft_' | 'foldRight_'
> &
  Partial<Foldable2C<F, E>>;
export const Foldable2C = {
  of: <F, E>(F: Foldable2CRequirements<F, E>): Foldable2C<F, E> => {
    const self: Foldable2C<F, E> = {
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
    };
    return self;
  },
};

export interface Foldable2<F> {
  readonly URI: F;

  readonly foldLeft: <A, B>(
    b: B,
    f: (b: B, a: A) => B,
  ) => <E>(fa: Kind2<F, E, A>) => B;
  readonly foldLeft_: <E, A, B>(
    fa: Kind2<F, E, A>,
    b: B,
    f: (b: B, a: A) => B,
  ) => B;

  readonly foldRight: <A, B>(
    b: B,
    f: (a: A, b: B) => B,
  ) => <E>(fa: Kind2<F, E, A>) => B;
  readonly foldRight_: <E, A, B>(
    fa: Kind2<F, E, A>,
    b: B,
    f: (a: A, b: B) => B,
  ) => B;

  readonly foldMap: <M>(
    M: Monoid<M>,
  ) => <A>(f: (a: A) => M) => <E>(fa: Kind2<F, E, A>) => M;
  readonly foldMap_: <M>(
    M: Monoid<M>,
  ) => <E, A>(fa: Kind2<F, E, A>, f: (a: A) => M) => M;

  readonly isEmpty: <E, A>(fa: Kind2<F, E, A>) => boolean;
  readonly nonEmpty: <E, A>(fa: Kind2<F, E, A>) => boolean;

  readonly all: <A>(p: (a: A) => boolean) => <E>(fa: Kind2<F, E, A>) => boolean;
  readonly all_: <E, A>(fa: Kind2<F, E, A>, p: (a: A) => boolean) => boolean;
  readonly any: <A>(p: (a: A) => boolean) => <E>(fa: Kind2<F, E, A>) => boolean;
  readonly any_: <E, A>(fa: Kind2<F, E, A>, p: (a: A) => boolean) => boolean;

  readonly count: <A>(
    p: (a: A) => boolean,
  ) => <E>(fa: Kind2<F, E, A>) => number;
  readonly count_: <E, A>(fa: Kind2<F, E, A>, p: (a: A) => boolean) => number;

  readonly size: <E, A>(fa: Kind2<F, E, A>) => number;
}

export type Foldable2Requirements<F> = Pick<
  Foldable2<F>,
  'URI' | 'foldLeft_' | 'foldRight_'
> &
  Partial<Foldable2<F>>;
export const Foldable2 = {
  of: <F>(F: Foldable2Requirements<F>): Foldable2<F> => {
    const self: Foldable2<F> = {
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
    };
    return self;
  },
};
