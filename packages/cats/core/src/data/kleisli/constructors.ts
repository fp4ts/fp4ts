import { AnyK, Kind } from '@cats4ts/core';
import { Applicative } from '../../applicative';

import { Kleisli } from './algebra';

export const pure =
  <F extends AnyK>(F: Applicative<F>) =>
  <B>(x: B): Kleisli<F, unknown, B> =>
    new Kleisli(() => F.pure(x));

export const unit = <F extends AnyK>(
  F: Applicative<F>,
): Kleisli<F, unknown, void> => pure(F)(undefined);

export const liftF = <F extends AnyK, B>(
  fb: Kind<F, [B]>,
): Kleisli<F, unknown, B> => suspend(() => fb);

export const suspend = <F extends AnyK, A, B>(
  f: (a: A) => Kind<F, [B]>,
): Kleisli<F, A, B> => new Kleisli(f);

export const identity = <F extends AnyK, A>(
  F: Applicative<F>,
): Kleisli<F, A, A> => new Kleisli(F.pure);
