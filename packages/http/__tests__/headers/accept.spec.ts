// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eq } from '@fp4ts/cats';
import { Accept } from '@fp4ts/http-core';
import { HeaderSuite } from '@fp4ts/http-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/http-test-kit/lib/arbitraries';

const eq = Eq.of<Accept>({
  equals: (ls, rs) => {
    if (ls.values.size !== rs.values.size) return false;
    ls.values.zipWith(rs.values, (l, r) => {
      expect(l.qValue).toEqual(r.qValue);
      expect(l.mediaRange.mainType).toBe(r.mediaRange.mainType);
      expect(l.mediaRange.extensions.toArray).toEqual(
        l.mediaRange.extensions.toArray,
      );
    });
    return true;
  },
});

const tests = HeaderSuite(Accept.Header, Accept.Select);
checkAll(
  'Accept Header',
  tests.header(A.fp4tsAcceptHeader(), A.fp4tsAcceptHeader(), eq, eq),
);
