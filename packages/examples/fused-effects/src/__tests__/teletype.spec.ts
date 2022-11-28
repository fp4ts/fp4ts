// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Array } from '@fp4ts/cats';
import { Algebra } from '@fp4ts/fused';
import { StateC, WriterC } from '@fp4ts/fused-std';
import { teletype } from '../teletype';
import { TeletypeTestC } from './teletype-test-c';

describe('Teletype', () => {
  const testTeleType = teletype(
    TeletypeTestC.Algebra(
      StateC.Algebra(
        WriterC.Algebra(Algebra.Id, Array.MonoidK().algebra<string>()),
      ),
    ),
  );
  it('should greet the user with their name', () => {
    expect(testTeleType(['James'])).toEqual([
      [undefined, []],
      ['What is your name?', 'Hello James!'],
    ]);
  });
});
