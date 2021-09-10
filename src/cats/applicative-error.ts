import { Auto, Kind } from '../core';
import { Either } from './data';
import { Applicative } from './applicative';

export interface ApplicativeError<F, E, C = Auto> extends Applicative<F, C> {
  readonly throwError: <S, R, A>(e: E) => Kind<F, C, S, R, E, A>;

  readonly handleError: <S, R, B>(
    f: (a: E) => B,
  ) => <A extends B>(fa: Kind<F, C, S, R, E, A>) => Kind<F, C, S, R, E, B>;

  readonly handleErrorWith: <S, R, B>(
    f: (a: E) => Kind<F, C, S, R, E, B>,
  ) => <S, R, A extends B>(
    fa: Kind<F, C, S, R, E, A>,
  ) => Kind<F, C, S, R, E, B>;

  readonly attempt: <S, R, A>(
    fa: Kind<F, C, S, R, E, A>,
  ) => Kind<F, C, S, R, E, Either<E, A>>;

  readonly redeem: <S, R, A, B>(
    h: (e: E) => B,
    f: (a: A) => B,
  ) => (fa: Kind<F, C, S, R, E, A>) => Kind<F, C, S, R, E, B>;

  readonly redeemWith: <S, R, A, B>(
    h: (e: E) => Kind<F, C, S, R, E, B>,
    f: (a: A) => Kind<F, C, S, R, E, B>,
  ) => (fa: Kind<F, C, S, R, E, A>) => Kind<F, C, S, R, E, B>;

  readonly onError: <S, R>(
    h: (e: E) => Kind<F, C, S, R, E, void>,
  ) => <A>(fa: Kind<F, C, S, R, E, A>) => Kind<F, C, S, R, E, A>;
}
