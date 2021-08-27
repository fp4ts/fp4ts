import { Kind } from '../fp/hkt';

export interface Defer<F> {
  readonly _URI: F;

  readonly defer: <A>(fa: () => Kind<F, A>) => Kind<F, A>;
}
