import { Either } from '../fp/either';
import { Kind } from '../fp/hkt';
import { Applicative } from './applicative';

export interface ApplicativeError<F, E> extends Applicative<F> {
  readonly throwError: <A>(e: E) => Kind<F, A>;

  readonly handleError: <A>(
    fa: Kind<F, A>,
  ) => <B>(f: (a: E) => B) => Kind<F, A | B>;

  readonly handleErrorWith: <A>(
    fa: Kind<F, A>,
  ) => <B>(f: (a: E) => Kind<F, B>) => Kind<F, A | B>;

  readonly attempt: <A>(fa: Kind<F, A>) => Kind<F, Either<E, A>>;

  readonly redeem: <A>(
    fa: Kind<F, A>,
  ) => <B>(h: (e: E) => B, f: (a: A) => B) => Kind<F, B>;

  readonly redeemWith: <A>(
    fa: Kind<F, A>,
  ) => <B>(h: (e: E) => Kind<F, B>, f: (a: A) => Kind<F, B>) => Kind<F, B>;

  readonly onError: <A>(
    fa: Kind<F, A>,
  ) => (h: (e: E) => Kind<F, void>) => Kind<F, A>;
}
