import { Kind } from '../fp/hkt';
import { Functor } from './functor';

export interface Apply<F> extends Functor<F> {
  readonly ap: <A, B>(
    ff: Kind<F, (a: A) => B>,
  ) => (fa: Kind<F, A>) => Kind<F, B>;

  readonly map2: <A, B>(
    fa: Kind<F, A>,
    fb: Kind<F, B>,
  ) => <C>(f: (a: A, b: B) => C) => Kind<F, C>;

  readonly product: <A, B>(fa: Kind<F, A>, fb: Kind<F, B>) => Kind<F, [A, B]>;

  readonly productL: <A>(fa: Kind<F, A>, fb: Kind<F, unknown>) => Kind<F, A>;
  readonly productR: <B>(fa: Kind<F, unknown>, fb: Kind<F, B>) => Kind<F, B>;
}
