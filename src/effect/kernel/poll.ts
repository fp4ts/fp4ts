import { Kind } from '../../fp/hkt';

export interface Poll<F> {
  <A>(ioa: Kind<F, A>): Kind<F, A>;
}
