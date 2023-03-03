// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eq } from '@fp4ts/cats-kernel';
import { checkAll } from '@fp4ts/cats-test-kit';
import { iso } from '@fp4ts/optics-core';
import { IsoSuite } from '@fp4ts/optics-laws';

describe('Iso', () => {
  checkAll(
    'Iso<number, number>',
    IsoSuite(iso<number>()).iso(
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
    ),
  );

  // should fail
  // const badIso = iso<string, number>(parseInt, x => x.toString());
  // checkAll(
  //   'Iso<string, number>',
  //   IsoSuite(badIso).iso(
  //     fc.string(),
  //     fc.integer(),
  //     Eq.fromUniversalEquals(),
  //     Eq.fromUniversalEquals(),
  //   ),
  // );
});
