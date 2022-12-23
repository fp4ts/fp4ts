// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { EvalF } from '@fp4ts/core';
import { Either, Monad } from '@fp4ts/cats';
import { DecodeFailure } from '../decode-failure';
import { DecodeResultT } from './decode-result-t';

export type DecodeResult<A> = Either<DecodeFailure, A>;
export const DecodeResult: DecodeResultTObj = function (fa) {
  return fa;
};

DecodeResult.success = DecodeResultT.success(Monad.Eval);
DecodeResult.failure = DecodeResultT.failure(Monad.Eval);

interface DecodeResultTObj {
  <A>(fa: Either<DecodeFailure, A>): DecodeResult<A>;

  success<A>(a: A): DecodeResultT<EvalF, A>;
  failure<A = never>(f: DecodeFailure): DecodeResultT<EvalF, A>;
}
