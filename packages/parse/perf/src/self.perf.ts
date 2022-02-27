// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Char } from '@fp4ts/core';
import { text } from '@fp4ts/parse-text';
import { timed } from './common/timed';

const number = text
  .digit()
  .rep1()
  .map(xs => parseInt(xs.toArray.join('')));

// prettier-ignore
const addOp =   text.char('+' as Char).as((x: number, y: number) => x + y)
  ['<|>'](() => text.char('-' as Char).as((x: number, y: number) => x - y));

const expr = number.chainLeft1(addOp).complete();
const parse = (input: string) => expr.parse(input).leftMap(e => e.toString());

{
  const input = '1' + '+1'.repeat(50_000);
  timed('sequence of 1+1+..+1', () => console.log(parse(input)));
}
{
  const input = '1' + '+1'.repeat(50_000) + '+';
  timed('sequence of 1+1+..+1+ (Error)', () => console.log(parse(input)));
}

{
  const input = '1' + '+1-1'.repeat(25_000);
  timed('sequence of 1+1-1+1-1+..-1', () => console.log(parse(input)));
}

{
  const input = '1' + '+1-1'.repeat(25_000) + '-';
  timed('sequence of 1+1-1+1-1+..-1- (Error)', () => console.log(parse(input)));
}

{
  const input = 'a'.repeat(1_000_000);
  timed('sequence of "aa"s plain parse', () =>
    console.log(text.string('aa').rep().complete().parse(input).isRight),
  );
}
{
  const input = 'a'.repeat(1_000_000);
  timed('sequence of "a"s tokenPrim parse', () =>
    console.log(
      text
        .char('a' as Char)
        .rep()
        .complete()
        .parse(input).isRight,
    ),
  );
}
{
  const input = 'a'.repeat(1_000_000);
  timed('sequence of "aa"s prim parse', () =>
    console.log(text.stringF('aa').rep().complete().parse(input).isRight),
  );
}
