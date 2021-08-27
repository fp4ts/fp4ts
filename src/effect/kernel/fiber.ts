import { Outcome } from './outcome';
import { Kind } from '../../fp/hkt';

export interface Fiber<F, A> {
  readonly join: Kind<F, Outcome<A>>;
  readonly joinWith: <B>(onCancel: Kind<F, B>) => Kind<F, A | B>;
  readonly joinWithNever: Kind<F, A>;
  readonly cancel: Kind<F, void>;
}
