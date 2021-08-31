import { Kind } from '../fp/hkt';
import { Either } from './data';
import { Applicative } from './applicative';

export interface ApplicativeError<F, E> extends Applicative<F> {
  readonly throwError: <A>(e: E) => Kind<F, A>;

  readonly handleError: <B>(
    f: (a: E) => B,
  ) => <A extends B>(fa: Kind<F, A>) => Kind<F, B>;

  readonly handleErrorWith: <B>(
    f: (a: E) => Kind<F, B>,
  ) => <A extends B>(fa: Kind<F, A>) => Kind<F, B>;

  readonly attempt: <A>(fa: Kind<F, A>) => Kind<F, Either<E, A>>;

  readonly redeem: <A, B>(
    h: (e: E) => B,
    f: (a: A) => B,
  ) => (fa: Kind<F, A>) => Kind<F, B>;

  readonly redeemWith: <A, B>(
    h: (e: E) => Kind<F, B>,
    f: (a: A) => Kind<F, B>,
  ) => (fa: Kind<F, A>) => Kind<F, B>;

  readonly onError: (
    h: (e: E) => Kind<F, void>,
  ) => <A>(fa: Kind<F, A>) => Kind<F, A>;
}
