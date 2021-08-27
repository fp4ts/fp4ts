import { Kind } from '../fp/hkt';

export interface Functor<F> {
  readonly _URI: F;

  readonly map: <A>(fa: Kind<F, A>) => <B>(f: (a: A) => B) => Kind<F, B>;
}
