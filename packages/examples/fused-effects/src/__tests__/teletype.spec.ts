// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Array } from '@fp4ts/cats';
import { StateT } from '@fp4ts/cats-mtl';
import { Algebra } from '@fp4ts/fused';
import { StateC, WriterC } from '@fp4ts/fused-std';
import { teletype } from '../teletype';
import { TeletypeTestC } from './teletype-test-c';

describe('Teletype', () => {
  const W = WriterC.WriterT(Algebra.Id, Array.MonoidK().algebra());
  const testTeleType = teletype(TeletypeTestC.Algebra(StateC.StateT(W)));
  it('should greet the user with their name', () => {
    expect(StateT.runAS(W)(testTeleType)(['James'])).toEqual([
      [undefined, []],
      ['What is your name?', 'Hello James!'],
    ]);
  });
});
