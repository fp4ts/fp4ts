import { Functor2, Functor2C } from '.';
import { Kind, Kind2 } from '../fp/hkt';
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

  readonly productL: <A, B>(fa: Kind<F, A>, fb: Kind<F, B>) => Kind<F, A>;
  readonly productR: <A, B>(fa: Kind<F, A>, fb: Kind<F, B>) => Kind<F, B>;
}

export interface Apply2C<F, E> extends Functor2C<F, E> {
  readonly ap: <A, B>(
    ff: Kind2<F, E, (a: A) => B>,
  ) => (fa: Kind2<F, E, A>) => Kind2<F, E, B>;

  readonly map2: <A, B>(
    fa: Kind2<F, E, A>,
    fb: Kind2<F, E, B>,
  ) => <C>(f: (a: A, b: B) => C) => Kind2<F, E, C>;

  readonly product: <A, B>(
    fa: Kind2<F, E, A>,
    fb: Kind2<F, E, B>,
  ) => Kind2<F, E, [A, B]>;

  readonly productL: <A, B>(
    fa: Kind2<F, E, A>,
    fb: Kind2<F, E, B>,
  ) => Kind2<F, E, A>;
  readonly productR: <A, B>(
    fa: Kind2<F, E, A>,
    fb: Kind2<F, E, B>,
  ) => Kind2<F, E, B>;
}

export interface Apply2<F> extends Functor2<F> {
  readonly ap: <E2, A, B>(
    ff: Kind2<F, E2, (a: A) => B>,
  ) => <E extends E2>(fa: Kind2<F, E, A>) => Kind2<F, E2, B>;

  readonly map2: <E, A, B>(
    fa: Kind2<F, E, A>,
    fb: Kind2<F, E, B>,
  ) => <C>(f: (a: A, b: B) => C) => Kind2<F, E, C>;

  readonly product: <E, A, B>(
    fa: Kind2<F, E, A>,
    fb: Kind2<F, E, B>,
  ) => Kind2<F, E, [A, B]>;

  readonly productL: <E, A, B>(
    fa: Kind2<F, E, A>,
    fb: Kind2<F, E, B>,
  ) => Kind2<F, E, A>;
  readonly productR: <E, A, B>(
    fa: Kind2<F, E, A>,
    fb: Kind2<F, E, B>,
  ) => Kind2<F, E, B>;
}
