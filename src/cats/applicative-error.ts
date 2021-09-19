import { Kind, AnyK, pipe } from '../core';
import { Either, Right, Left } from './data';
import { Applicative, ApplicativeRequirements } from './applicative';

export interface ApplicativeError<F extends AnyK, E> extends Applicative<F> {
  readonly throwError: <A>(e: E) => Kind<F, [A]>;

  readonly handleError: <B>(
    f: (a: E) => B,
  ) => <A extends B>(fa: Kind<F, [A]>) => Kind<F, [B]>;
  readonly handleError_: <A>(fa: Kind<F, [A]>, f: (a: E) => A) => Kind<F, [A]>;

  readonly handleErrorWith: <B>(
    f: (a: E) => Kind<F, [B]>,
  ) => <A extends B>(fa: Kind<F, [A]>) => Kind<F, [B]>;
  readonly handleErrorWith_: <A>(
    fa: Kind<F, [A]>,
    f: (a: E) => Kind<F, [A]>,
  ) => Kind<F, [A]>;

  readonly attempt: <A>(fa: Kind<F, [A]>) => Kind<F, [Either<E, A>]>;

  readonly redeem: <A, B>(
    h: (e: E) => B,
    f: (a: A) => B,
  ) => (fa: Kind<F, [A]>) => Kind<F, [B]>;
  readonly redeem_: <A, B>(
    fa: Kind<F, [A]>,
    h: (e: E) => B,
    f: (a: A) => B,
  ) => Kind<F, [B]>;

  readonly onError: (
    h: (e: E) => Kind<F, [void]>,
  ) => <A>(fa: Kind<F, [A]>) => Kind<F, [A]>;
  readonly onError_: <A>(
    fa: Kind<F, [A]>,
    h: (e: E) => Kind<F, [void]>,
  ) => Kind<F, [A]>;
}

export type ApplicativeErrorRequirements<F extends AnyK, E> = Pick<
  ApplicativeError<F, E>,
  'throwError' | 'handleErrorWith_'
> &
  ApplicativeRequirements<F> &
  Partial<ApplicativeError<F, E>>;

export const ApplicativeError = Object.freeze({
  of: <F extends AnyK, E>(
    F: ApplicativeErrorRequirements<F, E>,
  ): ApplicativeError<F, E> => {
    const self: ApplicativeError<F, E> = {
      handleError: f => fa => self.handleError_(fa, f),
      handleError_: (fa, f) => self.handleErrorWith_(fa, e => self.pure(f(e))),

      handleErrorWith: f => fa => self.handleErrorWith_(fa, f),

      attempt: fa => pipe(fa, self.map(Right), self.handleError(Left)),

      redeem: (h, f) => fa => self.redeem_(fa, h, f),
      redeem_: (fa, h, f) => pipe(fa, self.map(f), self.handleError(h)),

      onError: h => fa => self.onError_(fa, h),
      onError_: (fa, h) =>
        self.handleErrorWith_(fa, e =>
          self.productR_(h(e), self.throwError(e)),
        ),

      ...Applicative.of(F),
      ...F,
    };
    return self;
  },
});
