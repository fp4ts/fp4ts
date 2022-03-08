// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eq } from '@fp4ts/cats';
import { ContentLength } from '@fp4ts/http-core';
import { HeaderSuite } from '@fp4ts/http-laws';
import { checkAll } from '@fp4ts/cats-test-kit';

const tests = HeaderSuite(ContentLength.Header, ContentLength.Select);
checkAll(
  'Content-Length Header',
  tests.header(
    fc
      .integer()
      .filter(l => l >= 0)
      .map(l => new ContentLength(l)),
    fc
      .integer()
      .filter(l => l >= 0)
      .map(l => new ContentLength(l)),
    Eq.by(Eq.primitive, ({ length }) => length),
    Eq.by(Eq.primitive, ({ length }) => length),
  ),
);
