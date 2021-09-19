import { AnyK, Kind } from '../core';
import { Monad, MonadRequirements } from './monad';
import {
  ApplicativeError,
  ApplicativeErrorRequirements,
} from './applicative-error';

export interface MonadError<F extends AnyK, E>
  extends ApplicativeError<F, E>,
    Monad<F> {
  readonly redeemWith: <A, B>(
    h: (e: E) => Kind<F, [B]>,
    f: (a: A) => Kind<F, [B]>,
  ) => (fa: Kind<F, [A]>) => Kind<F, [B]>;
  readonly redeemWith_: <A, B>(
    fa: Kind<F, [A]>,
    h: (e: E) => Kind<F, [B]>,
    f: (a: A) => Kind<F, [B]>,
  ) => Kind<F, [B]>;
}

export type MonadErrorRequirements<F extends AnyK, E> = MonadRequirements<F> &
  ApplicativeErrorRequirements<F, E> &
  Partial<MonadError<F, E>>;

export const MonadError = Object.freeze({
  of: <F extends AnyK, E>(
    F: MonadErrorRequirements<F, E>,
  ): MonadError<F, E> => {
    const self: MonadError<F, E> = {
      redeemWith: (h, f) => fa => self.redeemWith_(fa, h, f),
      redeemWith_: (fa, h, f) =>
        self.flatMap_(self.attempt(fa), ea => ea.fold(h, f)),

      ...ApplicativeError.of({ ...F }),
      ...Monad.of({ ...F }),
      ...F,
    };
    return self;
  },
});
