// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Right } from '@fp4ts/cats';
import { MediaRange, MediaType } from '@fp4ts/http-core';

describe('MediaRange', () => {
  function parseIdentity(mr: MediaRange) {
    it(`should parse ${mr}`, () => {
      expect(MediaRange.fromString(mr.toString())).toEqual(Right(mr));
    });
  }

  MediaRange.standard.forEach(parseIdentity);
  MediaType.all.forEach(parseIdentity);
});
