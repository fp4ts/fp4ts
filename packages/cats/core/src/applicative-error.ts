// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { instance, Kind, pipe } from '@fp4ts/core';
import { Applicative, ApplicativeRequirements } from './applicative';
import { Either, Right, Left } from './data';

/**
 * @category Type Class
 */
export interface ApplicativeError<F, E> extends Applicative<F> {
  readonly _E: E;

  readonly throwError: <A = never>(e: E) => Kind<F, [A]>;

  readonly handleError: <A>(
    f: (a: E) => A,
  ) => (fa: Kind<F, [A]>) => Kind<F, [A]>;
  readonly handleError_: <A>(fa: Kind<F, [A]>, f: (a: E) => A) => Kind<F, [A]>;

  readonly handleErrorWith: <A>(
    f: (a: E) => Kind<F, [A]>,
  ) => (fa: Kind<F, [A]>) => Kind<F, [A]>;
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

  readonly fromEither: <A>(ea: Either<E, A>) => Kind<F, [A]>;
}

export type ApplicativeErrorRequirements<F, E> = Pick<
  ApplicativeError<F, E>,
  'throwError' | 'handleErrorWith_'
> &
  ApplicativeRequirements<F> &
  Partial<ApplicativeError<F, E>>;

export const ApplicativeError = Object.freeze({
  of: <F, E>(F: ApplicativeErrorRequirements<F, E>): ApplicativeError<F, E> => {
    const self: ApplicativeError<F, E> = instance<ApplicativeError<F, E>>({
      handleError: f => fa => self.handleError_(fa, f),
      handleError_: (fa, f) => self.handleErrorWith_(fa, e => self.pure(f(e))),

      handleErrorWith: f => fa => self.handleErrorWith_(fa, f),

      attempt: fa =>
        pipe(
          fa,
          self.map(x => Right(x)),
          self.handleError(e => Left(e)),
        ),

      redeem: (h, f) => fa => self.redeem_(fa, h, f),
      redeem_: (fa, h, f) => pipe(fa, self.map(f), self.handleError(h)),

      onError: h => fa => self.onError_(fa, h),
      onError_: (fa, h) =>
        self.handleErrorWith_(fa, e =>
          self.productR_(h(e), self.throwError(e)),
        ),

      fromEither: ea => ea.fold(self.throwError, self.pure),

      ...Applicative.of(F),
      ...F,
    });
    return self;
  },
});
