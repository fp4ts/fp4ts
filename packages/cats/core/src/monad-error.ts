import { Kind } from '@cats4ts/core';
import { Monad, MonadRequirements } from './monad';
import {
  ApplicativeError,
  ApplicativeErrorRequirements,
} from './applicative-error';
import { Either } from './data';

/**
 * @category Type Class
 */
export interface MonadError<F, E> extends ApplicativeError<F, E>, Monad<F> {
  readonly redeemWith: <A, B>(
    h: (e: E) => Kind<F, [B]>,
    f: (a: A) => Kind<F, [B]>,
  ) => (fa: Kind<F, [A]>) => Kind<F, [B]>;
  readonly redeemWith_: <A, B>(
    fa: Kind<F, [A]>,
    h: (e: E) => Kind<F, [B]>,
    f: (a: A) => Kind<F, [B]>,
  ) => Kind<F, [B]>;

  readonly rethrow: <A, EE extends E>(
    fea: Kind<F, [Either<EE, A>]>,
  ) => Kind<F, [A]>;

  readonly attemptTap: <A, B>(
    f: (ea: Either<E, A>) => Kind<F, [B]>,
  ) => (fa: Kind<F, [A]>) => Kind<F, [A]>;
  readonly attemptTap_: <A, B>(
    fa: Kind<F, [A]>,
    f: (ea: Either<E, A>) => Kind<F, [B]>,
  ) => Kind<F, [A]>;
}

export type MonadErrorRequirements<F, E> = MonadRequirements<F> &
  ApplicativeErrorRequirements<F, E> &
  Partial<MonadError<F, E>>;

export const MonadError = Object.freeze({
  of: <F, E>(F: MonadErrorRequirements<F, E>): MonadError<F, E> => {
    const self: MonadError<F, E> = {
      redeemWith: (h, f) => fa => self.redeemWith_(fa, h, f),
      redeemWith_: (fa, h, f) =>
        self.flatMap_(self.attempt(fa), ea => ea.fold(h, f)),

      rethrow: fea =>
        self.flatMap_(fea, ea => ea.fold(self.throwError, self.pure)),

      attemptTap: f => fa => self.attemptTap_(fa, f),
      attemptTap_: (fa, f) => self.rethrow(self.flatTap_(self.attempt(fa), f)),

      ...ApplicativeError.of({ ...F }),
      ...Monad.of({ ...F }),
      ...F,
    };
    return self;
  },
});
