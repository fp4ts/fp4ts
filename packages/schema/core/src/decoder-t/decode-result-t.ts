// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Applicative, Either, EitherT, Functor } from '@fp4ts/cats';
import { DecodeFailure } from '../decode-failure';

export type DecodeResultT<F, A> = EitherT<F, DecodeFailure, A>;
export const DecodeResultT: DecodeResultTObj = function (fa) {
  return EitherT(fa);
};

DecodeResultT.success = EitherT.right;
DecodeResultT.successT = EitherT.rightT;
DecodeResultT.failure = EitherT.left;
DecodeResultT.failureT = EitherT.leftT;

interface DecodeResultTObj {
  <F, A>(fa: Kind<F, [Either<DecodeFailure, A>]>): DecodeResultT<F, A>;

  success<F>(F: Applicative<F>): <A>(a: A) => DecodeResultT<F, A>;
  successT<F>(F: Functor<F>): <A>(fa: Kind<F, [A]>) => DecodeResultT<F, A>;

  failure<F>(
    F: Applicative<F>,
  ): <A = never>(f: DecodeFailure) => DecodeResultT<F, A>;
  failureT<F>(
    F: Functor<F>,
  ): <A = never>(f: Kind<F, [DecodeFailure]>) => DecodeResultT<F, A>;
}
