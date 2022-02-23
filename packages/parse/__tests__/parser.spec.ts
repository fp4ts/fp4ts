// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eq, Left, List, Right } from '@fp4ts/cats';
import { ParseError, SourcePosition } from '@fp4ts/parse-core';
import { anyChar } from '@fp4ts/parse-text';
import { forAll } from '@fp4ts/cats-test-kit';

describe('Parser', () => {
  it('should parse a single character from a string', () => {
    expect(anyChar.parse('x')).toEqual(Right('x'));
  });

  it('should fail to parse a single character when the input is empty', () => {
    expect(anyChar.parse('')).toEqual(
      Left(new ParseError(new SourcePosition(0, 0), [expect.any(String)])),
    );
  });

  it('should consume two characters from the input', () => {
    expect(anyChar.product(anyChar).parse('xyz')).toEqual(Right(['x', 'y']));
  });

  describe('rep', () => {
    it('should succeed to parse an empty input', () => {
      expect(anyChar.rep().parse('')).toEqual(Right(List.empty));
    });

    it(
      'should all of the characters from the input',
      forAll(fc.string(), s =>
        anyChar
          .rep()
          .parse(s)
          .get.equals(Eq.primitive, List.fromArray(s.split(''))),
      ),
    );

    it('should be stack safe', () => {
      const input = 'x'.repeat(1_000_000);
      expect(anyChar.rep().parse(input).isRight).toBe(true);
    });
  });

  describe('rep1', () => {
    it('should fail to parse an empty input', () => {
      expect(anyChar.rep1().parse('').isLeft).toBe(true);
    });

    it(
      'should all of the characters from the input and succeed only if the input is non-empty',
      forAll(fc.string(), s =>
        s !== ''
          ? anyChar
              .rep1()
              .parse(s)
              .get.equals(Eq.primitive, List.fromArray(s.split('')))
          : anyChar.rep1().parse(s).isLeft,
      ),
    );

    it('should be stack safe', () => {
      const input = 'x'.repeat(1_000_000);
      expect(anyChar.rep1().parse(input).isRight).toBe(true);
    });
  });
});
