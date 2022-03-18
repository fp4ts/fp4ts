// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either, Left, Right } from '@fp4ts/cats';
import { DecodeFailure } from '../decode-failure';

export type DecodeResult<A> = Either<DecodeFailure, A>;
export const DecodeResult: DecodeResultTObj = function (fa) {
  return fa;
};

DecodeResult.success = Right;
DecodeResult.failure = Left;

interface DecodeResultTObj {
  <A>(fa: Either<DecodeFailure, A>): DecodeResult<A>;

  success<A>(a: A): DecodeResult<A>;
  failure<A = never>(f: DecodeFailure): DecodeResult<A>;
}
