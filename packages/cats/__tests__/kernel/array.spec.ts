// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eq, Monoid, Ord } from '@fp4ts/cats-kernel';
import { MonoidSuite, OrdSuite } from '@fp4ts/cats-kernel-laws';
import { checkAll } from '@fp4ts/cats-test-kit';

describe('Array instances', () => {
  checkAll(
    'Ord<Array<string>>',
    OrdSuite(Ord.Array(Ord.fromUniversalCompare<string>())).ord(
      fc.array(fc.string()),
    ),
  );

  checkAll(
    'Monoid<Array<number>>',
    MonoidSuite(Monoid.Array<number>()).monoid(
      fc.array(fc.integer()),
      Eq.Array(Eq.fromUniversalEquals()),
    ),
  );
});
