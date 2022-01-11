// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either } from '@fp4ts/cats';
import { MessageFailure } from '@fp4ts/http-core';

export const FromHttpApiDataTag = Symbol('@fp4ts/http/dsl/from-htt-api-data');
export type FromHttpApiDataTag = typeof FromHttpApiDataTag;

export interface FromHttpApiData<A> {
  fromPathComponent(x: string): Either<MessageFailure, A>;
  fromQueryParameter(x: string): Either<MessageFailure, A>;
}

export const FromHttpApiData = Object.freeze({
  fromUniversal: <A>(
    f: (x: string) => Either<MessageFailure, A>,
  ): FromHttpApiData<A> => ({
    fromPathComponent: f,
    fromQueryParameter: f,
  }),
});
