import { Kind, Kind2 } from '../fp/hkt';
import { Apply, Apply2C, Apply2 } from './apply';

export interface Applicative<F> extends Apply<F> {
  readonly pure: <A>(a: A) => Kind<F, A>;
  readonly unit: Kind<F, void>;
}

export interface Applicative2C<F, E> extends Apply2C<F, E> {
  readonly pure: <A>(a: A) => Kind2<F, E, A>;
  readonly unit: Kind2<F, E, void>;
}

export interface Applicative2<F> extends Apply2<F> {
  readonly pure: <E, A>(a: A) => Kind2<F, E, A>;
  readonly unit: Kind2<F, never, void>;
}
