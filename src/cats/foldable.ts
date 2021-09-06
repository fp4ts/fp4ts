import { Kind, Kind2 } from '../fp/hkt';
import { Monoid } from './monoid';

export interface Foldable<F> {
  readonly URI: F;

  readonly foldLeft: <A, B>(
    b: B,
    f: (b: B, a: A) => B,
  ) => (fa: Kind<F, A>) => B;

  readonly foldRight: <A, B>(
    b: B,
    f: (a: A, b: B) => B,
  ) => (fa: Kind<F, A>) => B;

  readonly foldMap: <M>(
    M: Monoid<M>,
  ) => <A>(f: (a: A) => M) => (fa: Kind<F, A>) => M;

  readonly isEmpty: <A>(fa: Kind<F, A>) => boolean;
  readonly nonEmpty: <A>(fa: Kind<F, A>) => boolean;

  readonly all: <A>(p: (a: A) => boolean) => (fa: Kind<F, A>) => boolean;
  readonly any: <A>(p: (a: A) => boolean) => (fa: Kind<F, A>) => boolean;

  readonly size: <A>(fa: Kind<F, A>) => number;

  readonly count: <A>(p: (a: A) => boolean) => (fa: Kind<F, A>) => number;
}

export interface Foldable2C<F, E> {
  readonly URI: F;

  readonly foldLeft: <A, B>(
    b: B,
    f: (b: B, a: A) => B,
  ) => (fa: Kind2<F, E, A>) => B;

  readonly foldRight: <A, B>(
    b: B,
    f: (a: A, b: B) => B,
  ) => (fa: Kind2<F, E, A>) => B;

  readonly foldMap: <M>(
    M: Monoid<M>,
  ) => <A>(f: (a: A) => M) => (fa: Kind2<F, E, A>) => M;

  readonly isEmpty: <A>(fa: Kind2<F, E, A>) => boolean;
  readonly nonEmpty: <A>(fa: Kind2<F, E, A>) => boolean;

  readonly all: <A>(p: (a: A) => boolean) => (fa: Kind2<F, E, A>) => boolean;
  readonly any: <A>(p: (a: A) => boolean) => (fa: Kind2<F, E, A>) => boolean;

  readonly size: <A>(fa: Kind2<F, E, A>) => number;

  readonly count: <A>(p: (a: A) => boolean) => (fa: Kind2<F, E, A>) => number;
}

export interface Foldable2<F> {
  readonly URI: F;

  readonly foldLeft: <A, B>(
    b: B,
    f: (b: B, a: A) => B,
  ) => <E>(fa: Kind2<F, E, A>) => B;

  readonly foldRight: <A, B>(
    b: B,
    f: (a: A, b: B) => B,
  ) => <E>(fa: Kind2<F, E, A>) => B;

  readonly foldMap: <M>(
    M: Monoid<M>,
  ) => <A>(f: (a: A) => M) => <E>(fa: Kind2<F, E, A>) => M;

  readonly isEmpty: <E, A>(fa: Kind2<F, E, A>) => boolean;
  readonly nonEmpty: <E, A>(fa: Kind2<F, E, A>) => boolean;

  readonly all: <A>(p: (a: A) => boolean) => <E>(fa: Kind2<F, E, A>) => boolean;
  readonly any: <A>(p: (a: A) => boolean) => <E>(fa: Kind2<F, E, A>) => boolean;

  readonly size: <E, A>(fa: Kind2<F, E, A>) => number;

  readonly count: <A>(
    p: (a: A) => boolean,
  ) => <E>(fa: Kind2<F, E, A>) => number;
}
