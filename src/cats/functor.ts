import { Kind } from '../fp/hkt';

export interface Functor<F> {
  readonly _URI: F;

  readonly map: <A, B>(f: (a: A) => B) => (fa: Kind<F, A>) => Kind<F, B>;

  readonly tap: <A>(f: (a: A) => unknown) => (fa: Kind<F, A>) => Kind<F, A>;
}
