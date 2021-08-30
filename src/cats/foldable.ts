import { Kind } from '../fp/hkt';
import { Monoid } from './monoid';

export interface Foldable<F> {
  readonly _URI: F;

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
