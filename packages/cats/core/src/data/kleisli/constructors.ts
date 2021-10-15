import { Kind } from '@cats4ts/core';
import { Applicative } from '../../applicative';

import { Kleisli } from './algebra';

export const pure =
  <F>(F: Applicative<F>) =>
  <B>(x: B): Kleisli<F, unknown, B> =>
    new Kleisli(() => F.pure(x));

export const unit = <F>(F: Applicative<F>): Kleisli<F, unknown, void> =>
  pure(F)(undefined);

export const liftF = <F, B>(fb: Kind<F, [B]>): Kleisli<F, unknown, B> =>
  suspend(() => fb);

export const suspend = <F, A, B>(f: (a: A) => Kind<F, [B]>): Kleisli<F, A, B> =>
  new Kleisli(f);

export const identity = <F, A>(F: Applicative<F>): Kleisli<F, A, A> =>
  new Kleisli(F.pure);
