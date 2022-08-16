// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Stream } from '@fp4ts/stream-core';

describe('CompilerOps', () => {
  describe('head', () => {
    it('should throw an error when the stream is empty', () => {
      expect(() => Stream.empty().compile().head).toThrow();
    });

    it('should return head element of the singleton stream', () => {
      expect(Stream(1).compile().head).toBe(1);
    });

    it('should return first element of the stream', () => {
      expect(Stream(1, 2, 3).compile().head).toBe(1);
      expect(Stream(1, 2, 3).flatMap(Stream).compile().head).toBe(1);
    });
  });

  describe('last', () => {
    it('should throw an error when the stream is empty', () => {
      expect(() => Stream.empty().compile().last).toThrow();
    });

    it('should return last element of the singleton stream', () => {
      expect(Stream(1).compile().last).toBe(1);
    });

    it('should return last element of the stream', () => {
      expect(Stream(1, 2, 3).compile().last).toBe(3);
      expect(Stream(1, 2, 3).flatMap(Stream).compile().last).toBe(3);
    });
  });
});
