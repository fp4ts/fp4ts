// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either, EitherT, Eval, EvalF } from '@fp4ts/cats';
import { DecodeFailure } from '../decode-failure';
import { DecodeResultT } from './decode-result-t';

export type DecodeResult<A> = DecodeResultT<EvalF, A>;
export const DecodeResult: DecodeResultTObj = function (fa) {
  return EitherT(Eval.pure(fa));
};

DecodeResult.success = EitherT.right(Eval.Applicative);
DecodeResult.failure = EitherT.left(Eval.Applicative);

interface DecodeResultTObj {
  <A>(fa: Either<DecodeFailure, A>): DecodeResult<A>;

  success<A>(a: A): DecodeResult<A>;
  failure<A = never>(f: DecodeFailure): DecodeResult<A>;
}
