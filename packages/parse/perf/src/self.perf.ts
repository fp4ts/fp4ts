// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Char } from '@fp4ts/core';
import { char, digit } from '@fp4ts/parse-text';
import { timed } from './common/timed';

const number = digit.rep1().map(xs => parseInt(xs.toArray.join('')));

// prettier-ignore
const addOp =   char('+' as Char).as((x: number, y: number) => x + y)
  ['<|>'](() => char('-' as Char).as((x: number, y: number) => x - y));

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
