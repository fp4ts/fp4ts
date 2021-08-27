import { Kind } from '../fp/hkt';
import { Apply } from './apply';

export interface Applicative<F> extends Apply<F> {
  readonly pure: <A>(a: A) => Kind<F, A>;
  readonly unit: Kind<F, void>;
}
