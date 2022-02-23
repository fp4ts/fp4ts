// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Char, id } from '@fp4ts/core';
import { Eq, Left, List, Right, Some } from '@fp4ts/cats';
import {
  ParseError,
  Parser,
  SourcePosition,
  StringSource,
} from '@fp4ts/parse-core';
import { forAll } from '@fp4ts/cats-test-kit';

describe('Parser', () => {
  const singleCharP = Parser.unconsPrim<StringSource, Char>(
    id,
    (sp, t) =>
      t === '\n'
        ? new SourcePosition(sp.line + 1, 0)
        : new SourcePosition(sp.line, sp.column + 1),
    Some,
  );

  it('should parse a single character from a string', () => {
    expect(singleCharP.parse('x')).toEqual(Right('x'));
  });

  it('should fail to parse a single character when the input is empty', () => {
    expect(singleCharP.parse('')).toEqual(
      Left(new ParseError(new SourcePosition(0, 0), [expect.any(String)])),
    );
  });

  it('should consume two characters from the input', () => {
    expect(singleCharP.product(singleCharP).parse('xyz')).toEqual(
      Right(['x', 'y']),
    );
  });

  describe('rep', () => {
    it('should succeed to parse an empty input', () => {
      expect(singleCharP.rep().parse('')).toEqual(Right(List.empty));
    });

    it(
      'should all of the characters from the input',
      forAll(fc.string(), s =>
        singleCharP
          .rep()
          .parse(s)
          .get.equals(Eq.primitive, List.fromArray(s.split(''))),
      ),
    );

    it('should be stack safe', () => {
      const input = 'x'.repeat(1_000_000);
      expect(singleCharP.rep().parse(input).isRight).toBe(true);
    });
  });

  describe('rep1', () => {
    it('should fail to parse an empty input', () => {
      expect(singleCharP.rep1().parse('').isLeft).toBe(true);
    });

    it(
      'should all of the characters from the input and succeed only if the input is non-empty',
      forAll(fc.string(), s =>
        s !== ''
          ? singleCharP
              .rep1()
              .parse(s)
              .get.equals(Eq.primitive, List.fromArray(s.split('')))
          : singleCharP.rep1().parse(s).isLeft,
      ),
    );

    it('should be stack safe', () => {
      const input = 'x'.repeat(1_000_000);
      expect(singleCharP.rep1().parse(input).isRight).toBe(true);
    });
  });
});
