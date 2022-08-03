// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit/lib/jest-extension';
import fc from 'fast-check';
import { None, Some } from '@fp4ts/cats';
import { forAll } from '@fp4ts/cats-test-kit';

import { GenUUID, UUID } from '../uuid';

describe('UUID', () => {
  it(
    'should wrap a valid UUID',
    forAll(fc.uuid(), text => expect(UUID(text)).toEqual(Some(text))),
  );

  it('should return None on an empty string', () => {
    expect(UUID('')).toEqual(None);
  });

  it('should return None on a UUID without dashes', () => {
    expect(UUID('4d3433e809a111ed861d0242ac120002')).toEqual(None);
  });

  it.M('should generate a valid UUID', () =>
    GenUUID.IO.genUUID().map(uuid =>
      expect(Some(uuid)).toEqual(UUID(UUID.toString(uuid))),
    ),
  );
});
