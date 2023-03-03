// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { forAll } from '@fp4ts/cats-test-kit';
import { reuses, reviews, to, un, unto } from '@fp4ts/optics-core';
import { Reader, State } from '@fp4ts/mtl-core';
import { id } from '@fp4ts/core';

describe('Review', () => {
  test(
    'unto is un . to',
    forAll(fc.integer(), x =>
      expect(
        unto((x: number) => String(x))
          .apply(reuses(State.MonadState<number>()))(id)
          .runStateA(x),
      ).toEqual(
        un(to((x: string) => parseInt(x)))
          .apply(reviews(Reader.MonadReader<string>()))(String)
          .runReader(String(x)),
      ),
    ),
  );
});
