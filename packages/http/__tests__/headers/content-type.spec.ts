// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eq } from '@fp4ts/cats';
import { ContentType } from '@fp4ts/http-core';
import { HeaderSuite } from '@fp4ts/http-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/http-test-kit/lib/arbitraries';

const eq = Eq.of<ContentType>({
  equals: (l, r) => {
    expect(l.mediaType.mainType).toEqual(r.mediaType.mainType);
    expect(l.mediaType.subType).toBe(r.mediaType.subType);
    expect(l.mediaType.extensions.toArray).toEqual(
      l.mediaType.extensions.toArray,
    );
    return true;
  },
});

const tests = HeaderSuite(ContentType.Header, ContentType.Select);
checkAll(
  'Content-Type Header',
  tests.header(A.fp4tsContentTypeHeader(), A.fp4tsContentTypeHeader(), eq, eq),
);
