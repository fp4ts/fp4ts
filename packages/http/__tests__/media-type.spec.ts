// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Right } from '@fp4ts/cats';
import { MediaRange, MediaType } from '@fp4ts/http-core';

describe('MediaType', () => {
  function parseIdentity(mr: MediaType) {
    it(`should parse ${mr}`, () => {
      expect(MediaType.fromString(mr.toString())).toEqual(Right(mr));
    });
  }
  function parseFailure(mr: MediaRange) {
    it(`should media range as any main type ${mr}`, () => {
      expect(MediaType.fromString(mr.toString())).toEqual(
        Right(new MediaType(mr.mainType, '*')),
      );
    });
  }

  MediaType.all.forEach(parseIdentity);
  MediaRange.standard.forEach(parseFailure);
});
