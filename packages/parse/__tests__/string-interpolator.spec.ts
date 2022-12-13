// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { EvalF, Right } from '@fp4ts/cats';
import { Parser, StringSource } from '@fp4ts/parse-core';
import { parser, text } from '@fp4ts/parse-text';

const { digit, string } = text;

describe('String Interpolator', () => {
  it('should parse an empty input', () => {
    expect(parser``.complete().parse('').value).toEqual(Right([]));
  });

  it('should produce an empty array without any parsers', () => {
    const p: Parser<StringSource, []> = parser`foo`;
    expect(p.complete().parse('foo').value).toEqual(Right([]));
  });

  it('should produce a single parser interpolation', () => {
    const world = string('World').as(42);
    const p: Parser<StringSource, [number]> = parser`Hello ${world}!`;

    expect(p.complete().parse('Hello World!').value).toEqual(Right([42]));
  });

  it('should produce a multiple parser interpolation', () => {
    // prettier-ignore
    const foo: Parser<StringSource, boolean> = string('spam').as(true)['<|>'](string('eggs').as(false));
    // prettier-ignore
    const bar: Parser<StringSource, number> = digit().repAs1('', (x, y) => x + y).map(parseInt);
    // prettier-ignore
    const quxx: Parser<StringSource, number> = parser`quxx`.as(42);

    // prettier-ignore
    const arrow: Parser<StringSource, [boolean, number, number]> =
      parser`${foo},${bar} -> ${quxx}`;

    expect(arrow.complete().parse('spam,1234 -> quxx').value).toEqual(
      Right([true, 1234, 42]),
    );
    expect(arrow.complete().parse('eggs,1234 -> quxx').value).toEqual(
      Right([false, 1234, 42]),
    );
  });

  it('should compose with parser consuming no input', () => {
    expect(
      parser`foo${Parser.unit<StringSource, EvalF>()}`.complete().parse('foo')
        .value,
    ).toEqual(Right([undefined]));
  });

  it('should wrap a single parser consuming no input', () => {
    expect(
      parser`${Parser.unit<StringSource, EvalF>()}`.complete().parse('').value,
    ).toEqual(Right([undefined]));
  });

  it('should wrap a multiple parsers consuming no input', () => {
    expect(
      parser`${Parser.unit<StringSource, EvalF>()}${Parser.unit<
        StringSource,
        EvalF
      >()}`
        .complete()
        .parse('').value,
    ).toEqual(Right([undefined, undefined]));
  });
});
