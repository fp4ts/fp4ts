// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Status } from '@fp4ts/http-core';
import fc, { Arbitrary } from 'fast-check';

export * from '@fp4ts/stream-test-kit/lib/arbitraries';

export const fp4tsValidStatusCode = (): Arbitrary<number> =>
  fc.integer({ min: Status.MinCode, max: Status.MaxCode });

export const fp4tsStatus = (): Arbitrary<Status> =>
  fp4tsValidStatusCode().map(code => Status.fromCodeUnsafe(code));
