// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Ord } from '@fp4ts/cats-kernel';
import { OrdSuite } from '@fp4ts/cats-kernel-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import fc from 'fast-check';

describe('Ords', () => {
  checkAll(
    'Ord<number>',
    OrdSuite(Ord.fromUniversalCompare<number>()).ord(fc.integer()),
  );
  checkAll(
    'Ord<bigint>',
    OrdSuite(Ord.fromUniversalCompare<bigint>()).ord(fc.bigInt()),
  );
  checkAll(
    'Ord<string>',
    OrdSuite(Ord.fromUniversalCompare<string>()).ord(fc.string()),
  );
});
