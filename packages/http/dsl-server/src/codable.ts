// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either } from '@fp4ts/cats';
import { MessageFailure } from '@fp4ts/http-core';

export interface Codable<A> {
  encode: (a: A) => string;
  decode: (a: string) => Either<MessageFailure, A>;
}
