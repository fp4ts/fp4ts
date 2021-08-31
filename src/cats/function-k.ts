import { Kind, Kind2 } from '../fp/hkt';

export interface FunctionK<F, G> {
  <A>(fa: Kind<F, A>): Kind<G, A>;
}

export interface FunctionK2C<F, G, E> {
  <A>(fa: Kind2<F, E, A>): Kind2<G, E, A>;
}

export interface FunctionK2<F, G> {
  <E, A>(fa: Kind2<F, E, A>): Kind2<G, E, A>;
}
