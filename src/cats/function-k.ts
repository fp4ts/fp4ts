import { Kind } from '../fp/hkt';

export interface FunctionK<F, G> {
  <A>(fa: Kind<F, A>): Kind<G, A>;
}
