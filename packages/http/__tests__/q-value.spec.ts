// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { QValue } from '@fp4ts/http-core';
import { forAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/http-test-kit/lib/arbitraries';

describe('q-value', () => {
  test(
    'toString, parse identity',
    forAll(
      A.fp4tsQValue(),
      q => QValue.parser.parse(QValue.toString(q)).get === q,
    ),
  );
});
