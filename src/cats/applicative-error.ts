import { Auto, Kind } from '../core';
import { Either } from './data';
import { Applicative } from './applicative';

export interface ApplicativeError<F, E, C = Auto> extends Applicative<F, C> {
  readonly throwError: <S, R, E, A>(e: E) => Kind<F, C, S, R, E, A>;

  readonly handleError: <S, R, E2, B>(
    f: (a: E) => B,
  ) => <A extends B>(fa: Kind<F, C, S, R, E2, A>) => Kind<F, C, S, R, E2, B>;

  readonly handleErrorWith: <S, R, E2, B>(
    f: (a: E) => Kind<F, C, S, R, E2, B>,
  ) => <S, R, A extends B>(
    fa: Kind<F, C, S, R, E2, A>,
  ) => Kind<F, C, S, R, E2, B>;

  readonly attempt: <S, R, E2, A>(
    fa: Kind<F, C, S, R, E2, A>,
  ) => Kind<F, C, S, R, E2, Either<E, A>>;

  readonly redeem: <S, R, E2, A, B>(
    h: (e: E) => B,
    f: (a: A) => B,
  ) => (fa: Kind<F, C, S, R, E2, A>) => Kind<F, C, S, R, E2, B>;

  readonly redeemWith: <S, R, E2, A, B>(
    h: (e: E) => Kind<F, C, S, R, E2, B>,
    f: (a: A) => Kind<F, C, S, R, E2, B>,
  ) => (fa: Kind<F, C, S, R, E2, A>) => Kind<F, C, S, R, E2, B>;

  readonly onError: <S, R, E2>(
    h: (e: E) => Kind<F, C, S, R, E2, void>,
  ) => <A>(fa: Kind<F, C, S, R, E2, A>) => Kind<F, C, S, R, E2, A>;
}
