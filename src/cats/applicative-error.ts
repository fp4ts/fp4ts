import { Auto, Intro, Kind, Mix, URIS } from '../core';
import { Either } from './data';
import { Applicative } from './applicative';

export interface ApplicativeError<F extends URIS, E, C = Auto>
  extends Applicative<F, C> {
  readonly throwError: <S, R, A>(e: E) => Kind<F, C, S, R, E, A>;

  readonly handleError: <S, R, B>(
    f: (a: E) => B,
  ) => <A extends B>(fa: Kind<F, C, S, R, E, A>) => Kind<F, C, S, R, E, B>;

  readonly handleErrorWith: <S2, R2, B>(
    f: (a: E) => Kind<F, C, S2, R2, E, B>,
  ) => <S, R, A extends B>(
    fa: Kind<F, C, Intro<C, 'S', S2, S>, Intro<C, 'S', R2, R>, E, A>,
  ) => Kind<F, C, Mix<C, 'S', [S2, S]>, Mix<C, 'R', [R2, R]>, E, B>;

  readonly attempt: <S, R, A>(
    fa: Kind<F, C, S, R, E, A>,
  ) => Kind<F, C, S, R, E, Either<E, A>>;

  readonly redeem: <A, B>(
    h: (e: E) => B,
    f: (a: A) => B,
  ) => <S, R>(fa: Kind<F, C, S, R, E, A>) => Kind<F, C, S, R, E, B>;

  readonly redeemWith: <S2, R2, A, B>(
    h: (e: E) => Kind<F, C, S2, R2, E, B>,
    f: (a: A) => Kind<F, C, S2, R2, E, B>,
  ) => <S, R>(
    fa: Kind<F, C, Intro<C, 'S', S2, S>, Intro<C, 'R', R2, R>, E, A>,
  ) => Kind<F, C, Mix<C, 'S', [S2, S]>, Mix<C, 'R', [R2, R]>, E, B>;

  readonly onError: <S2, R2>(
    h: (e: E) => Kind<F, C, S2, R2, E, void>,
  ) => <S, R, A>(
    fa: Kind<F, C, Intro<C, 'S', S2, S>, Intro<C, 'R', R2, R>, E, A>,
  ) => Kind<F, C, Mix<C, 'S', [S2, S]>, Mix<C, 'R', [R2, R]>, E, A>;
}
