import { AnyK, Kind } from '../../../core';
import { Identity, Kleisli, Pure, Suspend } from './algebra';

export const pure = <F extends AnyK, B>(x: B): Kleisli<F, unknown, B> =>
  new Pure(x);

export const unit = <F extends AnyK>(): Kleisli<F, unknown, void> =>
  pure(undefined);

export const liftF = <F extends AnyK, B>(
  fb: Kind<F, [B]>,
): Kleisli<F, unknown, B> => suspend(() => fb);

export const suspend = <F extends AnyK, A, B>(
  f: (a: A) => Kind<F, [B]>,
): Kleisli<F, A, B> => new Suspend(f);

export const identity = <F extends AnyK, A>(): Kleisli<F, A, A> =>
  new Identity();
