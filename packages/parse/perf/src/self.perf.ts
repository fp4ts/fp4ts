import { Char } from '@fp4ts/core';
import { char, digit } from '@fp4ts/parse-text';

const number = digit.rep1().map(xs => parseInt(xs.toArray.join('')));

const addOp = char('+' as Char)
  .as((x: number, y: number) => x + y)
  ['<|>'](() => char('-' as Char).as((x: number, y: number) => x - y));

const expr = number.chainLeft1(addOp);

const input = '1' + '+1'.repeat(50_000);

const start = Date.now();
console.log(expr.parse(input));
const end = Date.now();

console.log(end - start);