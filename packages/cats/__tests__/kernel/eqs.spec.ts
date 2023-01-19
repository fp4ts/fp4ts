// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eq } from '@fp4ts/cats-kernel';
import { EqSuite } from '@fp4ts/cats-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('Eqs', () => {
  describe('primitive type', () => {
    checkAll(
      'Eq<PrimitiveType>',
      EqSuite(Eq.fromUniversalEquals()).eq(
        fc.oneof(fc.integer(), fc.string(), fc.bigInt()),
      ),
    );
  });

  describe('error strict', () => {
    checkAll('Eq<Error> strict', EqSuite(Eq.Error.strict).eq(A.fp4tsError()));
  });
});
