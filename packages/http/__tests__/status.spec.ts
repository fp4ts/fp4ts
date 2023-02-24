// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { id, throwError } from '@fp4ts/core';
import { Status } from '@fp4ts/http-core';
import { forAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/http-test-kit/lib/arbitraries';

describe('Status', () => {
  describe('native equality', () => {
    it(
      'should not be the same if the status are not equal',
      forAll(
        A.fp4tsStatus(),
        A.fp4tsStatus(),
        (s1, s2) => !(s1 !== s2) || s1 !== s2,
      ),
    );

    it(
      'should be the same if code is equal',
      forAll(A.fp4tsValidStatusCode(), code => {
        const s1 = getStatus(code);
        const s2 = getStatus(code);
        return s1 === s2;
      }),
    );
  });

  describe('native ordering', () => {
    it(
      'should be ordered by the code',
      forAll(
        A.fp4tsStatus(),
        A.fp4tsStatus(),
        (s1, s2) => !(s1.code < s2.code) || s1 < s2,
      ),
    );
  });

  it('should have 62 standard statuses registered in registered field', () => {
    expect(Status.registered.size).toBe(62);
  });

  it('should not have a non-standard status in the registered statuses', () => {
    getStatus(371);
    expect(Status.registered.size).toBe(62);
  });

  it(
    'should fail to find a status when the code is <MinCode',
    forAll(
      fc.integer({ min: Number.MIN_SAFE_INTEGER, max: Status.MinCode - 1 }),
      code => Status.fromCode(code).isLeft(),
    ),
  );

  it(
    'should fail to find a status when the code is >MaxCode',
    forAll(
      fc.integer({ min: Status.MaxCode + 1, max: Number.MAX_SAFE_INTEGER }),
      code => Status.fromCode(code).isLeft(),
    ),
  );

  const getStatus = (code: number): Status =>
    Status.fromCode(code).fold(throwError, id);
});
