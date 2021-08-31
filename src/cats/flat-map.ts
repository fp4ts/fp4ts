import { Kind, Kind2 } from '../fp/hkt';
import { Apply, Apply2C, Apply2 } from './apply';

export interface FlatMap<F> extends Apply<F> {
  readonly flatMap: <A, B>(
    f: (a: A) => Kind<F, B>,
  ) => (fa: Kind<F, A>) => Kind<F, B>;

  readonly flatTap: <A>(
    f: (a: A) => Kind<F, unknown>,
  ) => (fa: Kind<F, A>) => Kind<F, A>;

  readonly flatten: <A>(ffa: Kind<F, Kind<F, A>>) => Kind<F, A>;
}

export interface FlatMap2C<F, E> extends Apply2C<F, E> {
  readonly flatMap: <A, B>(
    f: (a: A) => Kind2<F, E, B>,
  ) => (fa: Kind2<F, E, A>) => Kind2<F, E, B>;

  readonly flatTap: <A>(
    f: (a: A) => Kind2<F, E, unknown>,
  ) => (fa: Kind2<F, E, A>) => Kind2<F, E, A>;

  readonly flatten: <A>(ffa: Kind2<F, E, Kind2<F, E, A>>) => Kind2<F, E, A>;
}

export interface FlatMap2<F> extends Apply2<F> {
  readonly flatMap: <E2, A, B>(
    f: (a: A) => Kind2<F, E2, B>,
  ) => <E extends E2>(fa: Kind2<F, E, A>) => Kind2<F, E2, B>;

  readonly flatTap: <E2, A>(
    f: (a: A) => Kind2<F, E2, unknown>,
  ) => <E extends E2>(fa: Kind2<F, E, A>) => Kind2<F, E2, A>;

  readonly flatten: <E, A>(ffa: Kind2<F, E, Kind2<F, E, A>>) => Kind2<F, E, A>;
}
