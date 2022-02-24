// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Char } from '@fp4ts/core';
import { Eq, Left, List, Right } from '@fp4ts/cats';
import {
  Parser,
  ParseError,
  SourcePosition,
  StringSource,
} from '@fp4ts/parse-core';
import {
  anyChar,
  char,
  digit,
  parens,
  spaces,
  string,
} from '@fp4ts/parse-text';
import { forAll } from '@fp4ts/cats-test-kit';

describe('Parser', () => {
  it('should parse a single character from a string', () => {
    expect(anyChar.parse('x')).toEqual(Right('x'));
  });

  it('should fail to parse a single character when the input is empty', () => {
    expect(anyChar.parse('')).toEqual(
      Left(new ParseError(new SourcePosition(1, 1), [expect.any(Object)])),
    );
  });

  it('should consume two characters from the input', () => {
    expect(anyChar.product(anyChar).parse('xyz')).toEqual(Right(['x', 'y']));
  });

  describe('flatMap', () => {
    it('should recover when the initial parser does not consume any input', () => {
      expect(
        char('x' as Char)
          .flatMap(() => Parser.succeed(42))
          .orElse(() => Parser.succeed(84))
          .parse('y'),
      ).toEqual(Right(84));
    });

    it('should not recover when the initial parser does consume some input', () => {
      expect(
        string('xy')
          .flatMap(() => Parser.succeed(42))
          .orElse(() => Parser.succeed(84))
          .parse('x').isLeft,
      ).toBe(true);
    });

    it('should recover from second failure when the first parser does not consume', () => {
      expect(
        char('x' as Char)
          .flatMap(() => Parser.fail(''))
          .orElse(() => Parser.succeed(84))
          .parse('y'),
      ).toEqual(Right(84));
    });

    it('should not recover from second failure when the first parser does consume', () => {
      expect(
        char('x' as Char)
          .flatMap(() => Parser.fail(''))
          .orElse(() => Parser.succeed(84))
          .parse('x').isLeft,
      ).toBe(true);
    });
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
      expect(anyChar.rep1().complete().parse(input).isRight).toBe(true);
    });
  });

  describe('expressions', () => {
    const add = (x: number, y: number) => x + y;
    const sub = (x: number, y: number) => x - y;
    const mul = (x: number, y: number) => x * y;
    const div = (x: number, y: number) => x / y;
    const exp = (x: number, y: number) => x ** y;

    /* eslint-disable prettier/prettier */
    const addOp =   char('+' as Char).as(add)
      ['<|>'](() => char('-' as Char).as(sub));
    const mulOp =   char('*' as Char).as(mul)
      ['<|>'](() => char('/' as Char).as(div));
    const expOp =   char('^' as Char).as(exp)

    const number = digit.rep1().map(xs => parseInt(xs.toArray.join('')));

    const atom: Parser<StringSource, number> =
      number['<|>'](() => parens(Parser.defer(() => expr)))
        .surroundedBy(spaces);
    const factor: Parser<StringSource, number> =
      atom.chainLeft1(expOp);
    const term: Parser<StringSource, number> =
      factor.chainLeft1(mulOp);
    const expr: Parser<StringSource, number> =
      term.chainLeft1(addOp);
    /* eslint-enable prettier/prettier */

    it.each`
      expr                      | result
      ${'12'}                   | ${12}
      ${'1+1'}                  | ${2}
      ${'4*3'}                  | ${12}
      ${'2+4*3'}                | ${14}
      ${'(2+4)*3'}              | ${18}
      ${'2^3^3'}                | ${512}
      ${'( 2 +   4 ) *   3   '} | ${18}
    `('should parse "$expr" into $result', ({ expr: e, result }) => {
      expect(expr.chainLeft1(addOp).parse(e)).toEqual(Right(result));
    });

    it('should be stack safe', () => {
      const input = '1' + '+1'.repeat(50_000);

      expect(expr.complete().parse(input)).toEqual(Right(50_001));
    });
  });

  describe('message formatting', () => {
    it("should print unexpected '3', expecting space or ','", () => {
      expect(
        digit
          .sepBy(char(',' as Char).surroundedBy(spaces))
          .complete()
          .parse('1, 2 3')
          .leftMap(e => e.toString()).getLeft,
      ).toEqual(`(line: 1, column: 6)
unexpected '3'
expecting space or ','`);
    });

    it('should print expecting digit', () => {
      const number = digit.rep1().map(xs => parseInt(xs.toArray.join('')));

      // prettier-ignore
      const addOp =   char('+' as Char).as((x: number, y: number) => x + y)
        ['<|>'](() => char('-' as Char).as((x: number, y: number) => x - y));

      const expr = number.chainLeft1(addOp).complete();

      expect(expr.parse('1+1+').leftMap(p => p.toString())).toEqual(
        Left(`(line: 1, column: 5)
unexpected end of input
expecting digit`),
      );
    });
  });
});
