// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Char } from '@fp4ts/core';
import {
  Identity,
  IdentityF,
  LazyList,
  List,
  Monad,
  Right,
  Some,
} from '@fp4ts/cats';
import {
  ArraySource,
  Parser,
  ParserT,
  SourcePosition,
} from '@fp4ts/parse-core';
import { HasTokenType, Stream } from '@fp4ts/parse-kernel';
import { text } from '@fp4ts/parse-text';

function expressions<S extends HasTokenType<Char>>(): Parser<S, number> {
  const add = (x: number, y: number) => x + y;
  const sub = (x: number, y: number) => x - y;
  const mul = (x: number, y: number) => x * y;
  const div = (x: number, y: number) => x / y;
  const exp = (x: number, y: number) => x ** y;

  const addOp = text
    .char<S>('+' as Char)
    .as(add)
    ['<|>'](text.char<S>('-' as Char).as(sub));
  const mulOp = text
    .char<S>('*' as Char)
    .as(mul)
    ['<|>'](text.char<S>('/' as Char).as(div));
  const expOp = text.char<S>('^' as Char).as(exp);
  const number = text
    .digit<S>()
    .rep1()
    .map(xs => parseInt(xs.toArray.join('')));

  const atom: Parser<S, number> = number['<|>'](
    text.parens(Parser.defer(() => expr)),
  ).surroundedBy(text.spaces());
  const factor: Parser<S, number> = atom.chainLeft1(expOp);
  const term: Parser<S, number> = factor.chainLeft1(mulOp);
  const expr: Parser<S, number> = term.chainLeft1(addOp);

  return expr;
}

describe('Array source', () => {
  const expr = expressions<ArraySource<Char>>();

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
    expect(
      expr.complete().parseSource(ArraySource.fromArray(e.split(''))).value,
    ).toEqual(Right(result));
  });
});

describe('List source', () => {
  const expr = expressions<List<Char>>();

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
    expect(
      expr
        .complete()
        .parseStream(Stream.forList(Monad.Eval), List.fromArray(e.split('')))
        .value,
    ).toEqual(Right(result));
  });
});

describe('LazyList source', () => {
  const expr = expressions<LazyList<Char>>();

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
    expect(
      expr
        .complete()
        .parseStream(
          Stream.forLazyList(Monad.Eval),
          LazyList.fromArray(e.split('')),
        ).value,
    ).toEqual(Right(result));
  });

  it('is lazy with list evaluation', () => {
    let cnt = 0;
    const xs = LazyList(1, 2, 3, 4).map(x => (cnt++, x));

    const anyNum = ParserT.tokenPrim<LazyList<number>, IdentityF, number>(
      String,
      (pos, _t, _s) => new SourcePosition(1, pos.column + 1),
      Some,
    );

    expect(
      anyNum
        .product(anyNum)
        .parseStream(Stream.forLazyList(Identity.Monad), xs),
    ).toEqual(Right([1, 2]));
    expect(cnt).toBe(2);
  });
});
