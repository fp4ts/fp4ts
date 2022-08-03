// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { None, Some } from '@fp4ts/cats';
import { forAll } from '@fp4ts/cats-test-kit';
import { Email } from '../email';

describe('Email', () => {
  it(
    'should return a validated email from text',
    forAll(fc.emailAddress(), email =>
      expect(Email(email)).toEqual(Some(email)),
    ),
  );

  it('should fail to produce email for an empty string', () => {
    expect(Email('')).toEqual(None);
  });

  it('should fail to produce email for an username:password', () => {
    expect(Email('username:password')).toEqual(None);
  });

  it('should fail to produce email for an a url without @', () => {
    expect(Email('example.com')).toEqual(None);
  });
});
