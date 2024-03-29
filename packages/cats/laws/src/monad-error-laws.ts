// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { MonadError } from '@fp4ts/cats-core';
import { IsEq } from '@fp4ts/cats-test-kit';
import { Kind } from '@fp4ts/core';
import { ApplicativeErrorLaws } from './applicative-error-laws';
import { MonadLaws } from './monad-laws';

export const MonadErrorLaws = <F, E>(
  F: MonadError<F, E>,
): MonadErrorLaws<F, E> => ({
  ...ApplicativeErrorLaws(F),
  ...MonadLaws(F),

  monadErrorLeftZero: <A, B>(
    e: E,
    f: (a: A) => Kind<F, [B]>,
  ): IsEq<Kind<F, [B]>> =>
    new IsEq(F.flatMap_(F.throwError<A>(e), f), F.throwError<B>(e)),

  rethrowAttempt: <A>(fa: Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    new IsEq(F.rethrow(F.attempt(fa)), fa),

  redeemWithDerivedFromAttemptFlatMap: <A, B>(
    fa: Kind<F, [A]>,
    h: (e: E) => Kind<F, [B]>,
    f: (a: A) => Kind<F, [B]>,
  ): IsEq<Kind<F, [B]>> =>
    new IsEq(
      F.redeemWith_(fa, h, f),
      F.flatMap_(F.attempt(fa), ea => ea.fold(h, f)),
    ),
});

export interface MonadErrorLaws<F, E>
  extends ApplicativeErrorLaws<F, E>,
    MonadLaws<F> {
  monadErrorLeftZero: <A, B>(
    e: E,
    f: (a: A) => Kind<F, [B]>,
  ) => IsEq<Kind<F, [B]>>;

  rethrowAttempt: <A>(fa: Kind<F, [A]>) => IsEq<Kind<F, [A]>>;

  redeemWithDerivedFromAttemptFlatMap: <A, B>(
    fa: Kind<F, [A]>,
    h: (e: E) => Kind<F, [B]>,
    f: (a: A) => Kind<F, [B]>,
  ) => IsEq<Kind<F, [B]>>;
}
