// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either } from '@fp4ts/cats';
import { DecodeFailure } from '@fp4ts/schema';

export const FromHttpApiDataTag = '@fp4ts/http/dsl/from-htt-api-data';
export type FromHttpApiDataTag = typeof FromHttpApiDataTag;

export interface FromHttpApiData<A> {
  fromPathComponent(x: string): Either<DecodeFailure, A>;
  fromQueryParameter(x: string): Either<DecodeFailure, A>;
  parseHeader(x: string): Either<DecodeFailure, A>;
}

export const FromHttpApiData = Object.freeze({
  fromUniversal: <A>(
    f: (x: string) => Either<DecodeFailure, A>,
  ): FromHttpApiData<A> => ({
    fromPathComponent: f,
    fromQueryParameter: f,
    parseHeader: f,
  }),
});
