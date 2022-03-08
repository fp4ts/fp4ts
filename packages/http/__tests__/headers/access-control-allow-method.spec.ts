// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eq } from '@fp4ts/cats';
import { AccessControlAllowMethod } from '@fp4ts/http-core';
import { HeaderSuite } from '@fp4ts/http-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/http-test-kit/lib/arbitraries';

const eq = Eq.of<AccessControlAllowMethod>({
  equals: (l, r) => {
    expect(l.method.methodName).toEqual(r.method.methodName);
    return true;
  },
});

const tests = HeaderSuite(
  AccessControlAllowMethod.Header,
  AccessControlAllowMethod.Select,
);
checkAll(
  'Access-Control-Request-Method',
  tests.header(
    A.fp4tsAccessControlAllowMethodHeader(),
    A.fp4tsAccessControlAllowMethodHeader(),
    eq,
    eq,
  ),
);
